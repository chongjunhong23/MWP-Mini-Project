import * as THREE from 'three';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill'
]);

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Lower Jamb', [0.035, 2.45, 0.32]],
  ['Lab Door Upper Jamb', [0.035, 2.45, 0.24]],
  ['Lab Door Top Lintel', [0.035, 0.72, 2.05]]
]);

function flattenDoorFrameObject(object) {
  const geometrySize = flattenedDoorFrameGeometry.get(object?.name);

  if (!object?.isMesh || !geometrySize) {
    return;
  }

  object.geometry = new THREE.BoxGeometry(...geometrySize);
  object.position.x = -9.795;
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
    const visibleObjects = objects.filter((object) => {
      if (hiddenSceneObjectNames.has(object?.name)) {
        return false;
      }

      flattenDoorFrameObject(object);
      return true;
    });

    if (visibleObjects.length === 0) {
      return this;
    }

    return originalAdd.call(this, ...visibleObjects);
  };
}
