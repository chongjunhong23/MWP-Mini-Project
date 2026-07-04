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

const cameraRotation = {
  yaw: 0,
  pitch: 0
};

const mouseLookSensitivity = 0.0022;
const minPitch = THREE.MathUtils.degToRad(-78);
const maxPitch = THREE.MathUtils.degToRad(78);

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

const officeChairModelUrl =
  '/models/ergonomic_office_chair.glb';

const hotspotMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  depthTest: false
});

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
  context.font = 'bold 64px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillText(
    text,
    textureCanvas.width / 2,
    textureCanvas.height / 2
  );

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

function createComputerStation(
  x,
  z,
  parent = scene
) {
  const group = new THREE.Group();

  group.name = 'Detailed Computer Station';
  group.position.set(x, 0, z);

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

  loadSceneModel({
    url: labMonitorModelUrl,
    name: 'Downloaded Workstation Monitor',
    position: [0, 0.95, -0.2],
    rotation: [0, -Math.PI / 2, 0],
    scale: 0.00108,
    parent: group
  });

  createBox(
    'Keyboard',
    0.72,
    0.035,
    0.22,
    0,
    0.88,
    0.12,
    darkMetalMaterial,
    group
  );

  createBox(
    'Mouse',
    0.14,
    0.035,
    0.2,
    0.48,
    0.88,
    0.12,
    darkMetalMaterial,
    group
  );

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
    position: [0, 0.04, 0.92],
    rotation: [0, Math.PI, 0],
    scale: 0.92,
    parent: group
  });

  return group;
}

function setCameraView(position, target) {
  camera.position.copy(position);

  const direction = target
    .clone()
    .sub(position)
    .normalize();

  cameraRotation.yaw = Math.atan2(
    -direction.x,
    -direction.z
  );

  cameraRotation.pitch = THREE.MathUtils.clamp(
    Math.asin(direction.y),
    minPitch,
    maxPitch
  );

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
  {
    minX: -1.75,
    maxX: 1.75,
    minZ: 12.1,
    maxZ: 15.8
  },
  {
    minX: -1.75,
    maxX: 1.35,
    minZ: 10.25,
    maxZ: 12.35,
    needsLiftDoor: true
  },
  {
    minX: -8.9,
    maxX: -1.2,
    minZ: 9.65,
    maxZ: 12.15,
    needsLiftDoor: true
  },
  {
    minX: -9.9,
    maxX: -7.1,
    minZ: -6.8,
    maxZ: 12.15,
    needsLiftDoor: true
  },
  {
    minX: -10.55,
    maxX: -9.7,
    minZ: 2.45,
    maxZ: 3.65,
    needsLiftDoor: true,
    needsLabDoor: true
  },
  {
    minX: -24.2,
    maxX: -10.35,
    minZ: -4.7,
    maxZ: 9.75,
    needsLiftDoor: true,
    needsLabDoor: true
  }
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
  parent = scene
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

    elevatorModel.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = false;
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
    opacity: 0
  });

const arrowStem = createBox(
  'Arrow Stem',
  1.4,
  0.05,
  0.28,
  -1.35,
  0.08,
  10.9,
  arrowMaterial,
  directionArrowGroup
);

const arrowHead = new THREE.Mesh(
  new THREE.ConeGeometry(
    0.45,
    0.8,
    4
  ),
  arrowMaterial
);

arrowHead.name = 'Arrow Head';
arrowHead.position.set(-2.28, 0.08, 10.9);
arrowHead.rotation.z = Math.PI / 2;

directionArrowGroup.add(arrowHead);

let liftDoorOpen = false;
let liftDoorProgress = 0;

function openLiftDoors() {
  liftDoorOpen = true;

  openLiftBtn.disabled = true;
  openLiftBtn.textContent =
    'Lift Door Open';
}

function resetLiftDoors() {
  liftDoorOpen = false;
  liftDoorProgress = 0;

  applyLiftModelDoorProgress(
    liftDoorProgress
  );

  openLiftBtn.disabled = false;
  openLiftBtn.textContent =
    'Open Lift Door';

  arrowMaterial.opacity = 0;
}

// ===============================
// FC-N28 LEVEL 5 ENVIRONMENT
// ===============================

createBox(
  'Lift Landing Floor',
  3.7,
  0.18,
  2.05,
  -0.15,
  -0.11,
  10.78,
  floorMaterial
);

createBox(
  'Lift Door Threshold Strip',
  3.45,
  0.035,
  0.32,
  -0.15,
  0.015,
  11.86,
  metalMaterial
);

createBox(
  'Landing Front Barrier',
  3.8,
  1.25,
  0.22,
  -0.15,
  0.62,
  9.7,
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

// ==========================================================
// CORRECT LEFT LIFT CORNER FIX
// Thin side wall at the actual blue corner.
// It does not cross or overlap the balcony.
// ==========================================================

// Narrow vertical wall beside the left edge of the lift.
//
// X is thin: 0.18
// Z is longer: 1.9
//
// The wall extends from z = 9.60 to z = 11.50.
// Therefore, it stays behind the lift entrance and does not
// come forward toward the camera.
createBox(
  'Lift Left Corner Side Wall',
  0.24,
  3.2,
  2.35,
  -2.18,
  1.5,
  10.78,
  wallMaterial
);

// Small wall connection at the back.
// This joins the side wall to the existing balcony barrier,
// without extending across the balcony.
createBox(
  'Lift Left Corner Back Connector',
  1.15,
  3.2,
  0.24,
  -2.52,
  1.5,
  9.62,
  wallMaterial
);

// Floor strip beneath the same corner.
// It is only placed on the left side of the lift.
createBox(
  'Lift Left Corner Floor Strip',
  1.2,
  0.2,
  2.35,
  -2.48,
  -0.1,
  10.78,
  floorMaterial
);

// Lower backing floor.
// This is below the visible floor and prevents blue cracks.
createBox(
  'Lift Left Corner Underfloor',
  1.55,
  0.3,
  2.55,
  -2.35,
  -0.32,
  10.78,
  floorMaterial
);

// Small ceiling strip directly above the corner.
createBox(
  'Lift Left Corner Ceiling Strip',
  1.2,
  0.2,
  2.35,
  -2.48,
  3.1,
  10.78,
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
  9.82,
  railingMaterial
);

createWindowGrille(
  'Lift Landing Window Grille',
  0.2,
  1.8,
  9.58,
  1.8,
  1.2
);

createNoticeBoard(
  'Lift Landing Notice Board',
  -1.55,
  1.65,
  10.25,
  0.8,
  0.55,
  0xf8fafc
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
  8.1,
  0.2,
  2.5,
  -5.05,
  -0.1,
  10.9,
  floorMaterial
);

createBox(
  'First Corridor Solid Wall',
  8.3,
  3,
  0.2,
  -5.05,
  1.5,
  12.15,
  wallMaterial
);

createBox(
  'First Corridor Balcony Barrier',
  6,
  1.2,
  0.2,
  -4,
  0.6,
  9.65,
  wallMaterial
);

createBox(
  'First Corridor Ceiling',
  8.3,
  0.2,
  2.5,
  -5.05,
  3.1,
  10.9,
  ceilingMaterial
);

createBox(
  'First Corridor Rail',
  5.7,
  0.12,
  0.12,
  -4.15,
  1.35,
  9.78,
  railingMaterial
);

createNoticeBoard(
  'Corridor Notice Board',
  -3.2,
  1.7,
  12.02,
  1.2,
  0.75,
  0xf5d76e
);

createBox(
  'Right Turn Corridor Floor',
  2.8,
  0.2,
  16.45,
  -8.5,
  -0.1,
  1.425,
  floorMaterial
);

createBox(
  'Right Turn Balcony Half Wall',
  0.2,
  1.2,
  16.25,
  -7.1,
  0.6,
  1.525,
  wallMaterial
);

createBox(
  'Right Turn Balcony Rail',
  0.12,
  0.12,
  15.9,
  -7.25,
  1.35,
  1.7,
  railingMaterial
);

createBox(
  'Right Turn Balcony Flat Face',
  0.05,
  1.18,
  16.25,
  -6.98,
  0.6,
  1.525,
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
  16.25,
  -7.1,
  1.22,
  1.525,
  wallMaterial
);

createBox(
  'Right Turn Ceiling',
  2.8,
  0.2,
  16.45,
  -8.5,
  3.1,
  1.425,
  ceilingMaterial
);

createBox(
  'Lab Wall Before Door',
  0.22,
  3,
  8.9,
  -9.92,
  1.5,
  -2.2,
  wallMaterial
);

createBox(
  'Lab Wall After Door',
  0.22,
  3,
  5.3,
  -9.92,
  1.5,
  6.7,
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
  'Lab Door Threshold Floor Fill',
  2.95,
  0.05,
  2.05,
  -11.15,
  0.025,
  3.2,
  floorMaterial
);

createBox(
  'Lab Door Corridor Floor Patch',
  0.95,
  0.045,
  2.05,
  -9.55,
  0.025,
  3.2,
  floorMaterial
);

createBox(
  'Lab Exterior Safety Wall Before Door',
  0.55,
  3,
  8.75,
  -10.22,
  1.5,
  -2.275,
  wallMaterial
);

createBox(
  'Lab Exterior Safety Wall After Door',
  0.55,
  3.25,
  6.45,
  -10.22,
  1.625,
  7.2,
  wallMaterial
);

createBox(
  'Lab Exterior Floor Cover Before Door',
  0.9,
  0.05,
  8.75,
  -10.15,
  0.025,
  -2.275,
  floorMaterial
);

createBox(
  'Lab Exterior Floor Cover After Door',
  0.9,
  0.05,
  6.45,
  -10.15,
  0.025,
  7.2,
  floorMaterial
);

createBox(
  'Exterior Corner Floor Cover',
  2.7,
  0.06,
  10,
  -11.2,
  0.03,
  5.5,
  floorMaterial
);

createBox(
  'Exterior Corner Safety Wall',
  0.36,
  3.25,
  10,
  -12.42,
  1.625,
  5.5,
  wallMaterial
);

createBox(
  'Exterior Corner End Wall',
  5.25,
  3.25,
  0.36,
  -11.4,
  1.625,
  10.1,
  wallMaterial
);

createBox(
  'Exterior Corner Continuous Wall Cap',
  5.45,
  3.25,
  0.3,
  -11.5,
  1.625,
  9.82,
  wallMaterial
);

createBox(
  'Exterior Corner Return Wall',
  0.36,
  3.25,
  1.9,
  -9.82,
  1.625,
  9.25,
  wallMaterial
);

createBox(
  'Exterior Corner Floor Skirt',
  5.25,
  0.24,
  0.24,
  -11.4,
  0.12,
  9.9,
  wallMaterial
);

createAirCond(
  'Corridor Wall Air Conditioner',
  -9.78,
  2.38,
  -1.2
);

createBox(
  'Lab Wall Base Seal Before Door',
  0.08,
  0.18,
  8.7,
  -9.74,
  0.09,
  -2.25,
  wallMaterial
);

createBox(
  'Lab Wall Base Seal After Door',
  0.08,
  0.18,
  5.15,
  -9.74,
  0.09,
  6.7,
  wallMaterial
);

createNoticeBoard(
  'Lab Entrance Door Notices',
  -9.78,
  1.65,
  1.4,
  0.85,
  0.6,
  0xf8fafc
);

loadSceneModel({
  url: '/models/shoe_rack.glb',
  name:
    'Downloaded Lab Entrance Shoe Rack',
  position: [-9.32, 0.04, 0.55],
  rotation: [0, Math.PI / 2, 0],
  scale: 2.04
});

loadSceneModel({
  url: '/models/kenney/bench.glb',
  name: 'Lab Entrance Corridor Bench',
  position: [-9.32, 0.02, -1],
  rotation: [0, Math.PI / 2, 0],
  scale: 2.65
});

createFireExtinguisher(
  -9.32,
  0,
  2.18
);

for (let z = 8; z >= -5; z -= 4) {
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
  15.4,
  -17.25,
  -0.1,
  2.7,
  carpetMaterial
);

createBox(
  'Computer Lab Back Teaching Wall',
  14.8,
  3,
  0.2,
  -17.3,
  1.5,
  -5,
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
  15.4,
  -24.65,
  1.5,
  2.7,
  wallMaterial
);

createBox(
  'Computer Lab Ceiling',
  14.8,
  0.2,
  15.4,
  -17.3,
  3.1,
  2.7,
  ceilingMaterial
);

createBox(
  'Lab Center Walkway Carpet',
  1.8,
  0.02,
  12.5,
  -17.7,
  0.02,
  3.15,
  new THREE.MeshStandardMaterial({
    color: 0x1f6f93,
    roughness: 0.5
  })
);

createBox(
  'Lab Entrance Clear Zone Floor',
  3.25,
  0.025,
  3,
  -12.05,
  0.03,
  3.25,
  new THREE.MeshStandardMaterial({
    color: 0x1f6f93,
    roughness: 0.52
  })
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
  1.2,
  4.05
);

scene.add(labDoorPivot);

const labDoor = createBox(
  'Openable Computer Lab Door',
  0.15,
  2.4,
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
  0.58,
  1,
  0.09,
  0.28,
  -0.825,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  }),
  labDoorPivot
);

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

const labDoorHandle = createBox(
  'Lab Door Handle',
  0.22,
  0.08,
  0.08,
  0.12,
  -0.1,
  -1.32,
  railingMaterial,
  labDoorPivot
);

labDoorHandle.userData =
  labDoor.userData;

createTextPanel(
  'LAB',
  1.2,
  0.32,
  -9.78,
  2.58,
  3.2,
  '#f5d76e',
  '#3a1f12'
);

const exitDoor = createBox(
  'Clickable Computer Lab Exit Door',
  1.6,
  2.45,
  0.15,
  -16.05,
  1.22,
  10.28,
  doorMaterial
);

exitDoor.userData = {
  isExitDoor: true,
  title: 'Exit Door',
  text:
    'Click this exit door to end the current walkthrough and return to the lift starting screen.'
};

createBox(
  'Exit Door Raised Top Panel',
  1,
  0.56,
  0.04,
  -16.05,
  1.5,
  10.18,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  })
);

createBox(
  'Exit Door Raised Bottom Panel',
  1,
  0.62,
  0.04,
  -16.05,
  0.6,
  10.18,
  new THREE.MeshStandardMaterial({
    color: 0x4b2a17,
    roughness: 0.36
  })
);

const exitDoorHandle = createBox(
  'Exit Door Handle',
  0.08,
  0.08,
  0.25,
  -15.55,
  1.1,
  10.16,
  railingMaterial
);

exitDoorHandle.userData =
  exitDoor.userData;

createTextPanel(
  'KELUAR',
  1.35,
  0.34,
  -16.05,
  2.62,
  10.16,
  '#007a3d',
  '#ffffff'
);

createFireExtinguisher(
  -24,
  0,
  9.45
);

createNoticeBoard(
  'Exit Safety Notice',
  -18,
  1.45,
  10.16,
  0.9,
  0.58,
  0xf8fafc
);

createAirCond(
  'Lab Rear Air Conditioner',
  -19.1,
  2.45,
  -4.86
);

createAirCond(
  'Lab Side Air Conditioner',
  -12.8,
  2.45,
  -4.86
);

createBox(
  'Front Whiteboard',
  4.2,
  1.15,
  0.06,
  -16.1,
  1.65,
  -4.86,
  whitePlasticMaterial
);

createBox(
  'Projector',
  0.45,
  0.18,
  0.3,
  -16.1,
  2.75,
  0.7,
  whitePlasticMaterial
);

createBox(
  'Teacher Table',
  2.1,
  0.18,
  0.85,
  -13.35,
  0.78,
  -3.65,
  deskMaterial
);

loadSceneModel({
  url: labMonitorModelUrl,
  name:
    'Downloaded Teacher Workstation Monitor',
  position: [-13.35, 0.96, -3.88],
  rotation: [0, -Math.PI / 2, 0],
  scale: 0.0011
});

createBox(
  'Teacher Keyboard',
  0.72,
  0.035,
  0.22,
  -13.35,
  0.88,
  -3.42,
  darkMetalMaterial
);

loadSceneModel({
  url: officeChairModelUrl,
  name:
    'Downloaded Teacher Office Chair',
  position: [-13.35, 0.04, -2.75],
  rotation: [0, Math.PI, 0],
  scale: 0.92
});

const pairedDeskColumns = [
  -22.8,
  -21.35,
  -18.15,
  -16.7
];

const pairedDeskRows = [
  -1.15,
  0.65,
  5.2,
  7
];

for (const z of pairedDeskRows) {
  for (const x of pairedDeskColumns) {
    createComputerStation(x, z);
  }
}

createCeilingGrid(
  14.8,
  15.4,
  -17.3,
  2.7,
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

for (let z = -5; z <= 9; z += 4) {
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
    let z = -2.2;
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

createBox(
  'Distant Building View',
  5,
  2,
  0.2,
  -4,
  1,
  7.6,
  new THREE.MeshStandardMaterial({
    color: 0xc49a6c
  })
);

createBox(
  'Outdoor Tree Area',
  4,
  1,
  0.2,
  -7.8,
  0.5,
  -8.5,
  new THREE.MeshStandardMaterial({
    color: 0x228b22
  })
);

let labDoorOpen = false;
let labDoorProgress = 0;

function openLabDoor() {
  labDoorOpen = true;

  openLabDoorBtn.disabled = true;
  openLabDoorBtn.textContent =
    'Lab Door Open';
}

function resetLabDoor() {
  labDoorOpen = false;
  labDoorProgress = 0;

  labDoorPivot.rotation.y = 0;

  openLabDoorBtn.disabled = false;
  openLabDoorBtn.textContent =
    'Open Lab Door';
}

// ===============================
// HOTSPOTS
// ===============================

const hotspots = [];

function createHotspot(
  title,
  text,
  x,
  y,
  z,
  radius = 0.38
) {
  const group = new THREE.Group();

  const sphereGeometry =
    new THREE.SphereGeometry(
      radius,
      32,
      32
    );

  const sphere = new THREE.Mesh(
    sphereGeometry,
    hotspotMaterial
  );

  sphere.name = title;

  sphere.userData = {
    title,
    text,
    isHotspot: true
  };

  const ringGeometry =
    new THREE.TorusGeometry(
      radius * 1.55,
      radius * 0.11,
      16,
      100
    );

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
    'The expanded computer lab interior contains paired computer desks, clear walking aisles between desk groups, realistic monitor models, chairs, ceiling lights, storage, and learning facilities for students.',
    -16.1,
    2,
    3.2
  )
);

hotspotGroups.push(
  createHotspot(
    'Computer Lab Exit Door',
    'Click the exit door to end the walkthrough and return to the lift starting screen.',
    -16.05,
    2,
    9.55
  )
);

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

window.addEventListener(
  'mousemove',
  (event) => {
    if (!tourStarted) {
      return;
    }

    if (
      event.target.closest?.(
        '#ui-panel, #info-panel, #welcome-screen'
      )
    ) {
      return;
    }

    cameraRotation.yaw -=
      event.movementX *
      mouseLookSensitivity;

    cameraRotation.pitch =
      THREE.MathUtils.clamp(
        cameraRotation.pitch -
          event.movementY *
            mouseLookSensitivity,
        minPitch,
        maxPitch
      );

    applyCameraRotation();
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

    raycaster.setFromCamera(
      mouse,
      camera
    );

    const intersects =
      raycaster.intersectObjects([
        ...hotspots,
        liftButton,
        labDoor,
        labDoorHandle,
        exitDoor,
        exitDoorHandle
      ]);

    if (intersects.length === 0) {
      return;
    }

    const clickedObject =
      intersects[0].object;

    if (
      clickedObject.userData
        .isLiftButton
    ) {
      openLiftDoors();
    }

    if (
      clickedObject.userData
        .isLabDoor
    ) {
      openLabDoor();
    }

    if (
      clickedObject.userData
        .isExitDoor
    ) {
      returnToLiftStart();
      return;
    }

    infoTitle.textContent =
      clickedObject.userData.title;

    infoText.textContent =
      clickedObject.userData.text;

    infoPanel.style.display =
      'block';
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

const openLiftBtn =
  document.querySelector(
    '#open-lift-btn'
  );

const openLabDoorBtn =
  document.querySelector(
    '#open-lab-door-btn'
  );

const resetCameraBtn =
  document.querySelector(
    '#reset-camera-btn'
  );

const toggleLightBtn =
  document.querySelector(
    '#toggle-light-btn'
  );

function returnToLiftStart() {
  moveKeys.forward = false;
  moveKeys.backward = false;
  moveKeys.left = false;
  moveKeys.right = false;

  tourStarted = false;

  resetLiftDoors();
  resetLabDoor();
  resetCameraZoom();

  setCameraView(
    liftCameraPosition,
    liftCameraTarget
  );

  infoPanel.style.display = 'none';
  welcomeScreen.style.display =
    'flex';
}

startBtn.addEventListener(
  'click',
  () => {
    welcomeScreen.style.display =
      'none';

    tourStarted = true;

    resetCameraZoom();

    setCameraView(
      liftCameraPosition,
      liftCameraTarget
    );
  }
);

closeInfoBtn.addEventListener(
  'click',
  () => {
    infoPanel.style.display =
      'none';
  }
);

openLiftBtn.addEventListener(
  'click',
  () => {
    openLiftDoors();
  }
);

openLabDoorBtn.addEventListener(
  'click',
  () => {
    openLabDoor();
  }
);

resetCameraBtn.addEventListener(
  'click',
  () => {
    resetLiftDoors();
    resetLabDoor();
    resetCameraZoom();

    setCameraView(
      liftCameraPosition,
      liftCameraTarget
    );
  }
);

toggleLightBtn.addEventListener(
  'click',
  () => {
    lightsOn = !lightsOn;

    if (lightsOn) {
      ambientLight.intensity = 0.8;
      sunLight.intensity = 1.2;
      liftLight.intensity = 1.5;

      scene.background =
        new THREE.Color(
          0xbfdfff
        );
    } else {
      ambientLight.intensity = 0.25;
      sunLight.intensity = 0.15;
      liftLight.intensity = 0.55;

      scene.background =
        new THREE.Color(
          0x111827
        );
    }
  }
);

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

  updatePlayerMovement(delta);

  const targetProgress =
    liftDoorOpen ? 1 : 0;

  liftDoorProgress =
    THREE.MathUtils.damp(
      liftDoorProgress,
      targetProgress,
      4.2,
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

  const labDoorTarget =
    labDoorOpen
      ? -Math.PI / 2.15
      : 0;

  labDoorProgress =
    THREE.MathUtils.damp(
      labDoorProgress,
      labDoorOpen ? 1 : 0,
      4.2,
      delta
    );

  labDoorPivot.rotation.y =
    THREE.MathUtils.lerp(
      0,
      labDoorTarget,
      labDoorProgress
    );

  hotspotGroups.forEach(
    (group, index) => {
      group.position.y =
        group.userData.baseY +
        Math.sin(
          Date.now() * 0.003 +
            index
        ) *
          0.12;

      group.rotation.y += 0.015;
    }
  );

  renderer.render(
    scene,
    camera
  );
}

animate();
