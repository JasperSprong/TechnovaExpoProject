import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// === Scene ===
const scene = new THREE.Scene();

// === Camera ===
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 5);

// === WebGL Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.zIndex = '1';
document.body.appendChild(renderer.domElement);

// === CSS3D Renderer ===
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.zIndex = '10';
document.body.appendChild(cssRenderer.domElement);

// === Controls ===
const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());
scene.add(controls.getObject());

controls.addEventListener('lock', () => console.log('Pointer locked'));
controls.addEventListener('unlock', () => console.log('Pointer unlocked'));

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff));

// === Movement Setup ===
const keys = {};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 5;

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// === Raycaster for Clicks ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === Sit-on-Chair Logic ===
let isSitting = false;
let chairPosition = new THREE.Vector3();
const sittingCameraPosition = new THREE.Vector3();
const sittingCameraLookAt = new THREE.Vector3();
let chairClickableBox = null;

// === Iframes and Clickable Boxes ===
let iframeObject, clickableBox;
let iframeObject2, clickableBox2;

// === Load GLB Model ===
const loader = new GLTFLoader();
loader.load('assets/3d_Models/Expositsie_House_blend.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // === Green clickable box ===
  clickableBox = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.6, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  clickableBox.name = 'iframeTrigger';
  clickableBox.position.set(-1.5, 3.6, -3.8);
  model.add(clickableBox);

  const iframe1 = document.createElement('iframe');
  iframe1.src = 'Portfolio_home.html?v=' + Date.now();
  iframe1.style.width = '800px';
  iframe1.style.height = '450px';
  iframe1.style.border = '0';
  iframe1.style.background = 'white';

  iframeObject = new CSS3DObject(iframe1);
  iframeObject.scale.set(0.01, 0.01, 0.01);
  iframeObject.position.set(0, 1.5, -1.2);
  iframeObject.visible = false;
  model.add(iframeObject);

  // === Blue clickable box ===
  clickableBox2 = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.6, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  clickableBox2.name = 'iframeTrigger2';
  clickableBox2.rotation.y = Math.PI / 2.55;
  clickableBox2.position.set(-3.5, 3.6, -2.3);
  model.add(clickableBox2);

  // === Container with iframe for blue box ===
  const container2 = document.createElement('div');
  container2.style.width = '800px'; // use fixed pixel size for consistent scaling
  container2.style.height = '450px';
  container2.style.display = 'flex';
  container2.style.alignItems = 'stretch';
  container2.style.justifyContent = 'stretch';
  container2.style.background = 'white';
  container2.style.border = 'none';
  container2.style.overflow = 'hidden';

  const iframe2 = document.createElement('iframe');
  iframe2.src = 'extraDetail.html?v=' + Date.now();
  iframe2.style.width = '100%';
  iframe2.style.height = '100%';
  iframe2.style.border = '0';

  container2.appendChild(iframe2);

  iframeObject2 = new CSS3DObject(container2);
  iframeObject2.scale.set(0.01, 0.01, 0.01);
  iframeObject2.position.set(0, 1.5, -1.2);
  iframeObject2.visible = false;
  model.add(iframeObject2);
});

// === Chair Clickable Box ===
chairClickableBox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1.2, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.25 })
);
chairClickableBox.name = 'chairClickBox';
chairClickableBox.position.set(-1.5, 3, -1);
scene.add(chairClickableBox);

chairPosition.copy(chairClickableBox.position);
sittingCameraPosition.copy(chairPosition).add(new THREE.Vector3(0, 1.2, 0));
sittingCameraLookAt.copy(chairPosition).add(new THREE.Vector3(0, 1, -2));

// === Toggle iframe over a box ===
function toggleIframe(iframeObj, boxObj) {
  iframeObj.position.copy(boxObj.getWorldPosition(new THREE.Vector3()));
  iframeObj.quaternion.copy(boxObj.getWorldQuaternion(new THREE.Quaternion()));

  const boxSize = new THREE.Vector3();
  new THREE.Box3().setFromObject(boxObj).getSize(boxSize);

  const iframeEl = iframeObj.element;
  let iframeWidth, iframeHeight;

  const rect = iframeEl.getBoundingClientRect();
  iframeWidth = rect.width || 800;
  iframeHeight = rect.height || 450;

  const scaleX = boxSize.x / iframeWidth;
  const scaleY = boxSize.y / iframeHeight;

  iframeObj.scale.set(scaleX, scaleY, 1);
  iframeObj.visible = !iframeObj.visible;

  if (iframeObj.visible) controls.unlock();
  else controls.lock();
}

// === Mouse click interaction ===
window.addEventListener('click', (event) => {
  if (!controls.isLocked) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [clickableBox, clickableBox2, chairClickableBox].filter(Boolean);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (clicked === clickableBox) {
      toggleIframe(iframeObject, clickableBox);
    } else if (clicked === clickableBox2) {
      toggleIframe(iframeObject2, clickableBox2);
    } else if (clicked === chairClickableBox) {
      const distance = camera.position.distanceTo(chairPosition);
      if (!isSitting && distance < 3) {
        isSitting = true;
        controls.unlock();
        camera.position.copy(sittingCameraPosition);
        camera.lookAt(sittingCameraLookAt);
        console.log('Sat on chair');
      } else if (isSitting) {
        isSitting = false;
        controls.lock();
        console.log('Stood up from chair');
      }
    }
  }
});

// === 'E' Key Sit/Stand Toggle ===
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'e' && controls.isLocked && chairPosition) {
    const distance = camera.position.distanceTo(chairPosition);
    if (!isSitting && distance < 2.5) {
      isSitting = true;
      controls.unlock();
      camera.position.copy(sittingCameraPosition);
      camera.lookAt(sittingCameraLookAt);
    } else if (isSitting) {
      isSitting = false;
      controls.lock();
    }
  }
});

// === Handle Window Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
});

// === Main Render Loop ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (controls.isLocked && !isSitting) {
    direction.set(0, 0, 0);
    if (keys['w']) direction.z += 1;
    if (keys['s']) direction.z -= 1;
    if (keys['a']) direction.x -= 1;
    if (keys['d']) direction.x += 1;

    direction.normalize();
    velocity.copy(direction).multiplyScalar(moveSpeed * delta);
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

animate();
