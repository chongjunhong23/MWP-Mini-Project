import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill',
  'Right Turn Corridor End Floor Seal'
]);

const corridorWallFaceX = -9.81;
const labWallFaceX = -10.03;
const labWallSkinX = labWallFaceX - 0.006;
const keluarSignWallX = labWallFaceX - 0.045;

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Lower Jamb', { size: [0.22, 2.45, 0.18], x: -9.92 }],
  ['Lab Door Upper Jamb', { size: [0.22, 2.45, 0.18], x: -9.92 }],
  ['Lab Door Top Lintel', { size: [0.22, 0.72, 2.05], x: -9.92 }],
  ['Exit Door Lower Jamb', { size: [0.22, 2.45, 0.18], x: -9.92 }],
  ['Exit Door Upper Jamb', { size: [0.22, 2.45, 0.18], x: -9.92 }],
  ['Exit Door Top Lintel', { size: [0.22, 0.72, 1.98], x: -9.92 }]
]);

const doorHeaderSkinPlacements = new Map();

const airConditionerGroupNames = new Set([
  'Lab Rear Air Conditioner',
  'Lab Side Air Conditioner',
  'Lab Opposite Wall Air Conditioner A',
  'Lab Opposite Wall Air Conditioner B'
]);

const oldAirConditionerPartNames = new Set([
  'Air Conditioner Body',
  'Air Conditioner Vent',
  'Air Conditioner Indicator'
]);

const addedDoorHeaderSkins = new Set();
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

function createDoorHeaderSkin(object) {
  const placement = doorHeaderSkinPlacements.get(object?.name);

  if (!placement || addedDoorHeaderSkins.has(object.name)) {
    return null;
  }

  addedDoorHeaderSkins.add(object.name);

  return createWallSkin(
    placement.name,
    0.012,
    0.78,
    placement.depth,
    2.78,
    placement.z,
    object.material
  );
}

function flattenDoorFrameObject(object) {
  const config = flattenedDoorFrameGeometry.get(object?.name);

  if (!object?.isMesh || !config) {
    return null;
  }

  object.geometry = new THREE.BoxGeometry(...config.size);
  object.position.x = config.x ?? getFlushX(config.size, config.face);

  return createDoorHeaderSkin(object);
}

function extendCornerBaseSeal(object) {
  if (!object?.isMesh || object.name !== 'Lab Wall Base Seal After Entry') {
    return;
  }

  object.geometry = new THREE.BoxGeometry(0.08, 0.18, 8.14);
  object.position.z = 8.185;
}

function adjustKeluarSign(object) {
  if (!object?.isMesh || object.geometry?.type !== 'PlaneGeometry') {
    return;
  }

  const isWallSign = Math.abs(object.position.x + 10.15) < 0.08;
  const isKeluarHeight = Math.abs(object.position.y - 2.57) < 0.08;
  const isEntrySign = Math.abs(object.position.z - 3.225) < 0.18;
  const isExitSign = Math.abs(object.position.z + 6.175) < 0.18;

  if (isWallSign && isKeluarHeight && (isEntrySign || isExitSign)) {
    object.position.x = keluarSignWallX;
  }
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
      model.updateMatrixWorld(true);

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const targetWidth = 1.5;
      const normalizedModel = new THREE.Group();

      normalizedModel.name = `${group.name} GLB Model`;
      normalizedModel.position.set(0, 0, -0.12);
      normalizedModel.rotation.y = Math.PI;
      normalizedModel.scale.setScalar(targetWidth / size.x);
      model.position.copy(center).multiplyScalar(-1);

      model.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        const preparedMaterials = materials.map((material) => {
          const prepared = material.clone();

          prepared.color?.setHex(0xffffff);
          prepared.emissive?.setHex(0x303030);
          prepared.emissiveIntensity = 0.35;
          prepared.metalness = Math.min(prepared.metalness ?? 0, 0.15);
          prepared.roughness = Math.max(prepared.roughness ?? 0.5, 0.5);
          prepared.side = THREE.DoubleSide;

          if (prepared.map) {
            prepared.map.colorSpace = THREE.SRGBColorSpace;
            prepared.map.needsUpdate = true;
          }

          prepared.normalScale?.set(0.35, 0.35);
          prepared.needsUpdate = true;

          return prepared;
        });

        child.material = Array.isArray(child.material)
          ? preparedMaterials
          : preparedMaterials[0];
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      });

      normalizedModel.add(model);
      group.add(normalizedModel);
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
      extendCornerBaseSeal(object);
      adjustKeluarSign(object);
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
