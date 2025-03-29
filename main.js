const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const loader = new THREE.GLTFLoader();

let platform1, platform2, whiteCube, whiteCube2, whiteLight, whiteCube2Light, newWhiteCube1, newWhiteCube2, newWhiteLight1, newWhiteLight2, newWhiteLight3, newWhiteLight4;

const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, opacity: 0, transparent: true});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = -7.3;
cube.castShadow = true;
scene.add(cube);

const pointLightYellow = new THREE.PointLight(0xffff00, 100, 100, 150);
pointLightYellow.position.copy(cube.position);
pointLightYellow.castShadow = true;
scene.add(pointLightYellow);

const pointLightPink = new THREE.PointLight(0xff00ff, 100, 100, 150);
pointLightPink.position.set(cube.position.x, 8.5, cube.position.z);
pointLightPink.castShadow = true;
pointLightPink.visible = false;
scene.add(pointLightPink);

loader.load('assets/22.gltf', (gltf) => {
    platform1 = gltf.scene;
    const box = new THREE.Box3().setFromObject(platform1);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scaleFactor = 25 / Math.max(size.x, size.y, size.z);
    platform1.scale.set(scaleFactor, scaleFactor, scaleFactor);
    platform1.position.set(-2.25, -7.9, -2.4);
    scene.add(platform1);
});

loader.load('assets/33.gltf', (gltf) => {
    platform2 = gltf.scene;
    const box = new THREE.Box3().setFromObject(platform2);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scaleFactor = 25 / Math.max(size.x, size.y, size.z);
    platform2.scale.set(scaleFactor, scaleFactor, scaleFactor);
    platform2.position.set(-2.25, 7.65, -2.4);
    scene.add(platform2);

    const whiteCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });
    whiteCube = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
    whiteCube.position.set(-3.6, 7.9, -6.6);
    whiteCube.castShadow = true;
    scene.add(whiteCube);

    whiteLight = new THREE.PointLight(0xffffff, 50, 50, 100);
    whiteLight.position.copy(whiteCube.position);
    whiteLight.castShadow = true;
    scene.add(whiteLight);
});

const ambientLight = new THREE.AmbientLight(0x555555, 3.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const offset = new THREE.Vector3(-3, 2, 5);
camera.position.copy(cube.position).add(offset);
camera.rotation.y = Math.PI / 4;
camera.lookAt(cube.position);

const movementStages = [
    { axis: "z", distance: -3 },
    { axis: "x", distance: -3.7 },
    { axis: "z", distance: -5 },
    { axis: "z", distance: -7.5 },
    { axis: "x", distance: -1.5 },
    { axis: "z", distance: -9.3 },
    { axis: "z", distance: -13 },
    { axis: "x", distance: 0 },
    { axis: "z", distance: -18 },
    { axis: "x", distance: -3.6 },
    { axis: "z", distance: -20 },
];

let currentStage = 0;
const speed = 0.015;
let targetPosition = null;
let isScrolling = false;
let lastScrollTime = 0;
let scrollDirection = 0;
let canMoveCube = true;
let isMoving = false;
let movementBlocked = true;
let isCubeInteractionAllowed = true;
const cameraTargetPosition = new THREE.Vector3();
const cameraCurrentPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(-1.5, 1, 2.5);
const cameraLagFactor = 0.1;
const cameraSwingAmplitude = 0.05;
const cameraSwingSpeed = 2; 

function startMovement(direction) {
    if (isCubeInteractionAllowed && !isMoving && direction === 1 && currentStage < movementStages.length - 1) {
        if (currentStage === 2 && movementBlocked) {
            return;
        }
        currentStage++;
        const movement = movementStages[currentStage];
        targetPosition = movement.axis === "x" ? { x: movement.distance } : { z: movement.distance };
        isMoving = true;
    }
}

function startMovement(direction) {

    if (!canMoveCube || !isCubeInteractionAllowed || isMoving || direction !== 1 || currentStage >= movementStages.length - 1) {
        return;
    }

    if (currentStage === 2 && movementBlocked) {
        return;
    }

    currentStage++;
    const movement = movementStages[currentStage];
    targetPosition = movement.axis === "x" ? { x: movement.distance } : { z: movement.distance };
    isMoving = true;
}

function moveCube() {
    if (!targetPosition) return;

    const movement = movementStages[currentStage];
    const axis = movement.axis;
    const target = targetPosition[axis];

    cube.position[axis] += speed * Math.sign(target - cube.position[axis]);
    pointLightYellow.position.set(cube.position.x, cube.position.y, cube.position.z);
    pointLightPink.position.set(cube.position.x, 8.5, cube.position.z);

    if (Math.abs(cube.position[axis] - target) < .05) {
        cube.position[axis] = target;
        targetPosition = null;
        isMoving = false;
        

        if (axis === "z" && cube.position[axis] === -9.3) {
            canMoveCube = false;
            createNewWhiteCubes();
        }
        
        if (axis === "z" && cube.position[axis] === -13) {
            canMoveCube = false;
            createNewWhiteCubesAtZMinus14();
        }
    }
}

function createNewWhiteCubes() {
    const whiteCubeGeometry = new THREE.BoxGeometry(1.9, 1, 1.9);
    const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });

    newWhiteCube1 = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
    newWhiteCube1.position.set(cube.position.x, 8.2, -11);
    newWhiteCube1.castShadow = true;
    scene.add(newWhiteCube1);

    newWhiteLight1 = new THREE.PointLight(0xffffff, 50, 50, 100);
    newWhiteLight1.position.set(newWhiteCube1.position.x, newWhiteCube1.position.y, newWhiteCube1.position.z);
    newWhiteLight1.castShadow = true;
    scene.add(newWhiteLight1);

    window.addEventListener('click', handleNewWhiteCube1Click);
}

function handleNewWhiteCube1Click(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(newWhiteCube1);
    if (intersects.length > 0) {
        scene.remove(newWhiteCube1);
        scene.remove(newWhiteLight1);

        const whiteCubeGeometry = new THREE.BoxGeometry(0.9, 1, 0.9);
        const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });
        newWhiteCube2 = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
        newWhiteCube2.position.set(newWhiteCube1.position.x, -7.3, -11);
        newWhiteCube2.castShadow = true;
        scene.add(newWhiteCube2);

        newWhiteLight2 = new THREE.PointLight(0xffffff, 50, 50, 100);
        newWhiteLight2.position.set(newWhiteCube2.position.x, newWhiteCube2.position.y, newWhiteCube2.position.z);
        newWhiteLight2.castShadow = true;
        scene.add(newWhiteLight2);

        window.addEventListener('click', handleNewWhiteCube2Click);
    }
}

function handleNewWhiteCube2Click(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(newWhiteCube2);
    if (intersects.length > 0) {

        scene.remove(newWhiteCube2);
        scene.remove(newWhiteLight2);


        window.removeEventListener('click', handleNewWhiteCube2Click);


        newWhiteCube2 = null;
        newWhiteLight2 = null;


        loader.load('assets/24.gltf', (gltf) => {
            if (platform1) {
                scene.remove(platform1);
            }

            platform1 = gltf.scene;
            const box = new THREE.Box3().setFromObject(platform1);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleFactor = 25 / Math.max(size.x, size.y, size.z);
            platform1.scale.set(scaleFactor, scaleFactor, scaleFactor);
            platform1.position.set(-2.3, -7.9, -2.4);
            scene.add(platform1);
            movementBlocked = false;
            canMoveCube = true;
        });
    }
}

function createNewWhiteCubesAtZMinus14() {
    const whiteCubeGeometry = new THREE.BoxGeometry(1.9, 1, 1.9);
    const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });

    const newWhiteCube3 = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
    newWhiteCube3.position.set(cube.position.x + 1.5, 8.2, -15);
    newWhiteCube3.castShadow = true;
    scene.add(newWhiteCube3);

    newWhiteLight3 = new THREE.PointLight(0xffffff, 50, 50, 100); 
    newWhiteLight3.position.set(newWhiteCube3.position.x, newWhiteCube3.position.y, newWhiteCube3.position.z);
    newWhiteLight3.castShadow = true;
    scene.add(newWhiteLight3);

    window.addEventListener('click', (event) => handleNewWhiteCube3Click(event, newWhiteCube3, newWhiteLight3));
}


function addNewWhiteCube3ClickHandler(newWhiteCube3, newWhiteLight3) {
    const handler = (event) => handleNewWhiteCube3Click(event, newWhiteCube3, newWhiteLight3, handler);
    window.addEventListener('click', handler);
}


let isLastCubeCreated = false;

function handleNewWhiteCube3Click(event, whiteCube, whiteLight, handler) {
    if (isLastCubeCreated) return; 

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(whiteCube);
    if (intersects.length > 0) {
      
        scene.remove(whiteCube);
        scene.remove(whiteLight);

  
        window.removeEventListener('click', handler);

 
        const whiteCubeGeometry = new THREE.BoxGeometry(0.9, 1, 0.9);
        const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });
        const newWhiteCube4 = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
        newWhiteCube4.position.set(whiteCube.position.x + 0.3, -7.3, -14.5);
        newWhiteCube4.castShadow = true;
        scene.add(newWhiteCube4);

    
        newWhiteLight4 = new THREE.PointLight(0xffffff, 50, 50, 100);
        newWhiteLight4.position.set(newWhiteCube4.position.x, newWhiteCube4.position.y, newWhiteCube4.position.z);
        newWhiteLight4.castShadow = true;
        scene.add(newWhiteLight4);

       
        addNewWhiteCube4ClickHandler(newWhiteCube4, newWhiteLight4);

       
        isLastCubeCreated = true;
    }
}

function addNewWhiteCube4ClickHandler(newWhiteCube4, newWhiteLight4) {
    const handler = (event) => handleNewWhiteCube4Click(event, newWhiteCube4, newWhiteLight4, handler);
    window.addEventListener('click', handler);
}

function handleNewWhiteCube4Click(event, whiteCube, whiteLight, handler) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(whiteCube);
    if (intersects.length > 0) {
       
        scene.remove(whiteCube);
        scene.remove(whiteLight);
 
        window.removeEventListener('click', handler);

        loader.load('assets/25.gltf', (gltf) => {
            if (platform1) {
                scene.remove(platform1);
            }

            platform1 = gltf.scene;
            const box = new THREE.Box3().setFromObject(platform1);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleFactor = 25 / Math.max(size.x, size.y, size.z);
            platform1.scale.set(scaleFactor, scaleFactor, scaleFactor);
            platform1.position.set(-2.3, -7.9, -2.4);
            scene.add(platform1);

         
            movementBlocked = false;
            canMoveCube = true;
        });

        isLastCubeCreated = true;
    }
}

let lastTap = 0;
let touchstartX = 0;
let touchstartY = 0;

window.addEventListener('touchstart', (event) => {
    touchstartX = event.touches[0].clientX;
    touchstartY = event.touches[0].clientY;
    
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    lastTap = currentTime;
    
    if (tapLength < 300 && tapLength > 0) {
        toggleCubeState();
    }
}, false);

window.addEventListener('touchend', (event) => {
    const touchendX = event.changedTouches[0].clientX;
    const touchendY = event.changedTouches[0].clientY;
    
    const deltaX = touchendX - touchstartX;
    const deltaY = touchendY - touchstartY;
    
    if (Math.abs(deltaX) < Math.abs(deltaY)) {
        if (deltaY < -50) {
            startMovement(1);
        }
    }
}, false);

window.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.deltaY > 0) {
        startMovement(1);
    }
}, { passive: false });

window.addEventListener("dblclick", (event) => {
    toggleCubeState();
});

function toggleCubeState() {
    if (isMoving) {
        event.preventDefault();
        return;
    }
    
    if (cube.position.y === -7.3) {
        cube.position.y = 8.2;
        cube.material.color.set(0xff00ff);
        pointLightYellow.visible = false;
        pointLightPink.visible = true;
        isCubeInteractionAllowed = false;
    } else {
        cube.position.y = -7.3;
        cube.material.color.set(0xffff00);
        pointLightYellow.visible = true;
        pointLightPink.visible = false;
        isCubeInteractionAllowed = true; 
    }
}

const whiteCube2Position = { x: -2.7, y: -7.2, z: -5 };

window.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(whiteCube);
    if (intersects.length > 0) {
        scene.remove(whiteCube);
        scene.remove(whiteLight);
        movementBlocked = true;
        canMoveCube = false;

        const whiteCubeGeometry = new THREE.BoxGeometry(0.5, 0.9, 0.5);
        const whiteCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.001 });
        whiteCube2 = new THREE.Mesh(whiteCubeGeometry, whiteCubeMaterial);
        whiteCube2.position.set(whiteCube2Position.x, whiteCube2Position.y, whiteCube2Position.z);
        whiteCube2.castShadow = true;
        scene.add(whiteCube2);

        whiteCube2Light = new THREE.PointLight(0xffffff, 50, 50, 100);
        whiteCube2Light.position.set(whiteCube2.position.x, whiteCube2.position.y, whiteCube2.position.z);
        whiteCube2Light.castShadow = true;
        scene.add(whiteCube2Light);

        window.addEventListener('click', handleWhiteCube2Click);
    }
});

function handleWhiteCube2Click(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(whiteCube2);
    if (intersects.length > 0) {
        scene.remove(whiteCube2);
        scene.remove(whiteCube2Light);

        scene.remove(platform1);
        loader.load('assets/23.gltf', (gltf) => {
            platform1 = gltf.scene;
            const box = new THREE.Box3().setFromObject(platform1);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleFactor = 25 / Math.max(size.x, size.y, size.z); 
            platform1.scale.set(scaleFactor, scaleFactor, scaleFactor); 
            platform1.position.set(-2.3, -7.9, -2.4); 
            scene.add(platform1);
            movementBlocked = false;
            canMoveCube = true;
        });

        window.removeEventListener('click', handleWhiteCube2Click);
    }
}

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ size: 0.05, transparent: true });

const numStars = 5000;
const positions = new Float32Array(numStars * 3);
const velocities = new Float32Array(numStars);

for (let i = 0; i < numStars; i++) {
    positions[i * 3] = Math.random() * 100 - 50;
    positions[i * 3 + 1] = Math.random() * 20 - 10;
    positions[i * 3 + 2] = Math.random() * 100 - 50;
    velocities[i] = (Math.random() - 0.5) * 0.02;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

scene.fog = new THREE.Fog(0x000000, 5, 20);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function animateStars() {
    const positions = starGeometry.attributes.position.array;

    for (let i = 0; i < numStars; i++) {
        positions[i * 3 + 1] += velocities[i];
        if (positions[i * 3 + 1] > 10) velocities[i] = -Math.abs(velocities[i]);
        if (positions[i * 3 + 1] < -10) velocities[i] = Math.abs(velocities[i]);
    }

    starGeometry.attributes.position.needsUpdate = true;
}

function updateStarColors() {
    if (cube.position.y > 0) {
        starMaterial.color.set(0xff00ff);
    } else {
        starMaterial.color.set(0xffff00);
    }
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    moveCube();
    animateStars();
    updateStarColors();

    camera.position.set(cube.position.x - 1.5, cube.position.y + 1, cube.position.z + 2.5);
    camera.lookAt(cube.position);

    const time = clock.getElapsedTime();
    const intensity = (Math.sin(time * 4) * 0.5 + 0.5) * 50;

    if (whiteLight) {
        whiteLight.intensity = intensity;
    }
    if (whiteCube2Light) {
        whiteCube2Light.intensity = intensity;
    }
    if (newWhiteLight1) {
        newWhiteLight1.intensity = intensity;
    }
    if (newWhiteLight2) {
        newWhiteLight2.intensity = intensity;
    }
    if (newWhiteLight3) { 
        newWhiteLight3.intensity = intensity;
    }
    if (newWhiteLight4) { 
        newWhiteLight4.intensity = intensity;
    }

    renderer.render(scene, camera);
}

animate();

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

let isFirstSwipe = true;

function hideOverlay() {
    const darkBlur = document.getElementById('dark-blur');
    const overlay = document.getElementById('overlay');

    if (darkBlur) {
        darkBlur.style.opacity = '0'; 
    }

    if (overlay) {
        overlay.classList.add('hidden'); 
    }

    setTimeout(() => {
        if (darkBlur) {
            darkBlur.remove(); 
        }
        if (overlay) {
            overlay.remove(); 
        }
    }, 50); 

    isFirstSwipe = false;
}

window.addEventListener('touchend', () => {
    if (isFirstSwipe) {
        hideOverlay();
    }
});

window.addEventListener('wheel', () => {
    if (isFirstSwipe) {
        hideOverlay();
    }
});

function showStep2() {
    const darkBlurStep2 = document.getElementById('dark-blur-step2');
    const overlayStep2 = document.getElementById('overlay-step2');

    if (darkBlurStep2 && overlayStep2) {
        setTimeout(() => {
            darkBlurStep2.style.opacity = '1';
            overlayStep2.style.opacity = '1';

            window.addEventListener('dblclick', hideStep2);

            window.addEventListener('touchend', handleMobileTouch);
        }, 2800); 
    }
}

function handleMobileTouch(event) {

    if (event.detail === 2) { 
        hideStep2();
    }
}

function hideStep2() {
    const darkBlurStep2 = document.getElementById('dark-blur-step2');
    const overlayStep2 = document.getElementById('overlay-step2');

    if (darkBlurStep2 && overlayStep2) {
        darkBlurStep2.style.opacity = '0';
        overlayStep2.style.opacity = '0';

        setTimeout(() => {
            darkBlurStep2.remove();
            overlayStep2.remove();
        }, 50); 
    }

    window.removeEventListener('dblclick', hideStep2);
    window.removeEventListener('touchend', handleMobileTouch);
}


function checkThirdStep() {
    if (currentStage === 2) {
        showStep2();
    }
}

function monitorSteps() {
    requestAnimationFrame(monitorSteps);

    checkThirdStep();
}

monitorSteps();

function animate() {
    requestAnimationFrame(animate);

    moveCube();
    animateStars();
    updateStarColors();

    cameraTargetPosition.copy(cube.position).add(cameraOffset);

    const time = clock.getElapsedTime();
    const swingX = Math.sin(time * cameraSwingSpeed) * cameraSwingAmplitude;
    const swingY = Math.cos(time * cameraSwingSpeed) * cameraSwingAmplitude;

    cameraTargetPosition.x += swingX;
    cameraTargetPosition.y += swingY;

    cameraCurrentPosition.lerp(cameraTargetPosition, cameraLagFactor);

    camera.position.copy(cameraCurrentPosition);
    camera.lookAt(cube.position);

    const intensity = (Math.sin(time * 4) * 0.5 + 0.5) * 50;

    if (whiteLight) {
        whiteLight.intensity = intensity;
    }
    if (whiteCube2Light) {
        whiteCube2Light.intensity = intensity;
    }
    if (newWhiteLight1) {
        newWhiteLight1.intensity = intensity;
    }
    if (newWhiteLight2) {
        newWhiteLight2.intensity = intensity;
    }
    if (newWhiteLight3) {
        newWhiteLight3.intensity = intensity;
    }
    if (newWhiteLight4) {
        newWhiteLight4.intensity = intensity;
    }

    renderer.render(scene, camera);
}

const modelsToLoad = [
    'assets/22.gltf',
    'assets/33.gltf',
    'assets/24.gltf',
    'assets/25.gltf',
    'assets/23.gltf',
  ];
  
  let loadedModels = [];
  
  function loadModels() {
    const loadPromises = modelsToLoad.map((url) => {
      return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
          loadedModels.push(gltf.scene);
          resolve();
        }, undefined, (error) => {
          reject(`Ошибка ${url}: ${error}`);
        });
      });
    });
  
    return Promise.all(loadPromises);
  }
  
  loadModels().then(() => {
    document.getElementById('loading-screen').style.display = 'none';
    initScene(); 
  }).catch((error) => {
  });  

  function showFinalMenu() {
    const customBlur = document.getElementById('custom-dark-blur');
    const customOverlay = document.getElementById('custom-overlay');
    const customText = document.getElementById('custom-text');

    if (customBlur && customOverlay && customText) {
        customBlur.style.opacity = '1'; 
        customText.classList.add('visible'); 

        customText.addEventListener('click', () => {
            location.reload();
        });
    } else {
        console.error("Элементы меню не найдены");
    }
}

function checkCubePositionForFinalStep() {
    if (Math.abs(cube.position.z - (-20)) < 0.1) { 
        showFinalMenu(); 
    }
}

function animateCustom() {
    requestAnimationFrame(animateCustom);
    moveCube();
    checkCubePositionForFinalStep(); 
    renderer.render(scene, camera); 
}

animateCustom();