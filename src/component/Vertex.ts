import * as THREE from "three";

// interface VertexDataType {
//   position: THREE.Vector3;
//   type: "main" | "virtual";
// }

class Vertex {
  _type: string;
  _position: THREE.Vector3;
  _mesh: any;
  // _status: number;

  constructor(position: THREE.Vector3, type: "main" | "virtual") {
    this._position = position;
    this._type = type;

    this.initMesh();
  }

  changeToMain() {
    this._type = "main";
    this._mesh.scale.set(1.5, 1.5, 1.5);
    this._mesh.material.color.setHex(0x0000ff);
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
    });
    this._mesh = new THREE.Mesh(geometry, material);
    if (this._type === "main") this._mesh.scale.set(1.5, 1.5, 1.5);

    this._mesh.position.copy(this._position);
  }
}

export default Vertex;
