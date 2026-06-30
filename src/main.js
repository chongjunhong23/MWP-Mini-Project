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

camera.position.set(0, 4, 13);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ===============================
// LIGHTING
// ===============================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(5, 10, 5);
scene.add(sunLight);

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

const hotspotMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  depthTest: false
});

// ===============================
// HELPER FUNCTION
// ===============================

function createBox(name, width, height, depth, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// ===============================
// FC-N28 LEVEL 5 ENVIRONMENT
// ===============================

// Corridor floor
createBox('Level 5 Corridor Floor', 6, 0.2, 24, 0, -0.1, 0, floorMaterial);

// Left lab-side wall
createBox('Lab Side Wall', 0.2, 3, 24, -3, 1.5, 0, wallMaterial);

// Right balcony half wall
createBox('Balcony Half Wall', 0.2, 1.2, 24, 3, 0.6, 0, wallMaterial);

// Ceiling
createBox('Corridor Ceiling', 6, 0.2, 24, 0, 3.1, 0, ceilingMaterial);

// Balcony rail
createBox('Balcony Rail', 0.15, 0.15, 22, 2.8, 1.35, 0, railingMaterial);

// Balcony pillars
for (let z = -9; z <= 9; z += 6) {
  createBox('Balcony Pillar', 0.4, 3, 0.4, 2.7, 1.5, z, pillarMaterial);
}

// Corridor doors
createBox('Computer Lab Entrance Door', 1.4, 2.4, 0.15, -2.88, 1.2, -4, doorMaterial);
createBox('Computer Lab Exit Door', 1.4, 2.4, 0.15, -2.88, 1.2, 8, doorMaterial);

// Small door handles
createBox('Lab Entrance Door Handle', 0.08, 0.08, 0.25, -2.72, 1.1, -3.6, railingMaterial);
createBox('Exit Door Handle', 0.08, 0.08, 0.25, -2.72, 1.1, 8.4, railingMaterial);

// Signboard above lab entrance
createBox('Lab Signboard', 1.6, 0.35, 0.08, -2.75, 2.55, -4, new THREE.MeshStandardMaterial({ color: 0xf5d76e }));

// Exit sign
createBox('Exit Sign', 1.4, 0.35, 0.08, -2.75, 2.55, 8, new THREE.MeshStandardMaterial({ color: 0x00aa44 }));

// Lab interior floor and walls
createBox('Computer Lab Floor', 8, 0.2, 8, -8, -0.1, -4, carpetMaterial);
createBox('Computer Lab Back Wall', 8, 3, 0.2, -8, 1.5, -8, wallMaterial);
createBox('Computer Lab Left Wall', 0.2, 3, 8, -12, 1.5, -4, wallMaterial);
createBox('Computer Lab Ceiling', 8, 0.2, 8, -8, 3.1, -4, ceilingMaterial);

// Computer lab desks, monitors and chairs
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const x = -10 + col * 2;
    const z = -6 + row * 2;

    createBox('Computer Desk', 1.4, 0.18, 0.9, x, 0.75, z, deskMaterial);
    createBox('Monitor', 0.8, 0.55, 0.08, x, 1.18, z - 0.28, monitorMaterial);
    createBox('Chair', 0.6, 0.6, 0.6, x, 0.35, z + 0.75, chairMaterial);
  }
}

// Simple ceiling lights
for (let z = -8; z <= 8; z += 4) {
  createBox('Corridor Ceiling Light', 1.0, 0.05, 0.35, 0, 2.95, z, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

for (let x = -10; x <= -6; x += 2) {
  createBox('Lab Ceiling Light', 1.0, 0.05, 0.35, x, 2.95, -4, new THREE.MeshBasicMaterial({ color: 0xffffcc }));
}

// Outdoor view placeholder
createBox('Distant Building View', 5, 2, 0.2, 6, 1.0, 2, new THREE.MeshStandardMaterial({ color: 0xc49a6c }));
createBox('Outdoor Tree Area', 4, 1, 0.2, 6, 0.5, -2, new THREE.MeshStandardMaterial({ color: 0x228b22 }));

// ===============================
// HOTSPOTS
// ===============================

const hotspots = [];

function createHotspot(title, text, x, y, z) {
  const group = new THREE.Group();

  const sphereGeometry = new THREE.SphereGeometry(0.38, 32, 32);
  const sphere = new THREE.Mesh(sphereGeometry, hotspotMaterial);
  sphere.name = title;
  sphere.userData = { title, text, isHotspot: true };

  const ringGeometry = new THREE.TorusGeometry(0.58, 0.04, 16, 100);
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
    'Starting Point of Tour',
    'This area represents the starting point of the FC-N28 Level 5 campus tour. Users begin from the lift area before exploring the corridor, balcony, lab entrance, lab interior, and exit area.',
    0,
    2,
    9
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
// RAYCASTER FOR HOTSPOT CLICK
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

  const intersects = raycaster.intersectObjects(hotspots);

  if (intersects.length > 0) {
    const clickedHotspot = intersects[0].object;

    infoTitle.textContent = clickedHotspot.userData.title;
    infoText.textContent = clickedHotspot.userData.text;
    infoPanel.style.display = 'block';
  }
});

// ===============================
// UI BUTTONS
// ===============================

const welcomeScreen = document.querySelector('#welcome-screen');
const startBtn = document.querySelector('#start-btn');
const closeInfoBtn = document.querySelector('#close-info-btn');
const resetCameraBtn = document.querySelector('#reset-camera-btn');
const toggleLightBtn = document.querySelector('#toggle-light-btn');

startBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
});

closeInfoBtn.addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

resetCameraBtn.addEventListener('click', () => {
  camera.position.set(0, 4, 13);
  controls.target.set(0, 1.5, 0);
  controls.update();
});

toggleLightBtn.addEventListener('click', () => {
  lightsOn = !lightsOn;

  if (lightsOn) {
    ambientLight.intensity = 0.8;
    sunLight.intensity = 1.2;
    scene.background = new THREE.Color(0xbfdfff);
  } else {
    ambientLight.intensity = 0.25;
    sunLight.intensity = 0.15;
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
  controls.update();

  hotspotGroups.forEach((group, index) => {
    group.position.y = group.userData.baseY + Math.sin(Date.now() * 0.003 + index) * 0.12;
    group.rotation.y += 0.015;
  });

  renderer.render(scene, camera);
}

animate();