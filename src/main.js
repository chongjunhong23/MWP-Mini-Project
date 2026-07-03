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
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.45, roughness: 0.28 });
const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2933, metalness: 0.35, roughness: 0.34 });
const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x5fb4ff });
const whitePlasticMaterial = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
const noticeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
const extinguisherMaterial = new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.32 });
const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.55 });

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

function createCylinder(name, radius, height, x, y, z, material, parent = scene, segments = 24) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
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

function createFluorescentLight(name, x, y, z, rotationY = 0, parent = scene) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  parent.add(group);

  createBox('Light Housing', 1.25, 0.05, 0.32, 0, 0, 0, whitePlasticMaterial, group);
  createBox('Glowing Tube', 1.05, 0.035, 0.2, 0, -0.02, 0, new THREE.MeshBasicMaterial({ color: 0xffffdd }), group);

  return group;
}

function createCeilingGrid(width, depth, centerX, centerZ, y, parent = scene) {
  for (let x = centerX - width / 2; x <= centerX + width / 2 + 0.01; x += 1) {
    createBox('Ceiling Grid Strip', 0.025, 0.025, depth, x, y, centerZ, metalMaterial, parent);
  }

  for (let z = centerZ - depth / 2; z <= centerZ + depth / 2 + 0.01; z += 1) {
    createBox('Ceiling Grid Strip', width, 0.025, 0.025, centerX, y, z, metalMaterial, parent);
  }
}

function createWindowGrille(name, x, y, z, width, height, parent = scene) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);

  createBox('Window Frame Top', width, 0.06, 0.05, 0, height / 2, 0, metalMaterial, group);
  createBox('Window Frame Bottom', width, 0.06, 0.05, 0, -height / 2, 0, metalMaterial, group);
  createBox('Window Frame Left', 0.06, height, 0.05, -width / 2, 0, 0, metalMaterial, group);
  createBox('Window Frame Right', 0.06, height, 0.05, width / 2, 0, 0, metalMaterial, group);

  for (let i = -2; i <= 2; i++) {
    createBox('Window Grille Bar', 0.04, height, 0.04, i * width / 5, 0, 0, metalMaterial, group);
  }

  return group;
}

function createNoticeBoard(name, x, y, z, width, height, color = 0xf5d76e, parent = scene) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);

  createBox('Notice Board Backing', width, height, 0.06, 0, 0, 0, new THREE.MeshStandardMaterial({ color, roughness: 0.45 }), group);
  createBox('Notice Paper A', width * 0.32, height * 0.38, 0.07, -width * 0.2, 0.08, 0.01, noticeMaterial, group);
  createBox('Notice Paper B', width * 0.32, height * 0.28, 0.07, width * 0.22, -0.08, 0.01, noticeMaterial, group);
  createBox('Notice Header Strip', width * 0.75, 0.04, 0.08, 0, height * 0.28, 0.02, new THREE.MeshBasicMaterial({ color: 0xcc3333 }), group);

  return group;
}

function addDoorPanels(parent, width, height, depth = 0.03) {
  createBox('Door Raised Top Panel', width * 0.62, height * 0.28, depth, 0, height * 0.18, -0.09, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }), parent);
  createBox('Door Raised Bottom Panel', width * 0.62, height * 0.32, depth, 0, -height * 0.24, -0.09, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }), parent);
}

function createFireExtinguisher(x, y, z, parent = scene) {
  const group = new THREE.Group();
  group.name = 'Fire Extinguisher';
  group.position.set(x, y, z);
  parent.add(group);

  createCylinder('Extinguisher Body', 0.13, 0.8, 0, 0.42, 0, extinguisherMaterial, group);
  createCylinder('Extinguisher Neck', 0.06, 0.16, 0, 0.9, 0, darkMetalMaterial, group);
  const hose = createCylinder('Extinguisher Hose', 0.025, 0.55, 0.18, 0.8, 0, darkMetalMaterial, group, 12);
  hose.rotation.z = Math.PI / 2.8;
  createBox('Extinguisher Label', 0.18, 0.16, 0.02, 0, 0.45, -0.13, noticeMaterial, group);

  return group;
}

function createShoeRack(x, y, z, parent = scene) {
  const group = new THREE.Group();
  group.name = 'Wooden Shoe Rack';
  group.position.set(x, y, z);
  parent.add(group);

  for (let level = 0; level < 3; level++) {
    createBox('Shoe Rack Shelf', 1.45, 0.06, 0.38, 0, y + level * 0.26, 0, woodMaterial, group);
  }

  for (const xOffset of [-0.68, 0.68]) {
    createBox('Shoe Rack Side', 0.06, 0.7, 0.42, xOffset, y + 0.32, 0, woodMaterial, group);
  }

  return group;
}

function createAirCond(name, x, y, z, parent = scene) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);

  createBox('Air Conditioner Body', 1.15, 0.35, 0.22, 0, 0, 0, whitePlasticMaterial, group);
  createBox('Air Conditioner Vent', 0.95, 0.045, 0.04, 0, -0.11, -0.12, darkMetalMaterial, group);
  createBox('Air Conditioner Indicator', 0.1, 0.035, 0.03, 0.42, 0.07, -0.13, new THREE.MeshBasicMaterial({ color: 0x66ff99 }), group);

  return group;
}

function createComputerStation(x, z, parent = scene) {
  const group = new THREE.Group();
  group.name = 'Detailed Computer Station';
  group.position.set(x, 0, z);
  parent.add(group);

  createBox('Lab Desk Top', 1.45, 0.12, 0.9, 0, 0.78, 0, deskMaterial, group);
  createBox('Desk Left Side', 0.08, 0.7, 0.75, -0.62, 0.38, 0, darkMetalMaterial, group);
  createBox('Desk Right Side', 0.08, 0.7, 0.75, 0.62, 0.38, 0, darkMetalMaterial, group);
  createBox('Desk Back Modesty Panel', 1.25, 0.48, 0.06, 0, 0.42, -0.38, darkMetalMaterial, group);

  createBox('Monitor Stand', 0.14, 0.28, 0.08, 0, 0.99, -0.2, darkMetalMaterial, group);
  createBox('Monitor Base', 0.42, 0.04, 0.24, 0, 0.88, -0.18, darkMetalMaterial, group);
  createBox('Monitor Screen Back', 0.86, 0.58, 0.08, 0, 1.28, -0.28, monitorMaterial, group);
  createBox('Monitor Blue Screen', 0.72, 0.44, 0.02, 0, 1.28, -0.325, screenMaterial, group);
  createBox('Keyboard', 0.72, 0.035, 0.22, 0, 0.88, 0.12, darkMetalMaterial, group);
  createBox('Mouse', 0.14, 0.035, 0.2, 0.48, 0.88, 0.12, darkMetalMaterial, group);
  createBox('CPU Tower', 0.28, 0.62, 0.45, -0.48, 0.33, 0.22, monitorMaterial, group);

  createBox('Chair Seat', 0.62, 0.12, 0.62, 0, 0.45, 0.85, chairMaterial, group);
  createBox('Chair Back', 0.62, 0.72, 0.12, 0, 0.88, 1.13, chairMaterial, group);
  createCylinder('Chair Post', 0.05, 0.42, 0, 0.24, 0.85, darkMetalMaterial, group, 14);
  for (const xOffset of [-0.25, 0.25]) {
    for (const zOffset of [0.62, 1.05]) {
      createCylinder('Chair Leg', 0.025, 0.45, xOffset, 0.22, zOffset, darkMetalMaterial, group, 10);
    }
  }

  return group;
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
createBox('Left Lift Door Lower Panel', 0.92, 0.55, 0.04, -0.6, 0.78, 11.94, metalMaterial, liftGroup);
createBox('Right Lift Door Lower Panel', 0.92, 0.55, 0.04, 0.6, 0.78, 11.94, metalMaterial, liftGroup);
createBox('Left Lift Door Upper Panel', 0.92, 0.55, 0.04, -0.6, 1.72, 11.94, metalMaterial, liftGroup);
createBox('Right Lift Door Upper Panel', 0.92, 0.55, 0.04, 0.6, 1.72, 11.94, metalMaterial, liftGroup);

createTextPanel('LEVEL 5', 1.45, 0.42, 0, 2.48, 11.92, '#111827', '#ffd84d', liftGroup);
createBox('Lift Handrail Left', 0.08, 0.08, 2.5, -2.05, 1.05, 14.45, railingMaterial, liftGroup);
createBox('Lift Handrail Right', 0.08, 0.08, 2.5, 2.05, 1.05, 14.45, railingMaterial, liftGroup);
createBox('Lift Handrail Back', 2.7, 0.08, 0.08, 0, 1.05, 16.05, railingMaterial, liftGroup);

createBox('Lift Button Panel', 0.12, 1.25, 0.45, -2.05, 1.45, 13.25, liftPanelMaterial, liftGroup);
createTextPanel('5', 0.28, 0.28, -1.97, 1.88, 13.25, '#111827', '#ffd84d', liftGroup);
for (let i = 0; i < 4; i++) {
  createCylinder('Lift Small Round Button', 0.055, 0.035, -1.96, 1.6 - i * 0.18, 13.23, liftButtonMaterial, liftGroup, 18).rotation.x = Math.PI / 2;
}

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
createWindowGrille('Lift Landing Window Grille', 0.2, 1.8, 9.58, 1.8, 1.2);
createNoticeBoard('Lift Landing Notice Board', -1.55, 1.65, 10.25, 0.8, 0.55, 0xf8fafc);

createBox('First Left Corridor Floor', 8.1, 0.2, 2.5, -5.05, -0.1, 10.9, floorMaterial);
createBox('First Corridor Solid Wall', 8.3, 3, 0.2, -5.05, 1.5, 12.15, wallMaterial);
createBox('First Corridor Balcony Barrier', 8.3, 1.2, 0.2, -5.05, 0.6, 9.65, wallMaterial);
createBox('First Corridor Ceiling', 8.3, 0.2, 2.5, -5.05, 3.1, 10.9, ceilingMaterial);
createBox('First Corridor Rail', 7.8, 0.12, 0.12, -5.05, 1.35, 9.78, railingMaterial);
createShoeRack(-6.2, 0, 11.65);
createBox('Corridor Wooden Bench Seat', 1.7, 0.12, 0.42, -4.6, 0.48, 11.6, woodMaterial);
createBox('Corridor Bench Back', 1.7, 0.45, 0.08, -4.6, 0.78, 11.82, woodMaterial);
createFireExtinguisher(-7.75, 0, 11.6);
createNoticeBoard('Corridor Notice Board', -3.2, 1.7, 12.02, 1.2, 0.75, 0xf5d76e);

createBox('Right Turn Corridor Floor', 2.8, 0.2, 17.2, -8.5, -0.1, 1.85, floorMaterial);
createBox('Right Turn Balcony Half Wall', 0.2, 1.2, 17, -7.1, 0.6, 1.85, wallMaterial);
createBox('Right Turn Balcony Rail', 0.12, 0.12, 16.3, -7.25, 1.35, 1.85, railingMaterial);
createBox('Right Turn Ceiling', 2.8, 0.2, 17.2, -8.5, 3.1, 1.85, ceilingMaterial);
createBox('Lab Wall Before Door', 0.22, 3, 6.0, -9.92, 1.5, -3.65, wallMaterial);
createBox('Lab Wall After Door', 0.22, 3, 6.0, -9.92, 1.5, 6.35, wallMaterial);
createAirCond('Corridor Wall Air Conditioner', -9.78, 2.38, -1.2);
createNoticeBoard('Lab Entrance Door Notices', -9.78, 1.6, 3.95, 0.9, 0.65, 0xf8fafc);

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
createBox('Lab Door Raised Top Panel', 0.04, 0.58, 0.82, 0.09, 0.28, -0.7, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }), labDoorPivot);
createBox('Lab Door Raised Bottom Panel', 0.04, 0.62, 0.82, 0.09, -0.55, -0.7, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }), labDoorPivot);
const labDoorHandle = createBox('Lab Door Handle', 0.22, 0.08, 0.08, 0.12, -0.1, -1.1, railingMaterial, labDoorPivot);
labDoorHandle.userData = labDoor.userData;

createTextPanel('LAB', 1.2, 0.32, -9.78, 2.58, 3.2, '#f5d76e', '#3a1f12');

createBox('Computer Lab Exit Door', 1.4, 2.4, 0.15, -14, 1.2, 6.38, doorMaterial);
createBox('Exit Door Raised Top Panel', 0.85, 0.56, 0.04, -14, 1.48, 6.28, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }));
createBox('Exit Door Raised Bottom Panel', 0.85, 0.62, 0.04, -14, 0.58, 6.28, new THREE.MeshStandardMaterial({ color: 0x4b2a17, roughness: 0.36 }));
createBox('Exit Door Handle', 0.08, 0.08, 0.25, -13.6, 1.1, 6.26, railingMaterial);
createTextPanel('KELUAR', 1.35, 0.34, -14, 2.62, 6.26, '#007a3d', '#ffffff');
createFireExtinguisher(-16.9, 0, 5.75);
createNoticeBoard('Exit Safety Notice', -15.4, 1.4, 6.26, 0.85, 0.55, 0xf8fafc);
createAirCond('Lab Rear Air Conditioner', -15.7, 2.45, -1.36);
createAirCond('Lab Side Air Conditioner', -12.4, 2.45, -1.36);
createBox('Front Whiteboard', 2.8, 1.05, 0.06, -14, 1.65, -1.36, whitePlasticMaterial);
createBox('Projector', 0.45, 0.18, 0.3, -14, 2.75, 1.1, whitePlasticMaterial);
createBox('Teacher Table', 1.75, 0.18, 0.8, -11.7, 0.78, 5.05, deskMaterial);
createBox('Teacher Monitor', 0.72, 0.48, 0.08, -11.7, 1.22, 4.78, monitorMaterial);
createBox('Teacher Screen', 0.58, 0.34, 0.02, -11.7, 1.22, 4.73, screenMaterial);

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const x = -16 + col * 2;
    const z = 0.6 + row * 1.8;
    createComputerStation(x, z);
  }
}

createCeilingGrid(8, 8, -14, 2.5, 3.02);

for (let x = -8; x <= -2; x += 2) {
  createFluorescentLight('First Corridor Ceiling Light', x, 2.95, 10.9, Math.PI / 2);
}

for (let z = -5; z <= 9; z += 4) {
  createFluorescentLight('Right Turn Ceiling Light', -8.5, 2.95, z, 0);
}

for (let x = -16; x <= -12; x += 2) {
  createFluorescentLight('Lab Ceiling Light', x, 2.95, 2.5, Math.PI / 2);
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
