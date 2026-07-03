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

let lastFrameTime = performance.now();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(liftCameraTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.4;
controls.maxDistance = 24;

const moveKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false
};
const walkSpeed = 3.4;
let tourStarted = false;

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

const walkableZones = [
  { minX: -1.75, maxX: 1.75, minZ: 12.1, maxZ: 15.8 },
  { minX: -1.75, maxX: 1.35, minZ: 10.25, maxZ: 12.35, needsLiftDoor: true },
  { minX: -8.9, maxX: -1.2, minZ: 9.65, maxZ: 12.15, needsLiftDoor: true },
  { minX: -9.9, maxX: -7.1, minZ: -6.8, maxZ: 10.5, needsLiftDoor: true },
  { minX: -10.55, maxX: -9.7, minZ: 2.45, maxZ: 3.65, needsLiftDoor: true, needsLabDoor: true },
  { minX: -15.5, maxX: -10.35, minZ: -1.45, maxZ: 5.8, needsLiftDoor: true, needsLabDoor: true }
];

function isInsideZone(position, zone) {
  if (zone.needsLiftDoor && !liftDoorOpen) {
    return false;
  }

  if (zone.needsLabDoor && !labDoorOpen) {
    return false;
  }

  return (
    position.x >= zone.minX &&
    position.x <= zone.maxX &&
    position.z >= zone.minZ &&
    position.z <= zone.maxZ
  );
}

function canWalkTo(position) {
  return walkableZones.some((zone) => isInsideZone(position, zone));
}

function moveCameraBy(offset) {
  const nextPosition = camera.position.clone().add(offset);
  nextPosition.y = camera.position.y;

  if (!canWalkTo(nextPosition)) {
    return;
  }

  camera.position.copy(nextPosition);
  controls.target.add(offset);
  controls.target.y = Math.max(1.1, Math.min(2.0, controls.target.y));
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
const arrowStem = createBox('Arrow Stem', 1.4, 0.05, 0.28, -1.35, 0.08, 10.9, arrowMaterial, directionArrowGroup);
const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 4), arrowMaterial);
arrowHead.name = 'Arrow Head';
arrowHead.position.set(-2.28, 0.08, 10.9);
arrowHead.rotation.z = Math.PI / 2;
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

createBox('Lift Landing Floor', 3.7, 0.2, 2.4, -0.15, -0.1, 10.95, floorMaterial);
createBox('Landing Front Barrier', 3.8, 1.25, 0.22, -0.15, 0.62, 9.7, wallMaterial);
createBox('Landing Right Wall', 0.22, 3, 2.55, 1.8, 1.5, 10.95, wallMaterial);
createBox('Landing Ceiling', 3.7, 0.2, 2.4, -0.15, 3.1, 10.95, ceilingMaterial);
createBox('Landing Safety Rail', 3.6, 0.12, 0.12, -0.15, 1.35, 9.82, railingMaterial);

createBox('First Left Corridor Floor', 8.1, 0.2, 2.5, -5.05, -0.1, 10.9, floorMaterial);
createBox('First Corridor Solid Wall', 8.3, 3, 0.2, -5.05, 1.5, 12.15, wallMaterial);
createBox('First Corridor Balcony Barrier', 8.3, 1.2, 0.2, -5.05, 0.6, 9.65, wallMaterial);
createBox('First Corridor Ceiling', 8.3, 0.2, 2.5, -5.05, 3.1, 10.9, ceilingMaterial);
createBox('First Corridor Rail', 7.8, 0.12, 0.12, -5.05, 1.35, 9.78, railingMaterial);

createBox('Right Turn Corridor Floor', 2.8, 0.2, 17.2, -8.5, -0.1, 1.85, floorMaterial);
createBox('Right Turn Balcony Half Wall', 0.2, 1.2, 17, -7.1, 0.6, 1.85, wallMaterial);
createBox('Right Turn Balcony Rail', 0.12, 0.12, 16.3, -7.25, 1.35, 1.85, railingMaterial);
createBox('Right Turn Ceiling', 2.8, 0.2, 17.2, -8.5, 3.1, 1.85, ceilingMaterial);
createBox('Lab Wall Before Door', 0.22, 3, 6.0, -9.92, 1.5, -3.65, wallMaterial);
createBox('Lab Wall After Door', 0.22, 3, 6.0, -9.92, 1.5, 6.35, wallMaterial);

for (let z = 8; z >= -5; z -= 4) {
  createBox('Right Turn Balcony Pillar', 0.35, 3, 0.35, -7.2, 1.5, z, pillarMaterial);
}

createBox('Computer Lab Floor', 8, 0.2, 8, -14, -0.1, 2.5, carpetMaterial);
createBox('Computer Lab Back Wall', 8, 3, 0.2, -14, 1.5, -1.5, wallMaterial);
createBox('Computer Lab Front Wall', 8, 3, 0.2, -14, 1.5, 6.5, wallMaterial);
createBox('Computer Lab Left Wall', 0.2, 3, 8, -18, 1.5, 2.5, wallMaterial);
createBox('Computer Lab Ceiling', 8, 0.2, 8, -14, 3.1, 2.5, ceilingMaterial);

const labDoorPivot = new THREE.Group();
labDoorPivot.name = 'Computer Lab Door Pivot';
labDoorPivot.position.set(-9.92, 1.2, 3.2);
scene.add(labDoorPivot);

const labDoor = createBox('Openable Computer Lab Door', 0.15, 2.4, 1.4, 0, 0, -0.7, doorMaterial, labDoorPivot);
labDoor.userData = {
  isLabDoor: true,
  title: 'Computer Lab Door',
  text: 'This door opens into the FC-N28 Level 5 computer lab.'
};
const labDoorHandle = createBox('Lab Door Handle', 0.22, 0.08, 0.08, 0.12, -0.1, -1.1, railingMaterial, labDoorPivot);
labDoorHandle.userData = labDoor.userData;

createTextPanel('LAB', 1.2, 0.32, -9.78, 2.58, 3.2, '#f5d76e', '#3a1f12');

createBox('Computer Lab Exit Door', 1.4, 2.4, 0.15, -14, 1.2, 6.38, doorMaterial);
createBox('Exit Door Handle', 0.08, 0.08, 0.25, -13.6, 1.1, 6.26, railingMaterial);
createTextPanel('KELUAR', 1.35, 0.34, -14, 2.62, 6.26, '#007a3d', '#ffffff');

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const x = -16 + col * 2;
    const z = 0.6 + row * 1.8;

    createBox('Computer Desk', 1.4, 0.18, 0.9, x, 0.75, z, deskMaterial);
    createBox('Monitor', 0.8, 0.55, 0.08, x, 1.18, z - 0.28, monitorMaterial);
    createBox('Chair', 0.6, 0.6, 0.6, x, 0.35, z + 0.75, chairMaterial);
  }
}

for (let x = -8; x <= -2; x += 2) {
  createBox('First Corridor Ceiling Light', 1.0, 0.05, 0.35, x, 2.95, 10.9, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

for (let z = -5; z <= 9; z += 4) {
  createBox('Right Turn Ceiling Light', 0.35, 0.05, 1.0, -8.5, 2.95, z, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

for (let x = -16; x <= -12; x += 2) {
  createBox('Lab Ceiling Light', 1.0, 0.05, 0.35, x, 2.95, 2.5, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

createBox('Distant Building View', 5, 2, 0.2, -4, 1.0, 7.6, new THREE.MeshStandardMaterial({ color: 0xc49a6c }));
createBox('Outdoor Tree Area', 4, 1, 0.2, -7.8, 0.5, -8.5, new THREE.MeshStandardMaterial({ color: 0x228b22 }));

let labDoorOpen = false;
let labDoorProgress = 0;

function openLabDoor() {
  labDoorOpen = true;
  openLabDoorBtn.disabled = true;
  openLabDoorBtn.textContent = 'Lab Door Open';
}

function resetLabDoor() {
  labDoorOpen = false;
  labDoorProgress = 0;
  labDoorPivot.rotation.y = 0;
  openLabDoorBtn.disabled = false;
  openLabDoorBtn.textContent = 'Open Lab Door';
}

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
    -7.25,
    2,
    -2
  )
);

hotspotGroups.push(
  createHotspot(
    'Level 5 Open Corridor Walkway',
    'From the lift landing, users turn left into this corridor before turning right toward the computer lab entrance.',
    -5.2,
    2,
    10.9
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Entrance',
    'This entrance leads into the computer lab. The lab is used for practical classes, programming sessions, and multimedia-related learning activities.',
    -9.25,
    2,
    3.2
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Interior',
    'The computer lab interior contains rows of computer desks, monitors, chairs, ceiling lights, and learning facilities for students.',
    -14,
    2,
    2.5
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Exit Door',
    'This area represents the computer lab exit door. The exit sign and safety elements help users identify the way out from the lab.',
    -14,
    2,
    5.7
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

  const intersects = raycaster.intersectObjects([...hotspots, liftButton, labDoor, labDoorHandle]);

  if (intersects.length === 0) {
    return;
  }

  const clickedObject = intersects[0].object;

  if (clickedObject.userData.isLiftButton) {
    openLiftDoors();
  }

  if (clickedObject.userData.isLabDoor) {
    openLabDoor();
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
const openLabDoorBtn = document.querySelector('#open-lab-door-btn');
const resetCameraBtn = document.querySelector('#reset-camera-btn');
const toggleLightBtn = document.querySelector('#toggle-light-btn');

startBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
  tourStarted = true;
  setCameraView(liftCameraPosition, liftCameraTarget);
});

closeInfoBtn.addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

openLiftBtn.addEventListener('click', () => {
  openLiftDoors();
});

openLabDoorBtn.addEventListener('click', () => {
  openLabDoor();
});

resetCameraBtn.addEventListener('click', () => {
  resetLiftDoors();
  resetLabDoor();
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

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === 'w') moveKeys.forward = true;
  if (key === 's') moveKeys.backward = true;
  if (key === 'a') moveKeys.left = true;
  if (key === 'd') moveKeys.right = true;
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'w') moveKeys.forward = false;
  if (key === 's') moveKeys.backward = false;
  if (key === 'a') moveKeys.left = false;
  if (key === 'd') moveKeys.right = false;
});

function updatePlayerMovement(delta) {
  if (!tourStarted) {
    return;
  }

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() === 0) {
    return;
  }

  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  const movement = new THREE.Vector3();

  if (moveKeys.forward) movement.add(forward);
  if (moveKeys.backward) movement.sub(forward);
  if (moveKeys.right) movement.add(right);
  if (moveKeys.left) movement.sub(right);

  if (movement.lengthSq() === 0) {
    return;
  }

  movement.normalize().multiplyScalar(walkSpeed * delta);
  moveCameraBy(movement);
}

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

  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  updatePlayerMovement(delta);
  controls.update();

  const targetProgress = liftDoorOpen ? 1 : 0;
  liftDoorProgress = THREE.MathUtils.damp(liftDoorProgress, targetProgress, 4.2, delta);
  leftLiftDoor.position.x = THREE.MathUtils.lerp(-0.6, -1.55, liftDoorProgress);
  rightLiftDoor.position.x = THREE.MathUtils.lerp(0.6, 1.55, liftDoorProgress);
  arrowMaterial.opacity = THREE.MathUtils.lerp(0, 0.9, liftDoorProgress);
  arrowStem.material.opacity = arrowMaterial.opacity;
  arrowHead.material.opacity = arrowMaterial.opacity;

  const labDoorTarget = labDoorOpen ? -Math.PI / 2.15 : 0;
  labDoorProgress = THREE.MathUtils.damp(labDoorProgress, labDoorOpen ? 1 : 0, 4.2, delta);
  labDoorPivot.rotation.y = THREE.MathUtils.lerp(0, labDoorTarget, labDoorProgress);

  hotspotGroups.forEach((group, index) => {
    group.position.y = group.userData.baseY + Math.sin(Date.now() * 0.003 + index) * 0.12;
    group.rotation.y += 0.015;
  });

  renderer.render(scene, camera);
}

animate();
