import * as THREE from 'three';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill'
]);

const corridorWallFaceX = -9.81;
const labWallFaceX = -10.03;

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Lower Jamb', { size: [0.035, 2.45, 0.32], face: 'corridor' }],
  ['Lab Door Upper Jamb', { size: [0.035, 2.45, 0.24], face: 'corridor' }],
  ['Lab Door Top Lintel', { size: [0.035, 0.72, 2.05], face: 'corridor' }],
  ['Exit Door Lower Jamb', { size: [0.035, 2.45, 0.32], face: 'lab' }],
  ['Exit Door Upper Jamb', { size: [0.035, 2.45, 0.24], face: 'lab' }],
  ['Exit Door Top Lintel', { size: [0.035, 0.72, 2.0], face: 'lab' }]
]);

const addedInteriorHeaderFills = new Set();

function getFlushX(size, face) {
  if (face === 'lab') {
    return labWallFaceX + size[0] / 2;
  }

  return corridorWallFaceX - size[0] / 2;
}

function createExitDoorInteriorHeaderFill(object) {
  if (object?.name !== 'Exit Door Top Lintel' || addedInteriorHeaderFills.has(object.name)) {
    return null;
  }

  addedInteriorHeaderFills.add(object.name);

  const fillMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.82, 2.18),
    object.material
  );

  fillMesh.name = 'Exit Door Interior Header Flat Fill';
  fillMesh.position.set(labWallFaceX + 0.035 / 2, 2.74, -6.2);

  return fillMesh;
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
    }

    if (extraObjects.length > 0) {
      originalAdd.call(this, ...extraObjects);
    }

    return this;
  };
}
