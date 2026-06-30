import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Canvas
const canvas = document.querySelector('#three-canvas');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfdfff);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 4, 12);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 10, 5);
scene.add(sunLight);

let lightsOn = true;

// Materials
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf3dfb3 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x6b2e2e });
const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3b1f12 });
const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x050505 });
const hotspotMaterial = new THREE.MeshStandardMaterial({
  color: 0xffdd00,
  emissive: 0xffaa00,
  emissiveIntensity: 0.6
});

// Helper function to create box
function createBox(name, width, height, depth, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// Ground / corridor floor
createBox('Level 5 Corridor Floor', 6, 0.2, 24, 0, -0.1, 0, floorMaterial);

// Left wall
createBox('Lab Side Wall', 0.2, 3, 24, -3, 1.5, 0, wallMaterial);

// Right balcony half wall
createBox('Balcony Half Wall', 0.2, 1.2, 24, 3, 0.6, 0, wallMaterial);

// Ceiling
createBox('Ceiling', 6, 0.2, 24, 0, 3.1, 0, new THREE.MeshStandardMaterial({ color: 0xffffff }));

// Pillars along balcony
for (let z = -9; z <= 9; z += 6) {
  createBox('Balcony Pillar', 0.35, 3, 0.35, 2.7, 1.5, z, pillarMaterial);
}

// Rail on balcony
createBox('Balcony Rail', 0.15, 0.15, 22, 2.8, 1.35, 0, railingMaterial);

// Computer lab entrance door
const labDoor = createBox('Computer Lab Entrance Door', 1.4, 2.4, 0.15, -2.89, 1.2, -4, doorMaterial);

// Exit door area
createBox('Computer Lab Exit Door', 1.4, 2.4, 0.15, -2.89, 1.2, 8, doorMaterial);

// Lab interior simple room
createBox('Computer Lab Floor', 8, 0.2, 8, -8, -0.1, -4, new THREE.MeshStandardMaterial({ color: 0x1d3f63 }));
createBox('Computer Lab Back Wall', 8, 3, 0.2, -8, 1.5, -8, wallMaterial);
createBox('Computer Lab Side Wall', 0.2, 3, 8, -12, 1.5, -4, wallMaterial);

// Computer desks and monitors
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const x = -10 + col * 2;
    const z = -6 + row * 2;

    createBox('Computer Desk', 1.4, 0.15, 0.8, x, 0.75, z, deskMaterial);
    createBox('Monitor', 0.8, 0.5, 0.08, x, 1.15, z - 0.25, monitorMaterial);
    createBox('Chair', 0.6, 0.6, 0.6, x, 0.35, z + 0.7, new THREE.MeshStandardMaterial({ color: 0xaa0000 }));
  }
}

// Create hotspot
const hotspots = [];

function createHotspot(title, text, x, y, z) {
  const geometry = new THREE.SphereGeometry(0.25, 32, 32);
  const hotspot = new THREE.Mesh(geometry, hotspotMaterial);
  hotspot.position.set(x, y, z);
  hotspot.userData = { title, text };
  scene.add(hotspot);
  hotspots.push(hotspot);
  return hotspot;
}

createHotspot(
  'Starting Point of Tour',
  'This area represents the starting point of the FC-N28 Level 5 campus tour. Users begin from the lift area before exploring the corridor and lab section.',
  0,
  1.6,
  10
);

createHotspot(
  'Open Balcony View',
  'The open balcony provides a view of the surrounding Faculty of Computing building area and allows natural light into the Level 5 corridor.',
  2.2,
  1.6,
  2
);

createHotspot(
  'Computer Lab Entrance',
  'This entrance leads to the computer lab area. The lab is an important learning space used for practical sessions and computing-related activities.',
  -2.2,
  1.6,
  -4
);

createHotspot(
  'Computer Lab Interior',
  'The computer lab contains rows of computer desks, monitors, chairs, ceiling lights, and teaching facilities for students.',
  -8,
  1.6,
  -4
);

createHotspot(
  'Exit Door',
  'This area represents the computer lab exit door, including the exit signage and safety-related elements.',
  -2.2,
  1.6,
  8
);

// Raycaster for clicking hotspots
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.querySelector('#info-panel');
const infoTitle = document.querySelector('#info-title');
const infoText = document.querySelector('#info-text');

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(hotspots);

  if (intersects.length > 0) {
    const hotspot = intersects[0].object;
    infoTitle.textContent = hotspot.userData.title;
    infoText.textContent = hotspot.userData.text;
    infoPanel.style.display = 'block';
  }
});

// UI buttons
document.querySelector('#start-btn').addEventListener('click', () => {
  document.querySelector('#welcome-screen').style.display = 'none';
});

document.querySelector('#close-info-btn').addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

document.querySelector('#reset-camera-btn').addEventListener('click', () => {
  camera.position.set(0, 4, 12);
  controls.target.set(0, 1.5, 0);
});

document.querySelector('#toggle-light-btn').addEventListener('click', () => {
  lightsOn = !lightsOn;

  if (lightsOn) {
    ambientLight.intensity = 0.7;
    sunLight.intensity = 1;
    scene.background = new THREE.Color(0xbfdfff);
  } else {
    ambientLight.intensity = 0.2;
    sunLight.intensity = 0.1;
    scene.background = new THREE.Color(0x111827);
  }
});

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
function animate() {
  controls.update();

  hotspots.forEach((hotspot) => {
    hotspot.rotation.y += 0.02;
    hotspot.position.y += Math.sin(Date.now() * 0.003) * 0.0008;
  });

  renderer.render(scene, camera);
}

animate();