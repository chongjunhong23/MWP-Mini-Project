import * as THREE from 'three';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill',
  'Lab Door Lower Jamb',
  'Lab Door Upper Jamb'
]);

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Top Lintel', [0.22, 0.72, 2.05]]
]);

function flattenDoorFrameObject(object) {
  const geometrySize = flattenedDoorFrameGeometry.get(object?.name);

  if (!object?.isMesh || !geometrySize) {
    return;
  }

  object.geometry = new THREE.BoxGeometry(...geometrySize);
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
