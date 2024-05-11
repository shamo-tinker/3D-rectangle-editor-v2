import * as THREE from "three";

export const cleanMaterial = (material: any) => {
  material.dispose();

  // dispose textures
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
};

export const disposeMesh = (mesh: any) => {
  mesh.traverse((object: any) => {
    if (!object.isMesh) return;

    object.geometry.dispose();

    if (object.material.isMaterial) {
      cleanMaterial(object.material);
    } else {
      for (const material of object.material) cleanMaterial(material);
    }
  });
};

export const convertUV = (x: number, y: number) => {
  const pointer = new THREE.Vector2();
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
  return pointer;
};

export const getPlaneIntersectPos = (
  raycaster: THREE.Raycaster,
  ev: PointerEvent,
  plane: THREE.Plane,
  camera: THREE.Camera
) => {
  raycaster.setFromCamera(convertUV(ev.clientX, ev.clientY), camera);

  const planeIntersect = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, planeIntersect);

  return planeIntersect;
};

export const getHoverMesh = (
  raycaster: THREE.Raycaster,
  ev: PointerEvent,
  group: any,
  camera: THREE.Camera
) => {
  raycaster.setFromCamera(convertUV(ev.clientX, ev.clientY), camera);

  const intersects = raycaster.intersectObjects(group);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    return object;
  }
  return null;
};

export const getCenterVector = (
  vector1: THREE.Vector3,
  vector2: THREE.Vector3
) => {
  const newVector = new THREE.Vector3();
  newVector.addVectors(vector1, vector2).divideScalar(2);
  return newVector;
};
