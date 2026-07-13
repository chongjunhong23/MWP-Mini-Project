import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

const liftCameraPosition = new THREE.Vector3(0, 1.75, 15.1);
const liftCameraTarget = new THREE.Vector3(0, 1.45, 10.8);
camera.position.copy(liftCameraPosition);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

let lastFrameTime = performance.now();

const cameraRotation = {
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0
};

const mouseLookSensitivity = 0.0012;
const minPitch = THREE.MathUtils.degToRad(-89.9);
const maxPitch = THREE.MathUtils.degToRad(89.9);

const moveKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const walkSpeed = 2.2;
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
let lightTransitionProgress = 1.0;
let lightTransitionTarget = 1.0;

// ===============================
// MATERIALS
// ===============================

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1dfb5
});

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x7a7a7a
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff
});

const pillarMaterial = new THREE.MeshStandardMaterial({
  color: 0x653030
});

const doorMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a1f12
});

const railingMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111
});

const deskMaterial = new THREE.MeshStandardMaterial({
  color: 0x202020
});

const monitorMaterial = new THREE.MeshStandardMaterial({
  color: 0x050505
});

const chairMaterial = new THREE.MeshStandardMaterial({
  color: 0xbb2222
});

const carpetMaterial = new THREE.MeshStandardMaterial({
  color: 0x174a73
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0x9ca3af,
  metalness: 0.45,
  roughness: 0.28
});

const darkMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f2933,
  metalness: 0.35,
  roughness: 0.34
});

const screenMaterial = new THREE.MeshBasicMaterial({
  color: 0x5fb4ff
});

const whitePlasticMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.4
});

const noticeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.5
});

const extinguisherMaterial = new THREE.MeshStandardMaterial({
  color: 0xc1121f,
  roughness: 0.32
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x9a6a3a,
  roughness: 0.55
});

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

const liftButtonMaterial = new THREE.MeshBasicMaterial({
  color: 0xffd84d
});

const liftButtonActiveMaterial = new THREE.MeshBasicMaterial({
  color: 0x66ff99
});

const labMonitorModelUrl =
  '/models/office_monitor__workstation_monitor.glb';

const labKeyboardModelUrl =
  '/models/basic_keyboard.glb';

const labMouseModelUrl =
  '/models/gaming_mouse.glb';

const labBenchModelUrl =
  '/models/classic_park_bench.glb';

const officeChairModelUrl =
  '/models/ergonomic_office_chair.glb';

let lastZoneTitle = '';

// ===============================
// HELPER FUNCTIONS
// ===============================

function createBox(
  name,
  width,
  height,
  depth,
  x,
  y,
  z,
  material,
  parent = scene
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.name = name;
  mesh.position.set(x, y, z);

  parent.add(mesh);

  return mesh;
}

function createCylinder(
  name,
  radius,
  height,
  x,
  y,
  z,
  material,
  parent = scene,
  segments = 24
) {
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    segments
  );

  const mesh = new THREE.Mesh(geometry, material);

  mesh.name = name;
  mesh.position.set(x, y, z);

  parent.add(mesh);

  return mesh;
}

function createTextPanel(
  text,
  width,
  height,
  x,
  y,
  z,
  background,
  foreground,
  parent = scene
) {
  const textureCanvas = document.createElement('canvas');

  textureCanvas.width = 512;
  textureCanvas.height = 192;

  const context = textureCanvas.getContext('2d');

  context.fillStyle = background;
  context.fillRect(
    0,
    0,
    textureCanvas.width,
    textureCanvas.height
  );

  context.strokeStyle = foreground;
  context.lineWidth = 10;

  context.strokeRect(
    8,
    8,
    textureCanvas.width - 16,
    textureCanvas.height - 16
  );

  context.fillStyle = foreground;
  const lines = text.split('\n');
  let fontSize = 64;
  context.font = `bold ${fontSize}px Arial`;

  const longestLine = lines.reduce((longest, current) =>
    current.length > longest.length ? current : longest, ""
  );

  while (context.measureText(longestLine).width > textureCanvas.width - 40 && fontSize > 14) {
    fontSize -= 2;
    context.font = `bold ${fontSize}px Arial`;
  }

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const lineSpacing = fontSize * 1.15;
  const totalTextHeight = (lines.length - 1) * lineSpacing;
  const startY = (textureCanvas.height / 2) - (totalTextHeight / 2);

  lines.forEach((line, index) => {
    context.fillText(
      line,
      textureCanvas.width / 2,
      startY + index * lineSpacing
    );
  });

  const texture = new THREE.CanvasTexture(textureCanvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material
  );

  panel.position.set(x, y, z);

  parent.add(panel);

  return panel;
}

function createFluorescentLight(
  name,
  x,
  y,
  z,
  rotationY = 0,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = name;
  group.position.set(x, y, z);
  group.rotation.y = rotationY;

  parent.add(group);

  createBox(
    'Light Housing',
    1.25,
    0.05,
    0.32,
    0,
    0,
    0,
    whitePlasticMaterial,
    group
  );

  createBox(
    'Glowing Tube',
    1.05,
    0.035,
    0.2,
    0,
    -0.02,
    0,
    new THREE.MeshBasicMaterial({
      color: 0xffffdd
    }),
    group
  );

  return group;
}

function createCeilingGrid(
  width,
  depth,
  centerX,
  centerZ,
  y,
  parent = scene
) {
  for (
    let x = centerX - width / 2;
    x <= centerX + width / 2 + 0.01;
    x += 1
  ) {
    createBox(
      'Ceiling Grid Strip',
      0.025,
      0.025,
      depth,
      x,
      y,
      centerZ,
      metalMaterial,
      parent
    );
  }

  for (
    let z = centerZ - depth / 2;
    z <= centerZ + depth / 2 + 0.01;
    z += 1
  ) {
    createBox(
      'Ceiling Grid Strip',
      width,
      0.025,
      0.025,
      centerX,
      y,
      z,
      metalMaterial,
      parent
    );
  }
}

function createWindowGrille(
  name,
  x,
  y,
  z,
  width,
  height,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = name;
  group.position.set(x, y, z);

  parent.add(group);

  createBox(
    'Window Frame Top',
    width,
    0.06,
    0.05,
    0,
    height / 2,
    0,
    metalMaterial,
    group
  );

  createBox(
    'Window Frame Bottom',
    width,
    0.06,
    0.05,
    0,
    -height / 2,
    0,
    metalMaterial,
    group
  );

  createBox(
    'Window Frame Left',
    0.06,
    height,
    0.05,
    -width / 2,
    0,
    0,
    metalMaterial,
    group
  );

  createBox(
    'Window Frame Right',
    0.06,
    height,
    0.05,
    width / 2,
    0,
    0,
    metalMaterial,
    group
  );

  for (let i = -2; i <= 2; i++) {
    createBox(
      'Window Grille Bar',
      0.04,
      height,
      0.04,
      (i * width) / 5,
      0,
      0,
      metalMaterial,
      group
    );
  }

  return group;
}

function createNoticeBoard(
  name,
  x,
  y,
  z,
  width,
  height,
  color = 0xf5d76e,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = name;
  group.position.set(x, y, z);

  parent.add(group);

  createBox(
    'Notice Board Backing',
    width,
    height,
    0.06,
    0,
    0,
    0,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45
    }),
    group
  );

  createBox(
    'Notice Paper A',
    width * 0.32,
    height * 0.38,
    0.07,
    -width * 0.2,
    0.08,
    0.01,
    noticeMaterial,
    group
  );

  createBox(
    'Notice Paper B',
    width * 0.32,
    height * 0.28,
    0.07,
    width * 0.22,
    -0.08,
    0.01,
    noticeMaterial,
    group
  );

  createBox(
    'Notice Header Strip',
    width * 0.75,
    0.04,
    0.08,
    0,
    height * 0.28,
    0.02,
    new THREE.MeshBasicMaterial({
      color: 0xcc3333
    }),
    group
  );

  return group;
}

function addDoorPanels(
  parent,
  width,
  height,
  depth = 0.03
) {
  createBox(
    'Door Raised Top Panel',
    width * 0.62,
    height * 0.28,
    depth,
    0,
    height * 0.18,
    -0.09,
    new THREE.MeshStandardMaterial({
      color: 0x4b2a17,
      roughness: 0.36
    }),
    parent
  );

  createBox(
    'Door Raised Bottom Panel',
    width * 0.62,
    height * 0.32,
    depth,
    0,
    -height * 0.24,
    -0.09,
    new THREE.MeshStandardMaterial({
      color: 0x4b2a17,
      roughness: 0.36
    }),
    parent
  );
}

function createFireExtinguisher(
  x,
  y,
  z,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = 'Fire Extinguisher';
  group.position.set(x, y, z);
  group.scale.setScalar(0.55);
  group.rotation.y = - Math.PI / 2;

  parent.add(group);

  createCylinder(
    'Extinguisher Body',
    0.13,
    0.8,
    0,
    0.42,
    0,
    extinguisherMaterial,
    group
  );

  createCylinder(
    'Extinguisher Neck',
    0.06,
    0.16,
    0,
    0.9,
    0,
    darkMetalMaterial,
    group
  );

  const hose = createCylinder(
    'Extinguisher Hose',
    0.025,
    0.55,
    0.18,
    0.8,
    0,
    darkMetalMaterial,
    group,
    12
  );

  hose.rotation.z = Math.PI / 2.8;

  createBox(
    'Extinguisher Label',
    0.18,
    0.16,
    0.02,
    0,
    0.45,
    -0.13,
    noticeMaterial,
    group
  );

  return group;
}

function createShoeRack(
  x,
  y,
  z,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = 'Wooden Shoe Rack';
  group.position.set(x, y, z);

  parent.add(group);

  for (let level = 0; level < 3; level++) {
    createBox(
      'Shoe Rack Shelf',
      1.45,
      0.06,
      0.38,
      0,
      y + level * 0.26,
      0,
      woodMaterial,
      group
    );
  }

  for (const xOffset of [-0.68, 0.68]) {
    createBox(
      'Shoe Rack Side',
      0.06,
      0.7,
      0.42,
      xOffset,
      y + 0.32,
      0,
      woodMaterial,
      group
    );
  }

  return group;
}

function createAirCond(
  name,
  x,
  y,
  z,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = name;
  group.position.set(x, y, z);

  parent.add(group);

  createBox(
    'Air Conditioner Body',
    1.15,
    0.35,
    0.22,
    0,
    0,
    0,
    whitePlasticMaterial,
    group
  );

  createBox(
    'Air Conditioner Vent',
    0.95,
    0.045,
    0.04,
    0,
    -0.11,
    -0.12,
    darkMetalMaterial,
    group
  );

  createBox(
    'Air Conditioner Indicator',
    0.1,
    0.035,
    0.03,
    0.42,
    0.07,
    -0.13,
    new THREE.MeshBasicMaterial({
      color: 0x66ff99
    }),
    group
  );

  return group;
}

// ==========================================
// INTERACTIVE ASSETS, SOUND & BOBBING STATE
// ==========================================
const interactiveScreens = [];
const interactiveChairs = [];
const acPositions = [
  new THREE.Vector3(-17.2, 2.45, 10.26),
  new THREE.Vector3(-13.1, 2.45, 10.26),
  new THREE.Vector3(-17.2, 2.45, -8.46),
  new THREE.Vector3(-13.1, 2.45, -8.46)
];
let acHumNode = null;
let bobTime = 0;
const bobFrequency = 5.5;
const bobAmplitude = 0.02;
const baseEyeHeight = 1.75;

function startACHum() {
  try {
    const ctx = THREE.AudioContext.getContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(120, ctx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    acHumNode = { osc1, osc2, gain };
  } catch (e) {}
}

function updateACHumVolume() {
  if (!acHumNode) return;
  try {
    const playerPos = camera.position;
    let minDistance = Infinity;
    acPositions.forEach((pos) => {
      const dist = playerPos.distanceTo(pos);
      if (dist < minDistance) minDistance = dist;
    });
    let vol = Math.max(0, 1 - minDistance / 9.0) * 0.08;
    const ctx = THREE.AudioContext.getContext();
    acHumNode.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.2);
  } catch (e) {}
}

function playClickSound() {
  try {
    const ctx = THREE.AudioContext.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

function playDoorSound() {
  try {
    const ctx = THREE.AudioContext.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.7);
    
    const fm = ctx.createOscillator();
    const fmGain = ctx.createGain();
    fm.frequency.setValueAtTime(20, ctx.currentTime);
    fmGain.gain.setValueAtTime(15, ctx.currentTime);
    fm.connect(fmGain);
    fmGain.connect(osc.frequency);
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    
    fm.start();
    osc.start();
    fm.stop(ctx.currentTime + 0.7);
    osc.stop(ctx.currentTime + 0.7);
  } catch (e) {}
}

function createTerminalTexture(screenNum) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, 256, 128);
  
  ctx.fillStyle = '#5fb4ff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`System: Makmal Komputer`, 10, 20);
  ctx.fillStyle = '#34d399';
  ctx.fillText(`> node main.js --run`, 10, 42);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Compiling modules... ok`, 10, 64);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`Workstation ${screenNum}: ONLINE`, 10, 86);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px monospace';
  ctx.fillText(`Click screen to Power Off`, 10, 112);
  
  return new THREE.CanvasTexture(canvas);
}

function toggleMonitorScreen(screen) {
  screen.userData.isOn = !screen.userData.isOn;
  if (screen.userData.isOn) {
    screen.material = new THREE.MeshBasicMaterial({
      map: createTerminalTexture(screen.userData.id),
      side: THREE.DoubleSide
    });
  } else {
    screen.material = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.1,
      metalness: 0.9
    });
  }
}

function createComputerStation(
  x,
  z,
  parent = scene,
  rotationY = 0
) {
  const group = new THREE.Group();

  group.name = 'Detailed Computer Station';
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  parent.add(group);

  createBox(
    'Lab Desk Top',
    1.45,
    0.12,
    0.9,
    0,
    0.78,
    0,
    deskMaterial,
    group
  );

  createBox(
    'Desk Left Side',
    0.08,
    0.7,
    0.75,
    -0.62,
    0.38,
    0,
    darkMetalMaterial,
    group
  );

  createBox(
    'Desk Right Side',
    0.08,
    0.7,
    0.75,
    0.62,
    0.38,
    0,
    darkMetalMaterial,
    group
  );

  createBox(
    'Desk Back Modesty Panel',
    1.25,
    0.48,
    0.06,
    0,
    0.42,
    -0.38,
    darkMetalMaterial,
    group
  );

  const screenId = interactiveScreens.length + 1;
  // Placeholder pushed now so id is correct; actual mesh replaced in onLoad
  const screenPlaceholder = { userData: { isMonitorScreen: true, isOn: true, id: screenId } };
  const screenSlotIndex = interactiveScreens.length;
  interactiveScreens.push(screenPlaceholder);

  loadSceneModel({
    url: labMonitorModelUrl,
    name: 'Downloaded Workstation Monitor',
    position: [0, 0.95, -0.2],
    rotation: [0, -Math.PI / 2, 0],
    scale: 0.00108,
    parent: group,
    onLoad: (monitorModel) => {
      // Find the largest mesh inside the monitor GLTF - that's the screen panel
      let screenMesh = null;
      let largestArea = 0;
      monitorModel.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.geometry.computeBoundingBox();
          const bb = child.geometry.boundingBox;
          const w = bb.max.x - bb.min.x;
          const h = bb.max.y - bb.min.y;
          const area = w * h;
          if (area > largestArea) {
            largestArea = area;
            screenMesh = child;
          }
        }
      });
      if (screenMesh) {
        screenMesh.userData = {
          isMonitorScreen: true,
          isOn: true,
          id: screenId
        };
        screenMesh.material = new THREE.MeshBasicMaterial({
          map: createTerminalTexture(screenId)
        });
        interactiveScreens[screenSlotIndex] = screenMesh;
      }
    }
  });

  loadSceneModel({
    url: labKeyboardModelUrl,
    name: 'Downloaded Lab Keyboard',
    position: [-1.18, 0.873, -0.53],
    scale: [1.59, 1.3, 1.52],
    parent: group
  });

  loadSceneModel({
    url: labMouseModelUrl,
    name: 'Downloaded Lab Gaming Mouse',
    position: [0.48, 0.84, 0.12],
    scale: [0.17, 0.1, 0.13],
    parent: group
  });

  createBox(
    'CPU Tower',
    0.28,
    0.62,
    0.45,
    -0.48,
    0.33,
    0.22,
    monitorMaterial,
    group
  );

  loadSceneModel({
    url: officeChairModelUrl,
    name: 'Downloaded Lab Office Chair',
    position: [0, 0.04, 0.42],
    rotation: [0, -13 * Math.PI / 36, 0],
    scale: 0.92,
    parent: group,
    onLoad: (chair) => {
      chair.userData = {
        isOfficeChair: true,
        initialRotationY: chair.rotation.y,
        isSwivelRight: false
      };
      chair.traverse((child) => {
        if (child.isMesh) {
          child.userData = chair.userData;
          child.userData.chairRoot = chair;
        }
      });
      interactiveChairs.push(chair);
    }
  });

  return group;
}

function setCameraView(position, target) {
  camera.position.copy(position);

  const direction = target
    .clone()
    .sub(position)
    .normalize();

  const yaw = Math.atan2(
    -direction.x,
    -direction.z
  );

  const pitch = THREE.MathUtils.clamp(
    Math.asin(direction.y),
    minPitch,
    maxPitch
  );

  cameraRotation.yaw = yaw;
  cameraRotation.pitch = pitch;
  cameraRotation.targetYaw = yaw;
  cameraRotation.targetPitch = pitch;

  applyCameraRotation();
}

function applyCameraRotation() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = cameraRotation.yaw;
  camera.rotation.x = cameraRotation.pitch;
  camera.rotation.z = 0;
}

function resetCameraZoom() {
  camera.fov = 60;
  camera.updateProjectionMatrix();
}

const walkableZones = [
  // 1. Lift Interior (Safe distance from back/side walls and door to prevent clipping)
  {
    minX: -1.1,
    maxX: 1.1,
    minZ: 12.8,
    maxZ: 15.2
  },
  // 2. Lift Door Threshold (Only passable if lift door is open; connects lift to landing)
  {
    minX: -0.8,
    maxX: 0.8,
    minZ: 11.7,
    maxZ: 13.0,
    needsLiftDoor: true
  },
  // 3. Corridor Walkway (Allows walking on the landing and the main corridor)
  {
    minX: -9.5,
    maxX: 1.4,
    minZ: 10.0,
    maxZ: 11.4
  },
  // 3b. Lift Front Approach (Allows approaching the lift doors in the corridor without wall clipping)
  {
    minX: -0.8,
    maxX: 0.8,
    minZ: 11.4,
    maxZ: 11.8
  },
  // 4. Corridor Turn & Balcony View (Restricted so user cannot walk through lab wall or balcony)
  {
    minX: -9.6,
    maxX: -7.4,
    minZ: -8.2,
    maxZ: 11.4
  },
  // 5. Lab Door Threshold (Only passable if lab door is open; bridges corridor and lab interior)
  {
    minX: -10.3,
    maxX: -9.5,
    minZ: 2.5,
    maxZ: 3.5,
    needsLabDoor: true
  },
  // 6. Lab Interior (Prevents clipping through lab walls)
  {
    minX: -23.8,
    maxX: -10.2,
    minZ: -7.9,
    maxZ: 9.4
  },
  // 7. Exit Door Threshold (Only passable if exit door is open; bridges corridor and lab interior at the side exit)
  {
    minX: -10.3,
    maxX: -9.5,
    minZ: -6.9,
    maxZ: -5.4,
    needsExitDoor: true
  }
];

function isInsideZone(position, zone) {
  if (zone.needsLiftDoor && !liftDoorOpen) {
    return false;
  }

  if (zone.needsLabDoor && !labDoorOpen) {
    return false;
  }

  if (zone.needsExitDoor && !exitDoorOpen) {
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
  // Check open lab door panel collision to prevent walking through the open door panel mesh
  if (labDoorOpen) {
    // Widened range along Z to account for player collision radius and slight open angle
    if (position.z >= 3.55 && position.z <= 4.45 && position.x >= -11.8 && position.x <= -9.7) {
      return false;
    }
  }

  // Check open exit door panel collision to prevent walking through the open door panel mesh
  if (exitDoorOpen) {
    // Widened range along Z to account for player collision radius and slight open angle
    if (position.z >= -7.45 && position.z <= -6.55 && position.x >= -11.8 && position.x <= -9.7) {
      return false;
    }
  }

  return walkableZones.some((zone) =>
    isInsideZone(position, zone)
  );
}

function moveCameraBy(offset) {
  const nextPosition = camera.position
    .clone()
    .add(offset);

  nextPosition.y = camera.position.y;

  if (!canWalkTo(nextPosition)) {
    return;
  }

  camera.position.copy(nextPosition);
}

// ===============================
// LIFT OPENING SCENE
// ===============================

const liftGroup = new THREE.Group();

liftGroup.name = 'Lift Opening Scene';

scene.add(liftGroup);

const gltfLoader = new GLTFLoader();
const liftDoorParts = [];
const liftDoorMeshes = [];
const modelCache = new Map();

function registerLiftDoorPart(object) {
  const isLeftDoor =
    object.name === 'LeftOutsideDoor' ||
    object.name === 'LeftInteriorDoor';

  const isRightDoor =
    object.name === 'RightOutsideDoor' ||
    object.name === 'RightInteriorDoor';

  if (!isLeftDoor && !isRightDoor) {
    return;
  }

  object.userData.isLiftDoor = true;
  liftDoorMeshes.push(object);

  liftDoorParts.push({
    object,
    closed: object.position.clone(),
    open: object.position.clone().add(
      new THREE.Vector3(
        0,
        0,
        isLeftDoor ? 0.8 : -0.84
      )
    )
  });
}

function applyLiftModelDoorProgress(progress) {
  liftDoorParts.forEach((part) => {
    part.object.position.lerpVectors(
      part.closed,
      part.open,
      progress
    );
  });
}

function prepareLoadedModel(model) {
  model.traverse((object) => {
    if (object.isMesh) {
      object.frustumCulled = false;
    }
  });
}

function loadSceneModel({
  url,
  name,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  parent = scene,
  onLoad = null
}) {
  const placeModel = (sourceModel) => {
    const model = sourceModel.clone(true);

    model.name = name;
    model.position.set(...position);
    model.rotation.set(...rotation);

    if (Array.isArray(scale)) {
      model.scale.set(...scale);
    } else {
      model.scale.setScalar(scale);
    }

    parent.add(model);

    if (onLoad) {
      onLoad(model);
    }

    return model;
  };

  if (!modelCache.has(url)) {
    modelCache.set(
      url,
      new Promise((resolve) => {
        gltfLoader.load(url, (gltf) => {
          prepareLoadedModel(gltf.scene);
          resolve(gltf.scene);
        });
      })
    );
  }

  modelCache.get(url).then(placeModel);
}

gltfLoader.load(
  '/models/ElevatorAnimation.glb',
  (gltf) => {
    const elevatorModel = gltf.scene;

    elevatorModel.name =
      'Realistic Animated Elevator Model';

    elevatorModel.position.set(
      0,
      -0.08,
      12.25
    );

    elevatorModel.rotation.y = Math.PI / 2;
    elevatorModel.scale.setScalar(1.2);

    liftGroup.add(elevatorModel);

    // Force update world matrices to compute correct world positions for children
    elevatorModel.updateMatrixWorld(true);

    elevatorModel.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = false;

        // Compute world-space bounding box
        const bbox = new THREE.Box3().setFromObject(object);

        // Hide side wall parts extending into the corridor (X < -2.2) to let user see outside
        // Keep lift buttons and controls visible (which are at X >= -2.2)
        if (bbox.min.x < -2.2) {
          const nameLower = object.name.toLowerCase();
          if (!nameLower.includes('button') && 
              !nameLower.includes('panel') && 
              !nameLower.includes('call') && 
              !nameLower.includes('arrow') &&
              !nameLower.includes('display')) {
            object.visible = false;
          }
        }
      }

      registerLiftDoorPart(object);
    });

    applyLiftModelDoorProgress(
      liftDoorProgress
    );
  }
);

const liftButton = createBox(
  'Clickable Lift Open Button',
  0.42,
  0.72,
  0.42,
  -1.75,
  1.45,
  12.65,
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  }),
  liftGroup
);

liftButton.userData = {
  isLiftButton: true,
  title: 'Open Lift Door',
  text:
    'The lift door opens to begin the FC-N28 Level 5 tour route.'
};

const directionArrowGroup = new THREE.Group();

directionArrowGroup.name =
  'Corridor Direction Arrow';

scene.add(directionArrowGroup);

const arrowMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffd000,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });

// Create 2D arrow shape pointing left (negative X direction)
const arrowShape = new THREE.Shape();
arrowShape.moveTo(-0.8, 0);
arrowShape.lineTo(0, 0.45);
arrowShape.lineTo(0, 0.14);
arrowShape.lineTo(1.23, 0.14);
arrowShape.lineTo(1.23, -0.14);
arrowShape.lineTo(0, -0.14);
arrowShape.lineTo(0, -0.45);
arrowShape.closePath();

const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
const arrowStem = new THREE.Mesh(arrowGeometry, arrowMaterial);
arrowStem.name = 'Arrow Stem';
arrowStem.position.set(-1.88, 0.015, 10.9);
arrowStem.rotation.x = -Math.PI / 2;
directionArrowGroup.add(arrowStem);

// Dummy mesh for compatibility with update loop opacity setting
const arrowHead = new THREE.Mesh(
  new THREE.BufferGeometry(),
  arrowMaterial
);
arrowHead.name = 'Arrow Head Dummy';
directionArrowGroup.add(arrowHead);

let liftDoorOpen = false;
let liftDoorProgress = 0;

function toggleLiftDoors() {
  liftDoorOpen = !liftDoorOpen;
}

function resetLiftDoors() {
  liftDoorOpen = false;
  liftDoorProgress = 0;

  applyLiftModelDoorProgress(
    liftDoorProgress
  );

  arrowMaterial.opacity = 0;
}

// ===============================
// FC-N28 LEVEL 5 ENVIRONMENT
// ===============================

createBox(
  'Lift Landing Floor',
  4.2,
  0.2,
  2.7,
  -0.35,
  -0.1,
  11.0,
  floorMaterial
);

createBox(
  'Lift Door Threshold Strip',
  3.8,
  0.035,
  0.7,
  -0.3,
  0.015,
  12.0,
  metalMaterial
);

createBox(
  'Landing Front Barrier',
  3.8,
  1.2,
  0.2,
  -0.15,
  0.6,
  9.65,
  wallMaterial
);

createBox(
  'Landing Balcony Top Cap',
  3.8,
  0.08,
  0.28,
  -0.15,
  1.22,
  9.65,
  wallMaterial
);

createBox(
  'Landing Right Wall',
  0.22,
  3,
  2.55,
  1.8,
  1.5,
  10.95,
  wallMaterial
);

// Close the outside corner without protruding into the corridor path.
createBox(
  'Corridor Outside Corner Side Wall',
  0.18,
  3.2,
  1.75,
  -10.58,
  1.5,
  11.275,
  wallMaterial
);

createBox(
  'Corridor Outside Corner Back Connector',
  0.46,
  3.2,
  0.24,
  -10.44,
  1.5,
  12.08,
  wallMaterial
);

createBox(
  'Corridor Outside Corner L Wall Long Leg',
  0.36,
  3.2,
  1.75,
  -10.86,
  1.5,
  11.275,
  wallMaterial
);

createBox(
  'Corridor Outside Corner L Wall Return Leg',
  1.08,
  3.2,
  0.3,
  -10.9,
  1.5,
  12.0,
  wallMaterial
);

createBox(
  'Corridor Outside Corner Floor Cover',
  0.4,
  0.12,
  1.75,
  -10.42,
  -0.06,
  11.275,
  floorMaterial
);

createBox(
  'Corridor Outside Corner L Floor Cover',
  1.1,
  0.12,
  1.795,
  -10.88,
  -0.06,
  11.2975,
  floorMaterial
);

createBox(
  'Corridor Outside Corner Underfloor',
  0.46,
  0.18,
  1.85,
  -10.42,
  -0.18,
  11.325,
  floorMaterial
);

createBox(
  'Corridor Outside Corner Base Seal',
  0.16,
  0.22,
  1.75,
  -10.2,
  0.11,
  11.275,
  wallMaterial
);

createBox(
  'Corridor Outside Corner Ceiling Cover',
  0.4,
  0.2,
  2.5,
  -10.42,
  3.1,
  10.9,
  ceilingMaterial
);

createBox(
  'Landing Ceiling',
  3.7,
  0.2,
  2.4,
  -0.15,
  3.1,
  10.95,
  ceilingMaterial
);

createBox(
  'Landing Safety Rail',
  3.6,
  0.12,
  0.12,
  -0.15,
  1.35,
  9.78,
  railingMaterial
);

loadSceneModel({
  url:
    '/models/kenney/construction-barrier.glb',
  name:
    'Downloaded Landing Safety Barrier',
  position: [-0.15, 0.03, 9.45],
  rotation: [0, Math.PI, 0],
  scale: 1.15
});

createBox(
  'First Left Corridor Floor',
  8.95,
  0.2,
  2.5,
  -5.48,
  -0.1,
  10.9,
  floorMaterial
);

createBox(
  'Lift Control Full Wall',
  1.4,
  3.0,
  0.2,
  -1.5,
  1.5,
  12.15,
  wallMaterial
);

createBox(
  'First Corridor Left Balcony Barrier',
  7.72,
  1.2,
  0.2,
  -6.06,
  0.6,
  12.15,
  wallMaterial
);

createBox(
  'First Corridor Left Balcony Top Cap',
  7.72,
  0.08,
  0.28,
  -6.06,
  1.22,
  12.15,
  wallMaterial
);

createBox(
  'First Corridor Left Rail',
  7.42,
  0.12,
  0.12,
  -6.21,
  1.35,
  12.02,
  railingMaterial
);

createBox(
  'First Corridor Balcony Barrier',
  6.2,
  1.2,
  0.2,
  -4.1,
  0.6,
  9.65,
  wallMaterial
);

createBox(
  'First Corridor Balcony Top Cap',
  6.2,
  0.08,
  0.28,
  -4.1,
  1.22,
  9.65,
  wallMaterial
);

createBox(
  'First Corridor Ceiling',
  9.05,
  0.2,
  2.5,
  -5.43,
  3.1,
  10.9,
  ceilingMaterial
);

createBox(
  'First Corridor Rail',
  6.01,
  0.12,
  0.12,
  -4.305,
  1.35,
  9.78,
  railingMaterial
);

const corridorNoticeBoard = createNoticeBoard(
  'Corridor Notice Board',
  -9.78,
  1.7,
  -3.0,
  1.2,
  0.75,
  0xf5d76e
);
corridorNoticeBoard.rotation.y = Math.PI / 2;

createBox(
  'Right Turn Corridor Floor',
  3.0,
  0.2,
  18.35,
  -8.5,
  -0.1,
  0.575,
  floorMaterial
);

createBox(
  'Right Turn Balcony Half Wall',
  0.2,
  1.2,
  18.15,
  -7.1,
  0.6,
  0.675,
  wallMaterial
);

createBox(
  'Right Turn Balcony Rail',
  0.12,
  0.12,
  17.89,
  -7.25,
  1.35,
  0.895,
  railingMaterial
);

createBox(
  'Right Turn Balcony Flat Face',
  0.05,
  1.18,
  18.15,
  -6.98,
  0.6,
  0.675,
  wallMaterial
);

createBox(
  'Balcony Corner Wall Cap',
  0.24,
  1.2,
  0.24,
  -7.1,
  0.6,
  9.65,
  wallMaterial
);

createBox(
  'Right Turn Balcony Top Cap',
  0.28,
  0.08,
  18.15,
  -7.1,
  1.22,
  0.675,
  wallMaterial
);

createBox(
  'Right Turn Ceiling',
  3.0,
  0.2,
  18.35,
  -8.5,
  3.1,
  0.575,
  ceilingMaterial
);

createBox(
  'Right Turn Corridor End Wall',
  3.0,
  3.05,
  0.24,
  -8.5,
  1.525,
  -8.6,
  wallMaterial
);

createBox(
  'Right Turn Corridor End Floor Seal',
  3.0,
  0.08,
  0.45,
  -8.5,
  0.02,
  -8.38,
  floorMaterial
);



createBox(
  'Corridor L Corner Enclosed Wall Cap',
  0.22,
  3.0,
  1.85,
  -9.92,
  1.5,
  11.32,
  wallMaterial
);

createBox(
  'Lab Wall Before Exit Door',
  0.22,
  3,
  1.45,
  -9.92,
  1.5,
  -7.85,
  wallMaterial
);

createBox(
  'Lab Wall Between Exit And Entry Doors',
  0.22,
  3,
  7.65,
  -9.92,
  1.5,
  -1.48,
  wallMaterial
);

createBox(
  'Lab Door Lower Jamb',
  0.24,
  2.45,
  0.18,
  -9.92,
  1.225,
  2.35,
  wallMaterial
);

createBox(
  'Lab Door Upper Jamb',
  0.24,
  2.45,
  0.18,
  -9.92,
  1.225,
  4.05,
  wallMaterial
);

createBox(
  'Lab Wall After Entry Door',
  0.22,
  3,
  6.35,
  -9.92,
  1.5,
  7.22,
  wallMaterial
);

createBox(
  'Lab Door Top Lintel',
  0.24,
  0.72,
  2.05,
  -9.92,
  2.74,
  3.2,
  wallMaterial
);

createBox(
  'Lab Door Exterior Header Fill',
  0.08,
  0.68,
  2.05,
  -9.74,
  2.76,
  3.2,
  wallMaterial
);

createBox(
  'Lab Door Metal Sill',
  0.22,
  0.02,
  2.05,
  -9.92,
  0.01,
  3.2,
  metalMaterial
);





createBox(
  'Lab Wall Base Seal Before Exit',
  0.08,
  0.18,
  1.35,
  -9.74,
  0.09,
  -7.85,
  wallMaterial
);

createBox(
  'Lab Wall Base Seal Between Doors',
  0.08,
  0.18,
  7.45,
  -9.74,
  0.09,
  -1.48,
  wallMaterial
);

createBox(
  'Lab Wall Base Seal After Entry',
  0.08,
  0.18,
  6.05,
  -9.74,
  0.09,
  7.15,
  wallMaterial
);

const labEntranceNotices = createNoticeBoard(
  'Lab Entrance Door Notices',
  -9.78,
  1.65,
  1.4,
  0.85,
  0.6,
  0xf8fafc
);
labEntranceNotices.rotation.y = Math.PI / 2;

loadSceneModel({
  url: '/models/shoe_rack.glb',
  name:
    'Downloaded Lab Entrance Shoe Rack',
  position: [-9.32, 0.04, 1.2],
  rotation: [0, Math.PI / 2, 0],
  scale: 2.04
});

loadSceneModel({
  url: labBenchModelUrl,
  name: 'Lab Entrance Corridor Bench',
  position: [-8.95, -0.04, -1.75],
  scale: 0.825
});

createFireExtinguisher(
  -9.6,
  0.5,
  -0.3
);

for (let z = 8; z >= -8; z -= 4) {
  createBox(
    'Right Turn Balcony Pillar',
    0.35,
    3,
    0.35,
    -7.2,
    1.5,
    z,
    pillarMaterial
  );
}

createBox(
  'Computer Lab Floor',
  14.6,
  0.2,
  19,
  -17.25,
  -0.1,
  0.9,
  carpetMaterial
);

createBox(
  'Computer Lab Back Teaching Wall',
  14.8,
  3,
  0.2,
  -17.3,
  1.5,
  -8.6,
  wallMaterial
);

createBox(
  'Computer Lab Exit Wall',
  14.8,
  3,
  0.2,
  -17.3,
  1.5,
  10.4,
  wallMaterial
);

createBox(
  'Computer Lab Left Wall',
  0.2,
  3,
  19,
  -24.65,
  1.5,
  0.9,
  wallMaterial
);

createBox(
  'Computer Lab Ceiling',
  14.8,
  0.2,
  19,
  -17.3,
  3.1,
  0.9,
  ceilingMaterial
);



createBox(
  'Lab Left Window Panel',
  0.04,
  1.15,
  2.2,
  -24.51,
  1.78,
  -2.1,
  new THREE.MeshBasicMaterial({
    color: 0x8ccfff,
    transparent: true,
    opacity: 0.42
  })
);

createBox(
  'Lab Left Window Panel',
  0.04,
  1.15,
  2.2,
  -24.51,
  1.78,
  1.8,
  new THREE.MeshBasicMaterial({
    color: 0x8ccfff,
    transparent: true,
    opacity: 0.42
  })
);

createBox(
  'Lab Left Window Panel',
  0.04,
  1.15,
  2.2,
  -24.51,
  1.78,
  5.7,
  new THREE.MeshBasicMaterial({
    color: 0x8ccfff,
    transparent: true,
    opacity: 0.42
  })
);

createBox(
  'Lab Storage Cabinet',
  0.45,
  1.7,
  1.1,
  -24.2,
  0.85,
  8.85,
  woodMaterial
);

createBox(
  'Lab Storage Cabinet Door',
  0.04,
  1.45,
  0.45,
  -23.93,
  0.93,
  8.6,
  doorMaterial
);

createBox(
  'Lab Storage Cabinet Door',
  0.04,
  1.45,
  0.45,
  -23.93,
  0.93,
  9.1,
  doorMaterial
);

const labDoorPivot = new THREE.Group();

labDoorPivot.name =
  'Computer Lab Door Pivot';

labDoorPivot.position.set(
  -9.92,
  1.22,
  4.05
);

scene.add(labDoorPivot);

const labDoor = createBox(
  'Openable Computer Lab Door',
  0.15,
  2.36,
  1.65,
  0,
  0,
  -0.825,
  doorMaterial,
  labDoorPivot
);

labDoor.userData = {
  isLabDoor: true,
  title: 'Computer Lab Door',
  text:
    'This door opens into the FC-N28 Level 5 computer lab.'
};

createBox(
  'Lab Door Raised Top Panel',
  0.04,
  0.88,
  1,
  0.09,
  0.43,
  -0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  labDoorPivot
);

createBox(
  'Lab Door Raised Top Panel Inner',
  0.04,
  0.88,
  1,
  -0.09,
  0.43,
  -0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  labDoorPivot
);

const doorNameplate = createTextPanel(
  'Makmal Pengaturcaraan\nKomputer',
  0.75,
  0.40,
  0.111,
  0.43,
  -0.825,
  '#d4af37',
  '#111111',
  labDoorPivot
);
doorNameplate.rotation.y = Math.PI / 2;

createBox(
  'Lab Door Raised Bottom Panel',
  0.04,
  0.62,
  1,
  0.09,
  -0.55,
  -0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  labDoorPivot
);

createBox(
  'Lab Door Raised Bottom Panel Inner',
  0.04,
  0.62,
  1,
  -0.09,
  -0.55,
  -0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  labDoorPivot
);

function createDoorHandleGroup(parentPivot, sideSign, doorUserData, namePrefix, handleZ = -1.32) {
  const handleGroup = new THREE.Group();
  handleGroup.name = `${namePrefix} Handle Group`;
  parentPivot.add(handleGroup);

  const handleX = sideSign * 0.135;
  const handleY = -0.1;

  const mainBar = createBox(
    `${namePrefix} Handle Pull Bar`,
    0.03,
    0.35,
    0.03,
    handleX,
    handleY,
    handleZ,
    railingMaterial,
    handleGroup
  );

  const upperConnector = createBox(
    `${namePrefix} Handle Upper Connector`,
    0.10,
    0.03,
    0.03,
    sideSign * 0.085,
    handleY + 0.13,
    handleZ,
    railingMaterial,
    handleGroup
  );

  const lowerConnector = createBox(
    `${namePrefix} Handle Lower Connector`,
    0.10,
    0.03,
    0.03,
    sideSign * 0.085,
    handleY - 0.13,
    handleZ,
    railingMaterial,
    handleGroup
  );

  mainBar.userData = doorUserData;
  upperConnector.userData = doorUserData;
  lowerConnector.userData = doorUserData;

  return { mainBar, upperConnector, lowerConnector };
}

const labDoorHandleMeshes = [];
const labDoorHandles = [
  createDoorHandleGroup(labDoorPivot, 1, labDoor.userData, 'Lab Door Outer'),
  createDoorHandleGroup(labDoorPivot, -1, labDoor.userData, 'Lab Door Inner')
];
labDoorHandles.forEach((h) => {
  labDoorHandleMeshes.push(h.mainBar, h.upperConnector, h.lowerConnector);
});

// LAB corridor sign removed per user request

createBox(
  'Exit Door Lower Jamb',
  0.24,
  2.45,
  0.18,
  -9.92,
  1.225,
  -7.05,
  wallMaterial
);

createBox(
  'Exit Door Upper Jamb',
  0.24,
  2.45,
  0.18,
  -9.92,
  1.225,
  -5.35,
  wallMaterial
);

createBox(
  'Exit Door Top Lintel',
  0.24,
  0.72,
  1.98,
  -9.92,
  2.74,
  -6.2,
  wallMaterial
);

createBox(
  'Exit Door Metal Sill',
  0.22,
  0.02,
  2.0,
  -9.92,
  0.01,
  -6.2,
  metalMaterial
);



const exitDoorPivot = new THREE.Group();

exitDoorPivot.name =
  'Computer Lab Side Exit Door Pivot';

exitDoorPivot.position.set(
  -9.92,
  1.22,
  -7.0
);

scene.add(exitDoorPivot);

const exitDoor = createBox(
  'Openable Computer Lab Side Exit Door',
  0.15,
  2.36,
  1.65,
  0,
  0,
  0.825,
  doorMaterial,
  exitDoorPivot
);

exitDoor.userData = {
  isExitDoor: true,
  title: 'Computer Lab Door',
  text:
    'This door opens into the FC-N28 Level 5 computer lab.'
};

createBox(
  'Exit Door Raised Top Panel',
  0.04,
  0.88,
  1,
  0.09,
  0.43,
  0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  exitDoorPivot
);

createBox(
  'Exit Door Raised Top Panel Inner',
  0.04,
  0.88,
  1,
  -0.09,
  0.43,
  0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  exitDoorPivot
);

const exitDoorNameplate = createTextPanel(
  'Makmal Pengaturcaraan\nKomputer',
  0.75,
  0.40,
  0.111,
  0.43,
  0.825,
  '#d4af37',
  '#111111',
  exitDoorPivot
);
exitDoorNameplate.rotation.y = Math.PI / 2;

createBox(
  'Exit Door Raised Bottom Panel',
  0.04,
  0.62,
  1,
  0.09,
  -0.55,
  0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  exitDoorPivot
);

createBox(
  'Exit Door Raised Bottom Panel Inner',
  0.04,
  0.62,
  1,
  -0.09,
  -0.55,
  0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  exitDoorPivot
);

const exitDoorHandleMeshes = [];
const exitDoorHandles = [
  createDoorHandleGroup(exitDoorPivot, 1, exitDoor.userData, 'Exit Door Outer', 1.32),
  createDoorHandleGroup(exitDoorPivot, -1, exitDoor.userData, 'Exit Door Inner', 1.32)
];
exitDoorHandles.forEach((h) => {
  exitDoorHandleMeshes.push(h.mainBar, h.upperConnector, h.lowerConnector);
});

const keluarSign = createTextPanel(
  'KELUAR',
  1.35,
  0.34,
  -10.15,
  2.57,
  -6.175,
  '#007a3d',
  '#ffffff'
);
keluarSign.rotation.y = -Math.PI / 2;

// Exit LAB corridor sign removed per user request

const labKeluarSign = createTextPanel(
  'KELUAR',
  1.35,
  0.34,
  -10.15,
  2.57,
  3.225,
  '#007a3d',
  '#ffffff'
);
labKeluarSign.rotation.y = -Math.PI / 2;

createFireExtinguisher(
  -24,
  0,
  9.45
);

const exitSafetyNotice = createNoticeBoard(
  'Exit Safety Notice',
  -10.08,
  1.45,
  -7.55,
  0.9,
  0.58,
  0xf8fafc
);
exitSafetyNotice.rotation.y = -Math.PI / 2;

createAirCond(
  'Lab Rear Air Conditioner',
  -17.2,
  2.45,
  10.26
);

createAirCond(
  'Lab Side Air Conditioner',
  -13.1,
  2.45,
  10.26
);

const labOppositeWallAirConditionerA = createAirCond(
  'Lab Opposite Wall Air Conditioner A',
  -17.2,
  2.45,
  -8.46
);
labOppositeWallAirConditionerA.rotation.y = Math.PI;

const labOppositeWallAirConditionerB = createAirCond(
  'Lab Opposite Wall Air Conditioner B',
  -13.1,
  2.45,
  -8.46
);
labOppositeWallAirConditionerB.rotation.y = Math.PI;

createBox(
  'Projector Screen Frame',
  0.02,
  2.3,
  4.1,
  -10.05,
  1.65,
  -1.48,
  darkMetalMaterial
);

createBox(
  'Projector Screen Mat',
  0.02,
  2.2,
  4.0,
  -10.07,
  1.65,
  -1.48,
  new THREE.MeshBasicMaterial({
    color: 0xffffff
  })
);

createBox(
  'Projector',
  0.45,
  0.18,
  0.3,
  -13.2,
  2.75,
  -1.48,
  whitePlasticMaterial
);

createBox(
  'Teacher Desk Top',
  1.08,
  0.12,
  2.55,
  -12.3,
  0.78,
  -1.48,
  deskMaterial
);

createBox(
  'Teacher Desk Left Side',
  0.86,
  0.7,
  0.08,
  -12.3,
  0.38,
  -2.69,
  darkMetalMaterial
);

createBox(
  'Teacher Desk Right Side',
  0.86,
  0.7,
  0.08,
  -12.3,
  0.38,
  -0.27,
  darkMetalMaterial
);

createBox(
  'Teacher Desk Back Modesty Panel',
  0.08,
  0.48,
  2.25,
  -11.85,
  0.42,
  -1.48,
  darkMetalMaterial
);

const teacherScreenSlotIndex = interactiveScreens.length;
const teacherScreenPlaceholder = { userData: { isMonitorScreen: true, isOn: true, id: 'Teacher' } };
interactiveScreens.push(teacherScreenPlaceholder);

loadSceneModel({
  url: labMonitorModelUrl,
  name:
    'Downloaded Teacher Workstation Monitor',
  position: [-12.5, 0.96, -1.48],
  rotation: [0, 0, 0],
  scale: 0.0011,
  onLoad: (monitorModel) => {
    let screenMesh = null;
    let largestArea = 0;
    monitorModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const bb = child.geometry.boundingBox;
        const w = bb.max.x - bb.min.x;
        const h = bb.max.y - bb.min.y;
        const area = w * h;
        if (area > largestArea) {
          largestArea = area;
          screenMesh = child;
        }
      }
    });
    if (screenMesh) {
      screenMesh.userData = {
        isMonitorScreen: true,
        isOn: true,
        id: 'Teacher'
      };
      screenMesh.material = new THREE.MeshBasicMaterial({
        map: createTerminalTexture('Teacher')
      });
      interactiveScreens[teacherScreenSlotIndex] = screenMesh;
    }
  }
});

loadSceneModel({
  url: labKeyboardModelUrl,
  name: 'Downloaded Teacher Keyboard',
  position: [-12.9, 0.88, -0.62],
  rotation: [0, Math.PI / 2, 0],
  scale: [1.59, 1.3, 1.52]
});

loadSceneModel({
  url: labMouseModelUrl,
  name: 'Downloaded Teacher Gaming Mouse',
  position: [-12.1, 0.84, -2.2],
  rotation: [0, Math.PI / 2, 0],
  scale: [0.17, 0.1, 0.13]
});

loadSceneModel({
  url: officeChairModelUrl,
  name:
    'Downloaded Teacher Office Chair',
  position: [-11.27, 0.04, -1.48],
  rotation: [0, Math.PI / 18, 0],
  scale: 0.92,
  onLoad: (chair) => {
    chair.userData = {
      isOfficeChair: true,
      initialRotationY: chair.rotation.y,
      isSwivelRight: false
    };
    chair.traverse((child) => {
      if (child.isMesh) {
        child.userData = chair.userData;
        child.userData.chairRoot = chair;
      }
    });
    interactiveChairs.push(chair);
  }
});

const pairedDeskColumns = [
  -22.8,
  -18.55,
  -14.3
];

const pairedDeskRows = [
  -3.3,
  -1.85,
  1.8,
  3.25,
  5.8,
  7.25
];

for (const z of pairedDeskRows) {
  for (const x of pairedDeskColumns) {
    createComputerStation(
      x,
      z,
      scene,
      -Math.PI / 2
    );
  }
}

createCeilingGrid(
  14.8,
  19,
  -17.3,
  0.9,
  3.02
);

for (let x = -8; x <= -2; x += 2) {
  createFluorescentLight(
    'First Corridor Ceiling Light',
    x,
    2.95,
    10.9,
    Math.PI / 2
  );
}

for (let z = -7; z <= 9; z += 4) {
  createFluorescentLight(
    'Right Turn Ceiling Light',
    -8.5,
    2.95,
    z,
    0
  );
}

for (
  let x = -20.4;
  x <= -11.8;
  x += 2.2
) {
  for (
    let z = -5.8;
    z <= 8.2;
    z += 3.6
  ) {
    createFluorescentLight(
      'Lab Ceiling Light',
      x,
      2.95,
      z,
      Math.PI / 2
    );
  }
}



let labDoorOpen = false;
let labDoorProgress = 0;
let exitDoorOpen = false;
let exitDoorProgress = 0;

function toggleLabDoor() {
  labDoorOpen = !labDoorOpen;
}

function resetLabDoor() {
  labDoorOpen = false;
  labDoorProgress = 0;

  labDoorPivot.rotation.y = 0;
}

function toggleExitDoor() {
  exitDoorOpen = !exitDoorOpen;
}

function resetExitDoor() {
  exitDoorOpen = false;
  exitDoorProgress = 0;

  exitDoorPivot.rotation.y = 0;
}

// Hotspots have been removed in favor of automatic position-based info panels

// ===============================
// RAYCASTER FOR CLICKS
// ===============================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel =
  document.querySelector(
    '#info-panel'
  );

const infoTitle =
  document.querySelector(
    '#info-title'
  );

const infoText =
  document.querySelector(
    '#info-text'
  );

function updateInfoPanelByPosition() {
  if (!tourStarted) {
    infoPanel.style.display = 'none';
    return;
  }

  const pos = camera.position;
  let zoneTitle = '';
  let zoneText = '';

  if (pos.z >= 11.8) {
    zoneTitle = 'Starting Point Inside Lift';
    zoneText = 'This is the opening scene of the FC-N28 Level 5 tour. The user begins inside the lift, then opens the door to enter the corridor walkway.';
  } else if (pos.x < -10.3) {
    // Inside the computer lab
    zoneTitle = 'Computer Lab';
    zoneText = 'The computer lab contains paired computer desks, chairs, monitor with keyboard and mouse on each desk, and a projector screen at the front.';
  } else {
    zoneTitle = 'Level 5 Open Corridor Walkway';
    zoneText = 'From the lift landing, users turn left into this corridor before turning right toward the computer lab entrance.';
  }

  if (zoneTitle !== lastZoneTitle) {
    lastZoneTitle = zoneTitle;
    infoTitle.textContent = zoneTitle;
    infoText.textContent = zoneText;
    infoPanel.style.display = 'block';
  }
}

window.addEventListener(
  'mousemove',
  (event) => {
    if (!tourStarted || document.pointerLockElement !== canvas) {
      return;
    }

    cameraRotation.targetYaw -=
      event.movementX *
      mouseLookSensitivity;

    cameraRotation.targetPitch =
      THREE.MathUtils.clamp(
        cameraRotation.targetPitch -
          event.movementY *
            mouseLookSensitivity,
        minPitch,
        maxPitch
      );
  }
);

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();

    camera.fov =
      THREE.MathUtils.clamp(
        camera.fov +
          event.deltaY * 0.025,
        38,
        75
      );

    camera.updateProjectionMatrix();
  },
  {
    passive: false
  }
);

  canvas.addEventListener(
    'click',
    (event) => {
      if (tourStarted && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }

      if (document.pointerLockElement === canvas) {
        mouse.x = 0;
        mouse.y = 0;
      } else {
        mouse.x =
          (event.clientX /
            window.innerWidth) *
            2 -
          1;

        mouse.y =
          -(event.clientY /
            window.innerHeight) *
            2 +
          1;
      }

      raycaster.setFromCamera(
        mouse,
        camera
      );

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length === 0) {
      return;
    }

    const hit = intersects[0];
    if (hit.distance > 3.5) {
      return;
    }

    const clickedObject = hit.object;

    // Check parent chain to see if clickedObject is part of labDoor or exitDoor
    let isLab = false;
    let isExit = false;
    let temp = clickedObject;
    while (temp) {
      if (temp === labDoorPivot || temp === labDoor || (temp.userData && temp.userData.isLabDoor)) {
        isLab = true;
        break;
      }
      if (temp === exitDoorPivot || temp === exitDoor || (temp.userData && temp.userData.isExitDoor)) {
        isExit = true;
        break;
      }
      temp = temp.parent;
    }

    if (
      clickedObject.userData.isLiftButton ||
      clickedObject.userData.isLiftDoor
    ) {
      toggleLiftDoors();
      playClickSound();
      playDoorSound();
    } else if (isLab) {
      toggleLabDoor();
      playClickSound();
      playDoorSound();
    } else if (isExit) {
      toggleExitDoor();
      playClickSound();
      playDoorSound();
    } else if (clickedObject.userData.isOfficeChair) {
      const chair = clickedObject.userData.chairRoot;
      chair.userData.isSwivelRight = !chair.userData.isSwivelRight;
      playClickSound();
    }
  }
);

// ===============================
// UI BUTTONS
// ===============================

const welcomeScreen =
  document.querySelector(
    '#welcome-screen'
  );

const startBtn =
  document.querySelector(
    '#start-btn'
  );

const closeInfoBtn =
  document.querySelector(
    '#close-info-btn'
  );

function returnToLiftStart() {
  resetTourView();
}

startBtn.addEventListener(
  'click',
  () => {
    welcomeScreen.style.display =
      'none';

    tourStarted = true;

    // Show the minimap container
    const minimap = document.querySelector('#minimap-container');
    if (minimap) {
      minimap.classList.add('visible');
    }

    // Initialize Web Audio, play click, and start AC ambient hum
    try {
      const ctx = THREE.AudioContext.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      playClickSound();
      startACHum();
    } catch (e) {
      console.warn('Failed to start AC hum audio:', e);
    }

    resetCameraZoom();

    setCameraView(
      liftCameraPosition,
      liftCameraTarget
    );

    canvas.requestPointerLock();
  }
);

// Pointer Lock Controls & Crosshair Setup
const crosshairElement = document.querySelector('#crosshair');

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    if (crosshairElement) {
      crosshairElement.style.display = 'block';
    }
  } else {
    if (crosshairElement) {
      crosshairElement.style.display = 'none';
    }
  }
});

closeInfoBtn.addEventListener(
  'click',
  () => {
    playClickSound();
    infoPanel.style.display =
      'none';
  }
);

function resetTourView() {
  // Reset movement keys
  moveKeys.forward = false;
  moveKeys.backward = false;
  moveKeys.left = false;
  moveKeys.right = false;

  // Set tourStarted to false
  tourStarted = false;

  // Restore daytime lighting instantly if night mode was active
  lightsOn = true;
  lightTransitionTarget = 1.0;
  lightTransitionProgress = 1.0;
  ambientLight.intensity = 0.8;
  sunLight.intensity = 1.2;
  liftLight.intensity = 1.5;
  scene.background = new THREE.Color(0xbfdfff);

  // Stop AC ambient hum
  if (acHumNode) {
    try {
      acHumNode.osc1.stop();
      acHumNode.osc2.stop();
    } catch (e) {}
    acHumNode = null;
  }

  // Reset interactive screens to ON
  interactiveScreens.forEach((screen) => {
    if (screen && screen.userData && screen.userData.isMonitorScreen) {
      screen.userData.isOn = true;
      if (screen.material) {
        screen.material = new THREE.MeshBasicMaterial({
          map: createTerminalTexture(screen.userData.id)
        });
      }
    }
  });

  // Reset interactive chairs to default rotation
  interactiveChairs.forEach((chair) => {
    if (chair && chair.userData) {
      chair.userData.isSwivelRight = false;
      chair.rotation.y = chair.userData.initialRotationY;
    }
  });

  // Reset doors & zoom
  resetLiftDoors();
  resetLabDoor();
  resetExitDoor();
  resetCameraZoom();
  lastZoneTitle = '';

  // Reset camera position and target
  setCameraView(
    liftCameraPosition,
    liftCameraTarget
  );

  // Exit pointer lock if currently locked
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }

  // Hide info panel & HUD interaction prompts, show welcome screen
  if (infoPanel) {
    infoPanel.style.display = 'none';
  }
  const prompt = document.querySelector('#action-prompt');
  if (prompt) {
    prompt.classList.remove('visible');
  }
  const ch = document.querySelector('#crosshair');
  if (ch) {
    ch.classList.remove('active');
    ch.style.display = 'none';
  }
  if (welcomeScreen) {
    welcomeScreen.style.display = 'flex';
  }
  const minimap = document.querySelector('#minimap-container');
  if (minimap) {
    minimap.classList.remove('visible');
  }
}

function toggleLight() {
  lightsOn = !lightsOn;
  lightTransitionTarget = lightsOn ? 1.0 : 0.0;
}

window.addEventListener(
  'keydown',
  (event) => {
    if (
      event.target instanceof
        HTMLInputElement ||
      event.target instanceof
        HTMLTextAreaElement
    ) {
      return;
    }

    const key =
      event.key.toLowerCase();

    if (key === 'w') {
      moveKeys.forward = true;
    }

    if (key === 's') {
      moveKeys.backward = true;
    }

    if (key === 'a') {
      moveKeys.left = true;
    }

    if (key === 'd') {
      moveKeys.right = true;
    }

    if (key === 'r' && tourStarted) {
      resetTourView();
    }

    if (key === 'l' && tourStarted) {
      toggleLight();
    }
  }
);

window.addEventListener(
  'keyup',
  (event) => {
    const key =
      event.key.toLowerCase();

    if (key === 'w') {
      moveKeys.forward = false;
    }

    if (key === 's') {
      moveKeys.backward = false;
    }

    if (key === 'a') {
      moveKeys.left = false;
    }

    if (key === 'd') {
      moveKeys.right = false;
    }
  }
);

function updatePlayerMovement(delta) {
  if (!tourStarted) {
    return;
  }

  const forward =
    new THREE.Vector3();

  camera.getWorldDirection(forward);

  forward.y = 0;

  if (forward.lengthSq() === 0) {
    return;
  }

  forward.normalize();

  const right =
    new THREE.Vector3();

  right
    .crossVectors(
      forward,
      camera.up
    )
    .normalize();

  const movement =
    new THREE.Vector3();

  if (moveKeys.forward) {
    movement.add(forward);
  }

  if (moveKeys.backward) {
    movement.sub(forward);
  }

  if (moveKeys.right) {
    movement.add(right);
  }

  if (moveKeys.left) {
    movement.sub(right);
  }

  if (movement.lengthSq() === 0) {
    return;
  }

  movement
    .normalize()
    .multiplyScalar(
      walkSpeed * delta
    );

  moveCameraBy(movement);
}

// ===============================
// RESPONSIVE RESIZE
// ===============================

window.addEventListener(
  'resize',
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );
  }
);

// HUD Interaction Prompt Update
const actionPrompt = document.querySelector('#action-prompt');
const actionText = actionPrompt ? actionPrompt.querySelector('.action-text') : null;
const crosshair = document.querySelector('#crosshair');

function updateHUDInteractionPrompt() {
  if (!tourStarted || document.pointerLockElement !== canvas) {
    if (actionPrompt) actionPrompt.classList.remove('visible');
    if (crosshair) crosshair.classList.remove('active');
    return;
  }

  // Raycast from the center of the viewport (0, 0)
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const hit = intersects[0];
    if (hit.distance <= 3.5) {
      const hitObj = hit.object;
      let promptString = '';

      // Check parent chain to see if hitObj is part of labDoor or exitDoor
      let isLab = false;
      let isExit = false;
      let temp = hitObj;
      while (temp) {
        if (temp === labDoorPivot || temp === labDoor || (temp.userData && temp.userData.isLabDoor)) {
          isLab = true;
          break;
        }
        if (temp === exitDoorPivot || temp === exitDoor || (temp.userData && temp.userData.isExitDoor)) {
          isExit = true;
          break;
        }
        temp = temp.parent;
      }

      if (hitObj.userData.isLiftButton || hitObj.userData.isLiftDoor) {
        promptString = liftDoorOpen ? 'Click to Close Lift Door' : 'Click to Open Lift Door';
      } else if (isLab) {
        promptString = labDoorOpen ? 'Click to Close Lab Door' : 'Click to Open Lab Door';
      } else if (isExit) {
        promptString = exitDoorOpen ? 'Click to Close Lab Door' : 'Click to Open Lab Door';
      } else if (hitObj.userData.isOfficeChair) {
        promptString = 'Click to Swivel Chair';
      }

      if (promptString) {
        if (actionText) actionText.textContent = promptString;
        if (actionPrompt) actionPrompt.classList.add('visible');
        if (crosshair) crosshair.classList.add('active');
        return;
      }
    }
  }

  // Hide HUD prompt and reset crosshair if nothing was hit
  if (actionPrompt) actionPrompt.classList.remove('visible');
  if (crosshair) crosshair.classList.remove('active');
}

// ===============================
// MINIMAP DRAWING LOGIC
// ===============================
function drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const playerPos = camera.position;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Center of canvas
  const cx = 80;
  const cy = 80;
  const scale = 8.0; // 8 pixels per world unit (zoomed in nicely for local surroundings)

  // 1. Draw circular HUD grid background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.arc(cx, cy, 76, 0, Math.PI * 2);
  ctx.fill();

  // Circular clip so drawing stays inside the circular map frame
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.clip();

  // Grid background lines (scrolling relative to player position)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;
  const offsetX = -(playerPos.x * scale) % 20;
  const offsetZ = -(playerPos.z * scale) % 20;
  for (let i = offsetX - 20; i < 180; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 160);
    ctx.stroke();
  }
  for (let i = offsetZ - 20; i < 180; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(160, i);
    ctx.stroke();
  }

  // Translate to center, then offset by negative player position (player-centered map!)
  ctx.translate(cx, cy);
  ctx.translate(-playerPos.x * scale, -playerPos.z * scale);

  // 2. Draw walkable zones (rooms and corridors)
  ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = 1.5;

  walkableZones.forEach((zone) => {
    const x = zone.minX * scale;
    const z = zone.minZ * scale;
    const w = (zone.maxX - zone.minX) * scale;
    const h = (zone.maxZ - zone.minZ) * scale;

    ctx.fillRect(x, z, w, h);
    ctx.strokeRect(x, z, w, h);
  });

  // 3. Draw student workstation desks
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  pairedDeskRows.forEach((z) => {
    pairedDeskColumns.forEach((x) => {
      // Desk is 1.45 wide (X) and 0.9 deep (Z)
      ctx.fillRect((x - 0.725) * scale, (z - 0.45) * scale, 1.45 * scale, 0.9 * scale);
    });
  });

  // 4. Draw teacher desk
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  // Teacher desk is centered at X = -12.27, Z = -1.48
  ctx.fillRect((-12.27 - 0.49) * scale, (-1.48 - 1.2) * scale, 0.98 * scale, 2.4 * scale);

  // 5. Draw interactive doors
  // Lift doors: centered at X = 0, Z = 11.8
  ctx.strokeStyle = liftDoorOpen ? '#34d399' : '#f87171';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (liftDoorOpen) {
    // Open slides
    ctx.moveTo(-1.2 * scale, 11.8 * scale);
    ctx.lineTo(-0.7 * scale, 11.8 * scale);
    ctx.moveTo(0.7 * scale, 11.8 * scale);
    ctx.lineTo(1.2 * scale, 11.8 * scale);
  } else {
    // Closed
    ctx.moveTo(-1.2 * scale, 11.8 * scale);
    ctx.lineTo(1.2 * scale, 11.8 * scale);
  }
  ctx.stroke();

  // Lab entrance door: centered at X = -9.92, Z = 3.225
  ctx.strokeStyle = labDoorOpen ? '#34d399' : '#f87171';
  ctx.beginPath();
  if (labDoorOpen) {
    // Open swing
    ctx.moveTo(-9.92 * scale, 3.225 * scale);
    ctx.lineTo(-9.92 * scale, (3.225 - 0.8) * scale);
  } else {
    // Closed
    ctx.moveTo(-9.92 * scale, 2.4 * scale);
    ctx.lineTo(-9.92 * scale, 4.05 * scale);
  }
  ctx.stroke();

  // Exit door: centered at X = -9.92, Z = -6.175
  ctx.strokeStyle = exitDoorOpen ? '#34d399' : '#f87171';
  ctx.beginPath();
  if (exitDoorOpen) {
    // Open swing
    ctx.moveTo(-9.92 * scale, -6.175 * scale);
    ctx.lineTo(-9.92 * scale, (-6.175 + 0.8) * scale);
  } else {
    // Closed
    ctx.moveTo(-9.92 * scale, -7.0 * scale);
    ctx.lineTo(-9.92 * scale, -5.35 * scale);
  }
  ctx.stroke();

  ctx.restore(); // Restore clip context

  // 6. Draw player representation (dot & view direction) at the exact center of the map
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-cameraRotation.yaw); // Rotate to face player's yaw direction (0 yaw points UP)
  
  // Draw cone of vision
  ctx.fillStyle = 'rgba(251, 207, 36, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 22, -Math.PI / 6 - Math.PI / 2, Math.PI / 6 - Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  // Draw player center dot
  const pulse = 1.0 + Math.sin(performance.now() * 0.007) * 0.15;
  ctx.fillStyle = '#fbcf24';
  ctx.shadowColor = '#fbcf24';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 3.5 * pulse, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===============================
// ANIMATION LOOP
// ===============================

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();

  const delta = Math.min(
    (now - lastFrameTime) /
      1000,
    0.05
  );

  lastFrameTime = now;

  // Smooth day/night lighting transition
  if (Math.abs(lightTransitionProgress - lightTransitionTarget) > 0.001) {
    lightTransitionProgress = THREE.MathUtils.damp(
      lightTransitionProgress,
      lightTransitionTarget,
      2.0,
      delta
    );
    ambientLight.intensity = THREE.MathUtils.lerp(0.25, 0.8, lightTransitionProgress);
    sunLight.intensity = THREE.MathUtils.lerp(0.15, 1.2, lightTransitionProgress);
    liftLight.intensity = THREE.MathUtils.lerp(0.55, 1.5, lightTransitionProgress);
    scene.background.lerpColors(
      new THREE.Color(0x111827),
      new THREE.Color(0xbfdfff),
      lightTransitionProgress
    );
  } else {
    lightTransitionProgress = lightTransitionTarget;
    ambientLight.intensity = lightsOn ? 0.8 : 0.25;
    sunLight.intensity = lightsOn ? 1.2 : 0.15;
    liftLight.intensity = lightsOn ? 1.5 : 0.55;
    scene.background.setHex(lightsOn ? 0xbfdfff : 0x111827);
  }

  // Smooth camera rotation damping
  cameraRotation.yaw = THREE.MathUtils.damp(
    cameraRotation.yaw,
    cameraRotation.targetYaw,
    11.5,
    delta
  );

  cameraRotation.pitch = THREE.MathUtils.damp(
    cameraRotation.pitch,
    cameraRotation.targetPitch,
    11.5,
    delta
  );

  applyCameraRotation();

  updatePlayerMovement(delta);

  updateInfoPanelByPosition();

  updateHUDInteractionPrompt();

  if (tourStarted) {
    drawMinimap();
  }

  const targetProgress =
    liftDoorOpen ? 1 : 0;

  const liftDoorDamp = liftDoorOpen ? 3.0 : 2.0;

  liftDoorProgress =
    THREE.MathUtils.damp(
      liftDoorProgress,
      targetProgress,
      liftDoorDamp,
      delta
    );

  applyLiftModelDoorProgress(
    liftDoorProgress
  );

  arrowMaterial.opacity =
    THREE.MathUtils.lerp(
      0,
      0.9,
      liftDoorProgress
    );

  arrowStem.material.opacity =
    arrowMaterial.opacity;

  arrowHead.material.opacity =
    arrowMaterial.opacity;

  const labDoorMaxRotation = Math.PI / 2.15;
  const labDoorDamp = labDoorOpen ? 3.0 : 2.0;

  labDoorProgress =
    THREE.MathUtils.damp(
      labDoorProgress,
      labDoorOpen ? 1 : 0,
      labDoorDamp,
      delta
    );

  labDoorPivot.rotation.y =
    THREE.MathUtils.lerp(
      0,
      labDoorMaxRotation,
      labDoorProgress
    );

  const exitDoorMaxRotation = -Math.PI / 2.15;
  const exitDoorDamp = exitDoorOpen ? 3.0 : 2.0;

  exitDoorProgress =
    THREE.MathUtils.damp(
      exitDoorProgress,
      exitDoorOpen ? 1 : 0,
      exitDoorDamp,
      delta
    );

  exitDoorPivot.rotation.y =
    THREE.MathUtils.lerp(
      0,
      exitDoorMaxRotation,
      exitDoorProgress
    );

  // Update spatial AC ambient hum volume based on distance
  updateACHumVolume();

  // Head bobbing walks offset animation
  const isMoving = tourStarted && (moveKeys.forward || moveKeys.backward || moveKeys.left || moveKeys.right);
  if (isMoving) {
    bobTime += delta;
    const bobOffset = Math.sin(bobTime * bobFrequency) * bobAmplitude;
    camera.position.y = baseEyeHeight + bobOffset;
  } else {
    camera.position.y = THREE.MathUtils.damp(camera.position.y, baseEyeHeight, 10.0, delta);
    bobTime = THREE.MathUtils.damp(bobTime, 0, 5.0, delta);
  }

  // Smooth chair swivel damping
  interactiveChairs.forEach((chair) => {
    const targetRot = chair.userData.isSwivelRight ? chair.userData.initialRotationY + Math.PI / 4 : chair.userData.initialRotationY;
    chair.rotation.y = THREE.MathUtils.damp(
      chair.rotation.y,
      targetRot,
      8.0,
      delta
    );
  });



  renderer.render(
    scene,
    camera
  );
}

animate();
