import * as THREE from "three";

// interface VertexDataType {
//   position: THREE.Vector3;
//   type: "main" | "virtual";
// }

class Vertex {
  _type: string;
  _position: THREE.Vector3;
  _mesh: any;
  _isCurve: boolean;
  _curvePoints: any;

  constructor(position: THREE.Vector3, type: "main" | "virtual") {
    this._position = position;
    this._type = type;
    this._isCurve = false;

    this.initMesh();
  }

  changeToMain() {
    this._type = "main";
    this._mesh.scale.set(1.5, 1.5, 1.5);
    this._mesh.material.color.setHex(0x0000ff);
  }

  changeCurveProperty(isCurve: boolean) {
    this._isCurve = isCurve;
    this._mesh.material.color.setHex(this._isCurve ? 0xff0000 : 0x0000ff);
  }

  changeCurvePos(mesh: THREE.Mesh, newPos: THREE.Vector3) {
    const index = this.findIndexOfCurvePoint(mesh.position);

    this._curvePoints[index].copy(newPos);
  }

  findIndexOfCurvePoint(position: THREE.Vector3) {
    if (!this._isCurve) return;
    const index = this._curvePoints.findIndex(
      (curvePosition: THREE.Vector3) => curvePosition.distanceTo(position) === 0
    );

    return index;
  }

  setPosition(newPos: THREE.Vector3) {
    this._position.copy(newPos);
    this._mesh.position.copy(newPos);
  }

  initMesh() {
    const geometry = new THREE.SphereGeometry(0.4);
    const material = new THREE.MeshStandardMaterial({
      color: this._type === "main" ? 0x0000ff : 0x00ff00,
      transparent: true,
      opacity: 0.6,
    });

    this._mesh = new THREE.Mesh(geometry, material);
    if (this._type === "main") this._mesh.scale.set(1.5, 1.5, 1.5);

    this._mesh.position.copy(this._position);
  }
}

export default Vertex;
