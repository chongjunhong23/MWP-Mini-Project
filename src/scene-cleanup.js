import * as THREE from 'three';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill'
]);

if (!THREE.Object3D.prototype.__fcN28SceneCleanupPatched) {
  const originalAdd = THREE.Object3D.prototype.add;

  Object.defineProperty(
    THREE.Object3D.prototype,
    '__fcN28SceneCleanupPatched',
    {
      value: true
    }
  );

  THREE.Object3D.prototype.add = function addWithoutHiddenSceneObjects(...objects) {
    const visibleObjects = objects.filter((object) =>
      !hiddenSceneObjectNames.has(object?.name)
    );

    if (visibleObjects.length === 0) {
      return this;
    }

    return originalAdd.call(this, ...visibleObjects);
  };
}
