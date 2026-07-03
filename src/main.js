import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===============================
// BASIC SETUP
// ===============================

const canvas = document.querySelector('#three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfdfff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const liftCameraPosition = new THREE.Vector3(0, 1.75, 15.25);
const liftCameraTarget = new THREE.Vector3(0, 1.45, 10.8);
camera.position.copy(liftCameraPosition);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new THREE.Clock();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(liftCameraTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.4;
controls.maxDistance = 24;

// ===============================
// LIGHTING
// ===============================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(5, 10, 5);
scene.add(sunLight);

const liftLight = new THREE.PointLight(0xfff4d0, 1.5, 8);
liftLight.position.set(0, 2.65, 14.2);
scene.add(liftLight);

let lightsOn = true;

// ===============================
// MATERIALS
// ===============================

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf1dfb5 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7a7a });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x653030 });
const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3a1f12 });
const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x050505 });
const chairMaterial = new THREE.MeshStandardMaterial({ color: 0xbb2222 });
const carpetMaterial = new THREE.MeshStandardMaterial({ color: 0x174a73 });

const liftWallMaterial = new THREE.MeshStandardMaterial({
  color: 0xbfc3c6,
  metalness: 0.55,
  roughness: 0.25
});
const liftDoorMaterial = new THREE.MeshStandardMaterial({
  color: 0x8f979c,
  metalness: 0.7,
  roughness: 0.18
});
const liftPanelMaterial = new THREE.MeshStandardMaterial({
  color: 0x24282c,
  metalness: 0.45,
  roughness: 0.3
});
const liftButtonMaterial = new THREE.MeshBasicMaterial({ color: 0xffd84d });
const liftButtonActiveMaterial = new THREE.MeshBasicMaterial({ color: 0x66ff99 });

const hotspotMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  depthTest: false
});

// ===============================
// HELPER FUNCTIONS
// ===============================

function createBox(name, width, height, depth, x, y, z, material, parent = scene) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function createTextPanel(text, width, height, x, y, z, background, foreground, parent = scene) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 192;

  const context = textureCanvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.strokeStyle = foreground;
  context.lineWidth = 10;
  context.strokeRect(8, 8, textureCanvas.width - 16, textureCanvas.height - 16);
  context.fillStyle = foreground;
  context.font = 'bold 64px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2);

  const texture = new THREE.CanvasTexture(textureCanvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  panel.position.set(x, y, z);
  parent.add(panel);
  return panel;
}

function setCameraView(position, target) {
  camera.position.copy(position);
  controls.target.copy(target);
  controls.update();
}

// ===============================
// LIFT OPENING SCENE
// ===============================

const liftGroup = new THREE.Group();
liftGroup.name = 'Lift Opening Scene';
scene.add(liftGroup);

createBox('Lift Floor', 4.4, 0.2, 4.2, 0, -0.1, 14.2, floorMaterial, liftGroup);
createBox('Lift Ceiling', 4.4, 0.2, 4.2, 0, 3.1, 14.2, liftWallMaterial, liftGroup);
createBox('Lift Back Metal Wall', 4.4, 3.2, 0.18, 0, 1.5, 16.25, liftWallMaterial, liftGroup);
createBox('Lift Left Metal Wall', 0.18, 3.2, 4.2, -2.2, 1.5, 14.2, liftWallMaterial, liftGroup);
createBox('Lift Right Metal Wall', 0.18, 3.2, 4.2, 2.2, 1.5, 14.2, liftWallMaterial, liftGroup);

for (let x = -1.6; x <= 1.6; x += 0.8) {
  createBox('Lift Rear Wall Decorative Strip', 0.05, 2.7, 0.03, x, 1.55, 16.14, new THREE.MeshStandardMaterial({ color: 0xe2e5e8, metalness: 0.6, roughness: 0.2 }), liftGroup);
}

for (let z = 12.65; z <= 15.65; z += 0.75) {
  createBox('Lift Side Wall Decorative Strip', 0.03, 2.7, 0.05, -2.1, 1.55, z, new THREE.MeshStandardMaterial({ color: 0xe2e5e8, metalness: 0.6, roughness: 0.2 }), liftGroup);
  createBox('Lift Side Wall Decorative Strip', 0.03, 2.7, 0.05, 2.1, 1.55, z, new THREE.MeshStandardMaterial({ color: 0xe2e5e8, metalness: 0.6, roughness: 0.2 }), liftGroup);
}

createBox('Lift Door Frame Top', 4.5, 0.28, 0.25, 0, 2.78, 12.05, liftPanelMaterial, liftGroup);
createBox('Lift Door Frame Left', 0.22, 2.75, 0.25, -2.12, 1.38, 12.05, liftPanelMaterial, liftGroup);
createBox('Lift Door Frame Right', 0.22, 2.75, 0.25, 2.12, 1.38, 12.05, liftPanelMaterial, liftGroup);

const leftLiftDoor = createBox('Left Sliding Lift Door', 1.18, 2.55, 0.14, -0.6, 1.28, 12.04, liftDoorMaterial, liftGroup);
const rightLiftDoor = createBox('Right Sliding Lift Door', 1.18, 2.55, 0.14, 0.6, 1.28, 12.04, liftDoorMaterial, liftGroup);
createBox('Lift Door Center Seam', 0.04, 2.5, 0.16, 0, 1.28, 11.95, liftPanelMaterial, liftGroup);

createTextPanel('LEVEL 5', 1.45, 0.42, 0, 2.48, 11.92, '#111827', '#ffd84d', liftGroup);
createBox('Lift Handrail Left', 0.08, 0.08, 2.5, -2.05, 1.05, 14.45, railingMaterial, liftGroup);
createBox('Lift Handrail Right', 0.08, 0.08, 2.5, 2.05, 1.05, 14.45, railingMaterial, liftGroup);
createBox('Lift Handrail Back', 2.7, 0.08, 0.08, 0, 1.05, 16.05, railingMaterial, liftGroup);

createBox('Lift Button Panel', 0.12, 1.25, 0.45, -2.05, 1.45, 13.25, liftPanelMaterial, liftGroup);
createTextPanel('5', 0.28, 0.28, -1.97, 1.88, 13.25, '#111827', '#ffd84d', liftGroup);

const liftButton = createBox('Clickable Lift Open Button', 0.16, 0.16, 0.16, -1.96, 1.42, 13.05, liftButtonMaterial, liftGroup);
liftButton.userData = {
  isLiftButton: true,
  title: 'Open Lift Door',
  text: 'The lift door opens to begin the FC-N28 Level 5 tour route.'
};

createBox('Lift Interior Ceiling Light', 2.4, 0.05, 0.45, 0, 2.98, 14.1, new THREE.MeshBasicMaterial({ color: 0xffffcc }), liftGroup);

const directionArrowGroup = new THREE.Group();
directionArrowGroup.name = 'Corridor Direction Arrow';
scene.add(directionArrowGroup);
const arrowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffd000,
  transparent: true,
  opacity: 0
});
const arrowStem = createBox('Arrow Stem', 0.28, 0.05, 1.4, 0, 0.08, 10.6, arrowMaterial, directionArrowGroup);
const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 4), arrowMaterial);
arrowHead.name = 'Arrow Head';
arrowHead.position.set(0, 0.08, 9.6);
arrowHead.rotation.x = Math.PI / 2;
arrowHead.rotation.z = Math.PI / 4;
directionArrowGroup.add(arrowHead);

let liftDoorOpen = false;
let liftDoorProgress = 0;

function openLiftDoors() {
  liftDoorOpen = true;
  liftButton.material = liftButtonActiveMaterial;
  openLiftBtn.disabled = true;
  openLiftBtn.textContent = 'Lift Door Open';
}

function resetLiftDoors() {
  liftDoorOpen = false;
  liftDoorProgress = 0;
  liftButton.material = liftButtonMaterial;
  openLiftBtn.disabled = false;
  openLiftBtn.textContent = 'Open Lift Door';
  leftLiftDoor.position.x = -0.6;
  rightLiftDoor.position.x = 0.6;
  arrowMaterial.opacity = 0;
}

// ===============================
// FC-N28 LEVEL 5 ENVIRONMENT
// ===============================

createBox('Level 5 Corridor Floor', 6, 0.2, 24, 0, -0.1, 0, floorMaterial);
createBox('Lab Side Wall', 0.2, 3, 24, -3, 1.5, 0, wallMaterial);
createBox('Balcony Half Wall', 0.2, 1.2, 24, 3, 0.6, 0, wallMaterial);
createBox('Corridor Ceiling', 6, 0.2, 24, 0, 3.1, 0, ceilingMaterial);
createBox('Balcony Rail', 0.15, 0.15, 22, 2.8, 1.35, 0, railingMaterial);

for (let z = -9; z <= 9; z += 6) {
  createBox('Balcony Pillar', 0.4, 3, 0.4, 2.7, 1.5, z, pillarMaterial);
}

createBox('Computer Lab Entrance Door', 1.4, 2.4, 0.15, -2.88, 1.2, -4, doorMaterial);
createBox('Computer Lab Exit Door', 1.4, 2.4, 0.15, -2.88, 1.2, 8, doorMaterial);
createBox('Lab Entrance Door Handle', 0.08, 0.08, 0.25, -2.72, 1.1, -3.6, railingMaterial);
createBox('Exit Door Handle', 0.08, 0.08, 0.25, -2.72, 1.1, 8.4, railingMaterial);
createBox('Lab Signboard', 1.6, 0.35, 0.08, -2.75, 2.55, -4, new THREE.MeshStandardMaterial({ color: 0xf5d76e }));
createBox('Exit Sign', 1.4, 0.35, 0.08, -2.75, 2.55, 8, new THREE.MeshStandardMaterial({ color: 0x00aa44 }));

createBox('Computer Lab Floor', 8, 0.2, 8, -8, -0.1, -4, carpetMaterial);
createBox('Computer Lab Back Wall', 8, 3, 0.2, -8, 1.5, -8, wallMaterial);
createBox('Computer Lab Left Wall', 0.2, 3, 8, -12, 1.5, -4, wallMaterial);
createBox('Computer Lab Ceiling', 8, 0.2, 8, -8, 3.1, -4, ceilingMaterial);

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const x = -10 + col * 2;
    const z = -6 + row * 2;

    createBox('Computer Desk', 1.4, 0.18, 0.9, x, 0.75, z, deskMaterial);
    createBox('Monitor', 0.8, 0.55, 0.08, x, 1.18, z - 0.28, monitorMaterial);
    createBox('Chair', 0.6, 0.6, 0.6, x, 0.35, z + 0.75, chairMaterial);
  }
}

for (let z = -8; z <= 8; z += 4) {
  createBox('Corridor Ceiling Light', 1.0, 0.05, 0.35, 0, 2.95, z, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

for (let x = -10; x <= -6; x += 2) {
  createBox('Lab Ceiling Light', 1.0, 0.05, 0.35, x, 2.95, -4, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

createBox('Distant Building View', 5, 2, 0.2, 6, 1.0, 2, new THREE.MeshStandardMaterial({ color: 0xc49a6c }));
createBox('Outdoor Tree Area', 4, 1, 0.2, 6, 0.5, -2, new THREE.MeshStandardMaterial({ color: 0x228b22 }));

// ===============================
// HOTSPOTS
// ===============================

const hotspots = [];

function createHotspot(title, text, x, y, z, radius = 0.38) {
  const group = new THREE.Group();

  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const sphere = new THREE.Mesh(sphereGeometry, hotspotMaterial);
  sphere.name = title;
  sphere.userData = { title, text, isHotspot: true };

  const ringGeometry = new THREE.TorusGeometry(radius * 1.55, radius * 0.11, 16, 100);
  const ring = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      depthTest: false
    })
  );

  ring.rotation.x = Math.PI / 2;
  group.add(sphere);
  group.add(ring);
  group.position.set(x, y, z);
  group.userData.baseY = y;

  scene.add(group);
  hotspots.push(sphere);

  return group;
}

const hotspotGroups = [];

hotspotGroups.push(
  createHotspot(
    'Starting Point Inside Lift',
    'This is the opening scene of the FC-N28 Level 5 tour. The user begins inside the lift, then opens the door to enter the corridor walkway.',
    -1.35,
    1.75,
    13.35,
    0.18
  )
);

hotspotGroups.push(
  createHotspot(
    'Open Balcony View',
    'The open balcony provides a view of the surrounding Faculty of Computing area. It also gives natural lighting and open-air visibility to the Level 5 corridor.',
    2.2,
    2,
    2
  )
);

hotspotGroups.push(
  createHotspot(
    'Level 5 Open Corridor Walkway',
    'The corridor walkway connects different rooms and areas on FC-N28 Level 5. It is one of the main walking paths for students and staff.',
    0,
    2,
    -1
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Entrance',
    'This entrance leads into the computer lab. The lab is used for practical classes, programming sessions, and multimedia-related learning activities.',
    -2.1,
    2,
    -4
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Interior',
    'The computer lab interior contains rows of computer desks, monitors, chairs, ceiling lights, and learning facilities for students.',
    -8,
    2,
    -4
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Exit Door',
    'This area represents the computer lab exit door. The exit sign and safety elements help users identify the way out from the lab.',
    -2.1,
    2,
    8
  )
);

// ===============================
// RAYCASTER FOR CLICKS
// ===============================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.querySelector('#info-panel');
const infoTitle = document.querySelector('#info-title');
const infoText = document.querySelector('#info-text');

canvas.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([...hotspots, liftButton]);

  if (intersects.length === 0) {
    return;
  }

  const clickedObject = intersects[0].object;

  if (clickedObject.userData.isLiftButton) {
    openLiftDoors();
  }

  infoTitle.textContent = clickedObject.userData.title;
  infoText.textContent = clickedObject.userData.text;
  infoPanel.style.display = 'block';
});

// ===============================
// UI BUTTONS
// ===============================

const welcomeScreen = document.querySelector('#welcome-screen');
const startBtn = document.querySelector('#start-btn');
const closeInfoBtn = document.querySelector('#close-info-btn');
const openLiftBtn = document.querySelector('#open-lift-btn');
const resetCameraBtn = document.querySelector('#reset-camera-btn');
const toggleLightBtn = document.querySelector('#toggle-light-btn');

startBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
  setCameraView(liftCameraPosition, liftCameraTarget);
});

closeInfoBtn.addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

openLiftBtn.addEventListener('click', () => {
  openLiftDoors();
});

resetCameraBtn.addEventListener('click', () => {
  resetLiftDoors();
  setCameraView(liftCameraPosition, liftCameraTarget);
});

toggleLightBtn.addEventListener('click', () => {
  lightsOn = !lightsOn;

  if (lightsOn) {
    ambientLight.intensity = 0.8;
    sunLight.intensity = 1.2;
    liftLight.intensity = 1.5;
    scene.background = new THREE.Color(0xbfdfff);
  } else {
    ambientLight.intensity = 0.25;
    sunLight.intensity = 0.15;
    liftLight.intensity = 0.55;
    scene.background = new THREE.Color(0x111827);
  }
});

// ===============================
// RESPONSIVE RESIZE
// ===============================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ===============================
// ANIMATION LOOP
// ===============================

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  controls.update();

  const targetProgress = liftDoorOpen ? 1 : 0;
  liftDoorProgress = THREE.MathUtils.damp(liftDoorProgress, targetProgress, 4.2, delta);
  leftLiftDoor.position.x = THREE.MathUtils.lerp(-0.6, -1.55, liftDoorProgress);
  rightLiftDoor.position.x = THREE.MathUtils.lerp(0.6, 1.55, liftDoorProgress);
  arrowMaterial.opacity = THREE.MathUtils.lerp(0, 0.9, liftDoorProgress);
  arrowStem.material.opacity = arrowMaterial.opacity;
  arrowHead.material.opacity = arrowMaterial.opacity;

  hotspotGroups.forEach((group, index) => {
    group.position.y = group.userData.baseY + Math.sin(Date.now() * 0.003 + index) * 0.12;
    group.rotation.y += 0.015;
  });

  renderer.render(scene, camera);
}

animate();
