import * as THREE from 'three';

const hiddenSceneObjectNames = new Set([
  'Lab Door Exterior Header Fill'
]);

const flattenedDoorFrameGeometry = new Map([
  ['Lab Door Lower Jamb', [0.22, 2.45, 0.18]],
  ['Lab Door Upper Jamb', [0.22, 2.45, 0.18]],
  ['Lab Door Top Lintel', [0.22, 0.72, 2.05]]
]);

let labDoorFlatFacadeAdded = false;

function flattenDoorFrameObject(object) {
  const geometrySize = flattenedDoorFrameGeometry.get(object?.name);

  if (!object?.isMesh || !geometrySize) {
    return;
  }

  object.geometry = new THREE.BoxGeometry(...geometrySize);
}

function createLabDoorFlatFacade(material) {
  const facade = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 2.72, 6.34),
    material
  );

  facade.name = 'Lab Door Exterior Flat Wall Facade';
  facade.position.set(-9.775, 1.58, 7.22);

  return facade;
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
    let facadeObject = null;

    objects.forEach((object) => {
      if (hiddenSceneObjectNames.has(object?.name)) {
        return;
      }

      flattenDoorFrameObject(object);
      visibleObjects.push(object);

      if (
        object?.name === 'Lab Wall After Entry Door' &&
        object.material &&
        !labDoorFlatFacadeAdded
      ) {
        labDoorFlatFacadeAdded = true;
        facadeObject = createLabDoorFlatFacade(object.material);
      }
    });

    if (visibleObjects.length > 0) {
      originalAdd.call(this, ...visibleObjects);
    }

    if (facadeObject) {
      originalAdd.call(this, facadeObject);
    }

    return this;
  };
}
