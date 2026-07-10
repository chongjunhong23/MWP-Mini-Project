import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill'
]);

const corridorWallFaceX = -9.81;
const labWallFaceX = -10.03;
const labWallSkinX = labWallFaceX - 0.012;

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Lower Jamb', { size: [0.035, 2.45, 0.32], face: 'corridor' }],
  ['Lab Door Upper Jamb', { size: [0.035, 2.45, 0.24], face: 'corridor' }],
  ['Lab Door Top Lintel', { size: [0.035, 0.72, 2.05], face: 'corridor' }],
  ['Exit Door Lower Jamb', { size: [0.035, 2.45, 0.32], face: 'lab' }],
  ['Exit Door Upper Jamb', { size: [0.035, 2.45, 0.24], face: 'lab' }],
  ['Exit Door Top Lintel', { size: [0.035, 0.72, 2.0], face: 'lab' }]
]);

const airConditionerGroupNames = new Set([
  'Lab Rear Air Conditioner',
  'Lab Side Air Conditioner'
]);

const oldAirConditionerPartNames = new Set([
  'Air Conditioner Body',
  'Air Conditioner Vent',
  'Air Conditioner Indicator'
]);

const addedInteriorHeaderFills = new Set();
const airConditionerLoader = new GLTFLoader();
const airConditionerModelPromise = new Promise((resolve, reject) => {
  airConditionerLoader.load(
    '/models/indoor_air_conditioner_unit.glb',
    (gltf) => resolve(gltf.scene),
    undefined,
    reject
  );
});

function getFlushX(size, face) {
  if (face === 'lab') {
    return labWallFaceX + size[0] / 2;
  }

  return corridorWallFaceX - size[0] / 2;
}

function createWallSkin(name, width, height, depth, y, z, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.name = name;
  mesh.position.set(labWallSkinX, y, z);

  return mesh;
}

function createExitDoorInteriorHeaderFill(object) {
  if (object?.name !== 'Exit Door Top Lintel' || addedInteriorHeaderFills.has(object.name)) {
    return null;
  }

  addedInteriorHeaderFills.add(object.name);

  const fillGroup = new THREE.Group();
  fillGroup.name = 'Exit Door Interior Flat Wall Fill';

  fillGroup.add(
    createWallSkin(
      'Exit Door Interior Header Skin',
      0.024,
      0.78,
      3.26,
      2.78,
      -6.2,
      object.material
    )
  );

  fillGroup.add(
    createWallSkin(
      'Exit Door Interior Upper Right Reveal Skin',
      0.024,
      0.42,
      0.22,
      2.22,
      -5.22,
      object.material
    )
  );

  fillGroup.add(
    createWallSkin(
      'Exit Door Interior Upper Left Reveal Skin',
      0.024,
      0.42,
      0.22,
      2.22,
      -7.18,
      object.material
    )
  );

  return fillGroup;
}

function flattenDoorFrameObject(object) {
  const config = flattenedDoorFrameGeometry.get(object?.name);

  if (!object?.isMesh || !config) {
    return null;
  }

  object.geometry = new THREE.BoxGeometry(...config.size);
  object.position.x = getFlushX(config.size, config.face);

  return createExitDoorInteriorHeaderFill(object);
}

function hideOldAirConditionerParts(group) {
  group.traverse((child) => {
    if (oldAirConditionerPartNames.has(child.name)) {
      child.visible = false;
    }
  });
}

function attachAirConditionerModel(group) {
  if (!airConditionerGroupNames.has(group?.name) || group.userData.hasDownloadedAirConditioner) {
    return;
  }

  group.userData.hasDownloadedAirConditioner = true;

  airConditionerModelPromise
    .then((sourceModel) => {
      hideOldAirConditionerParts(group);

      const model = sourceModel.clone(true);
      model.name = `${group.name} GLB Model`;
      model.position.set(0, -0.03, -0.03);
      model.rotation.set(0, 0, 0);
      model.scale.setScalar(0.42);

      model.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
        }
      });

      group.add(model);
    })
    .catch(() => {
      group.userData.hasDownloadedAirConditioner = false;
    });
}

if (!THREE.Object3D.prototype.__fcN28SceneCleanupPatched) {
  const originalAdd = THREE.Object3D.prototype.add;

  Object.defineProperty(
    THREE.Object3D.prototype,
    '__fcN28SceneCleanupPatched',
    {
      value: true
    }
  );

  THREE.Object3D.prototype.add = function addCleanedSceneObjects(...objects) {
    const visibleObjects = [];
    const extraObjects = [];

    objects.forEach((object) => {
      if (hiddenSceneObjectNames.has(object?.name)) {
        return;
      }

      const extraObject = flattenDoorFrameObject(object);
      visibleObjects.push(object);

      if (extraObject) {
        extraObjects.push(extraObject);
      }
    });

    if (visibleObjects.length > 0) {
      originalAdd.call(this, ...visibleObjects);
      visibleObjects.forEach(attachAirConditionerModel);
    }

    if (extraObjects.length > 0) {
      originalAdd.call(this, ...extraObjects);
    }

    return this;
  };
}
