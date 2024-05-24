import * as THREE from "three";
import { disposeMesh } from "../utils/three";

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
  _curveVertexMeshs: any;
  _part: string;

  constructor(
    position: THREE.Vector3,
    type: "main" | "virtual",
    part: string = "none"
  ) {
    this._position = position;
    this._type = type;
    this._isCurve = false;
    this._part = part;
    this.initMesh();
    this.initCurveMesh();
  }

  changeToMain() {
    this._type = "main";
    this._mesh.scale.set(1.5, 1.5, 1.5);
    this._mesh.material.color.setHex(0x0000ff);

    // if(this._part === "left" || this._part === "center_4"){

    // }
    // vertex._part === "left" || vertex._part === "center_4"
    //   ? "left"
    //   : vertex._part === "right" ||
    //     (vertex._part === "center_2" && "right")
  }

  changeFromCurve() {
    this._isCurve = false;
    this._curvePoints = null;
    disposeMesh(this._curveVertexMeshs[0]);
    disposeMesh(this._curveVertexMeshs[1]);
    this._curveVertexMeshs = null;
  }

  changeToCurve(pos1: THREE.Vector3, pos2: THREE.Vector3) {
    this._isCurve = true;
    this._curvePoints = [pos1, pos2];
    this.initCurveMesh();
  }

  changeCurvePos(mesh: THREE.Mesh, newPos: THREE.Vector3) {
    const index = this._curveVertexMeshs.findIndex(
      (vertexMesh: THREE.Mesh) => vertexMesh === mesh
    );

    this._curvePoints[index].copy(newPos);
    this._curveVertexMeshs[index].position.copy(newPos);

    // const index = this.findIndexOfCurvePoint(mesh.position);
    // this._curvePoints[index].copy(newPos);
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
  setPositionX(newX: number) {
    this._position.x = newX;
    this._mesh.position.x = newX;
  }

  setOffsetX(offsetX: number) {
    this._position.x += offsetX;
    this._mesh.position.x += offsetX;

    if (this._isCurve) {
      this._curvePoints[0].x += offsetX;
      this._curveVertexMeshs[0].position.x += offsetX;
      this._curvePoints[1].x += offsetX;
      this._curveVertexMeshs[1].position.x += offsetX;
    }
  }

  setOffsetZ(offsetZ: number) {
    this._position.z += offsetZ;
    this._mesh.position.z += offsetZ;

    if (this._isCurve) {
      this._curvePoints[0].z += offsetZ;
      this._curveVertexMeshs[0].position.z += offsetZ;
      this._curvePoints[1].z += offsetZ;
      this._curveVertexMeshs[1].position.z += offsetZ;
    }
  }

  setCurveVertexPositions(pos1: THREE.Vector3, pos2: THREE.Vector3) {
    this._curveVertexMeshs[0].position.copy(pos1);
    this._curveVertexMeshs[1].position.copy(pos2);
  }
  isCenter() {
    return this._part.split("_")[0] === "center";
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

  initCurveMesh() {
    if (!this._isCurve) return;
    const geo = new THREE.SphereGeometry(0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6,
    });

    const mesh = new THREE.Mesh(geo, mat);

    const mesh1 = mesh;
    mesh1.name = this._mesh.uuid;
    mesh1.position.copy(this._curvePoints[0]);

    const mesh2 = mesh.clone();
    mesh2.material = mat.clone();
    mesh2.name = this._mesh.uuid;
    mesh2.position.copy(this._curvePoints[1]);

    this._curveVertexMeshs = [mesh1, mesh2];
  }
}

export default Vertex;
