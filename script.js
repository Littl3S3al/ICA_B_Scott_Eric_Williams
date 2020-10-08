import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';



// variables for event listeners
const beginBtn = document.querySelector('#btn-begin');
const overlay = document.querySelector('#overlay');
const threeJsWindow = document.querySelector('#three-js-container');
const popupWindow = document.querySelector('.popup-window');
const closeBtn = document.querySelector('#btn-close');

let currentObject;

// loader
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let orbiting = false;
let viewing = false;



// three.js functions
const main  = () => {
    const canvas = document.querySelector('#c');

    // renderer
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // bring in audio listener
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();

    // camera
    const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 0, 400, 400 );


    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    scene.fog = new THREE.FogExp2( 0x000000, 0.0005 );

    // controls
    const controls = new OrbitControls( camera, renderer.domElement );
 //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 700;
    controls.maxPolarAngle = Math.PI / 2;

    

    // loaders
    const loadManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadManager);
    const cubeTextureLoader = new THREE.CubeTextureLoader(loadManager);

    const addPointLight = (shade, intense, parent, angle, far, top, distance) => {
        const color = shade;
        const intensity = intense;
        const light = new THREE.SpotLight(color, intensity);
        light.castShadow = true;
        light.position.set(0, top, 0);
        light.target.position.set(-4, 0, -4);
        light.penumbra = 1;
        light.angle = angle;
        light.far = far;
        light.distance = distance;
        parent.add(light);
        parent.add(light.target);
    }

    addPointLight(0xFFFFFF, 1, scene, 10, 500, 500, 1000);

    scene.add( new THREE.AmbientLight( 0xffffff, 0.6 ) );

    // set up ground plane
    const groundSize = 3000;
    const groundTexture = textureLoader.load('assets/grid.png');
    groundTexture.magFilter = THREE.NearestFilter;
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    const repeats = groundSize / 80;
    groundTexture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneBufferGeometry(groundSize, groundSize);
    const planeMat = new THREE.MeshPhongMaterial({map: groundTexture});
    planeMat.transparent = true;
    planeMat.alphaTest = 0.1;

    const mapMesh = new THREE.Mesh(planeGeo, planeMat);
    mapMesh.receiveShadow = true;
    mapMesh.rotation.x = Math.PI * -.5;
    mapMesh.rotation.z = Math.PI/180 *45;
    mapMesh.position.y = -2;

    
    // add in random pyramids
    const beaconTexture = textureLoader.load('assets/grid.png');
    beaconTexture.magFilter = THREE.NearestFilter;
    beaconTexture.wrapS = THREE.RepeatWrapping;
    beaconTexture.wrapT = THREE.RepeatWrapping;
    const beaconrepeats = 2;
    beaconTexture.repeat.set(beaconrepeats, beaconrepeats);
    var material = new THREE.MeshPhongMaterial( { map: beaconTexture, color: 0xffffff } );

    for ( var i = 0; i < 100; i ++ ) {
        var height = Math.random() * 50;
        var geometry = new THREE.CylinderBufferGeometry( 0, 40, height, 4, 1 );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = Math.random() * 1600 - 800;
        mesh.position.y = height/2;
        mesh.position.z = Math.random() * 1600 - 800;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        scene.add( mesh );

    }

    // add 5 planes
    var photos = [];
    var positions = [
        {x: -300, z: 0}, {x: -100, z: -300}, {x: 100, z: -250}, {x: 400, z: 10}, {x: 200, z: 100}
    ]
    for ( var i = 0; i < 5; i ++){
        var texture = textureLoader.load(`assets/${i+1}.png`);
        var photoMaterial = new THREE.MeshBasicMaterial({map: texture});
        photoMaterial.transparent = true;
        photoMaterial.alphaTest = 0.1;
        material.side = THREE.DoubleSide;
        var width = 80;
        var height = 80;
        var geometry = new THREE.PlaneBufferGeometry(width, height);

        var beaconGeometry = new THREE.CylinderBufferGeometry( 0, 40, 90, 4, 1 );
        var mesh = new THREE.Mesh( beaconGeometry, material );
        mesh.position.y = 45;
        mesh.position.x = positions[i].x;
        mesh.position.z = positions[i].z;

        scene.add(mesh);

        var photoMesh = new THREE.Mesh(geometry, photoMaterial);
        photoMesh.name = i;
        photoMesh.position.y = height/2 + 110;
        photoMesh.position.x = positions[i].x;
        photoMesh.position.z = positions[i].z;
        photos.push(photoMesh);
        photoMesh.lookAt(0, height/2 + 55, 0);
    }


    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';
        scene.add(mapMesh); 
        photos.forEach( photo => {
            scene.add(photo);
        })
        
    };

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal*100;
        progressBarElem.style.width = progress + '%';
    };


    
  class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.raycaster.far = 300;
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject = undefined;
      }

      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
      }
    }
  }

  const pickPosition = {x: 0, y: 0};
  const pickHelper = new PickHelper();
  clearPickPosition();

    

    renderer.render( scene, camera );

    // resize function
    const onWindowResize = () => {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
    
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    
    }

    const render = (time) => {
        currentObject = undefined;
        let itemSelected = false;
        time *= 0.0001;
        window.addEventListener('resize', onWindowResize, false);

        photos.forEach(photo => {
            photo.lookAt(camera.position);
        })

        pickHelper.pick(pickPosition, scene, camera, time);
        
        if(pickHelper.pickedObject && !orbiting){
            if(pickHelper.pickedObject.name){
                currentObject = pickHelper.pickedObject.name;
                itemSelected = true;

            }
        }
        
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.render(scene, camera);

        requestAnimationFrame(render);


        
    }

    requestAnimationFrame(render);
    controls.update();

    const pinkColor = (object, blue) => {
        let g = object.material.color.g;
        if( g < 1 && !blue){ g += 0.005 };
        if( g > 0.5 && blue){ g -= 0.005 };
        object.material.color.setRGB(1, g, 1);
    }


    function getCanvasRelativePosition(event) {
		const rect = canvas.getBoundingClientRect();
		return {
		x: (event.clientX - rect.left) * canvas.width  / rect.width,
		y: (event.clientY - rect.top ) * canvas.height / rect.height,
		};
	}

	function setPickPosition(event) {
		const pos = getCanvasRelativePosition(event);
		pickPosition.x = (pos.x /  canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
	}

	
    controls.addEventListener('change', () => {

        orbiting = true;

    });

	function clearPickPosition() {
		// unlike the mouse which always has a position
		// if the user stops touching the screen we want
		// to stop picking. For now we just pick a value
		// unlikely to pick something
		pickPosition.x = -100000;
		pickPosition.y = -100000;
  }
  

    window.addEventListener('mousemove', setPickPosition);
	window.addEventListener('mouseout', clearPickPosition);
    window.addEventListener('mouseleave', clearPickPosition);
    window.addEventListener('mouseup', () => {
        orbiting = false;
    })


	window.addEventListener('touchstart', (event) => {
		// prevent the window from scrolling
		event.preventDefault();
        setPickPosition(event.touches[0]);
        checkForClick();
	}, {passive: false});

	window.addEventListener('touchmove', (event) => {
        setPickPosition(event.touches[0]);
        checkForClick();
	});

	window.addEventListener('touchend', () => {
        clearPickPosition();
        orbiting = false;
        checkForClick();
	})
}


// event listeners
beginBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    threeJsWindow.style.display = 'block';
    main();
});

beginBtn.addEventListener('touchend', () => {
    overlay.style.display = 'none';
    threeJsWindow.style.display = 'block';
    main();
});


// functions
window.addEventListener('mouseup', () => {
    checkForClick();
});

const checkForClick = () => {
    if(!orbiting &&!viewing && currentObject){
        
    }

    currentObject = undefined;
}



closeBtn.addEventListener('click', () => {
    closeWindow();
})
closeBtn.addEventListener('touchstart', () => {
    closeWindow();
})

function closeWindow() {
    popupWindow.style.opacity = 0;
    setTimeout(() => {
        popupWindow.style.zIndex = -10;
    }, 1200)
    viewing = false;
}
function openWindow(){
    popupWindow.style.opacity = 1;
    popupWindow.style.zIndex = 100;
    viewing = true;
}