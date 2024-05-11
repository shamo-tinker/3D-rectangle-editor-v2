import * as THREE from "three";

import SceneRenderer from "./SceneRenderer";
import {
  getCenterVector,
  getHoverMesh,
  getPlaneIntersectPos,
} from "../utils/three";
import { defaultVertextPositions } from "../constants/sceneParams";
import { initDeepth } from "../constants";
import { ANG2RAD } from "../utils/math";
import Vertex from "./Vertex";

class CubeEditor {
  _sceneRenderer: SceneRenderer;
  _virtualPlane: THREE.Plane;
  _raycaster: THREE.Raycaster;
  _vertexArray: any;
  _deepth: number;
  _vertexGroup: any;
  _extrudeMesh: any;
  _hoverObject: any;
  _selectObject: any;

  constructor(canvasDiv: HTMLDivElement) {
    this._sceneRenderer = new SceneRenderer(canvasDiv);
    this._raycaster = new THREE.Raycaster();
    this._virtualPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
    this._deepth = initDeepth;
    this._vertexArray = this.getInitVertexArray();
    this._hoverObject = null;
    this._selectObject = null;

    this.initScene();
    this.addEventListener();
  }

  //Scene Settings

  getInitVertexArray() {
    const vArray: Vertex[] = [];

    defaultVertextPositions.forEach(
      (position: THREE.Vector3, index: number) => {
        vArray.push(new Vertex(new THREE.Vector3().copy(position), "main"));

        vArray.push(
          new Vertex(
            getCenterVector(
              position,
              defaultVertextPositions[
                (index + 1) % defaultVertextPositions.length
              ]
            ),
            "virtual"
          )
        );
      }
    );
    return vArray;
  }

  setVirtualVertexPos() {
    this._vertexArray.forEach((vertex: Vertex, index: number) => {
      if (vertex._type === "virtual") {
        const firstPos = this._vertexArray[index - 1]._position;
        const secondPosIndex =
          index === this._vertexArray.length - 1 ? 0 : index + 1;
        const secondPos = this._vertexArray[secondPosIndex]._position;
        const centerPos = getCenterVector(firstPos, secondPos);
        vertex.setPosition(centerPos);
      }
    });
  }

  resetVirtualVertexPos() {
    const vArray: Vertex[] = [];
    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );

    mainArray.forEach((vertex: Vertex, index: number) => {
      vArray.push(vertex);
      const secondPosIndex = index === mainArray.length - 1 ? 0 : index + 1;
      const virtexPos = getCenterVector(
        vertex._position,
        mainArray[secondPosIndex]._position
      );
      vArray.push(new Vertex(virtexPos, "virtual"));
    });
    this._vertexArray = vArray;
  }

  setVertexGroup() {
    const group = new THREE.Group();
    this._vertexArray.forEach((vertex: Vertex) => {
      group.add(vertex._mesh);
    });
    this._vertexGroup = group;
  }

  setExtrudeMesh() {
    const shape = new THREE.Shape();

    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );

    const lastVertex = mainArray[mainArray.length - 1];
    shape.moveTo(lastVertex._position.x, lastVertex._position.z);
    mainArray.forEach((vertex: Vertex) => {
      shape.lineTo(vertex._position.x, vertex._position.z);
    });
    const extrudeSettings = { depth: this._deepth, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: 0x909090,
      side: 2,
    });
    this._extrudeMesh = new THREE.Mesh(geometry, material);
    this._extrudeMesh.rotation.x = ANG2RAD(90);
  }

  initScene() {
    this.setVertexGroup();
    this.setExtrudeMesh();

    this._sceneRenderer._scene.add(this._vertexGroup);
    this._sceneRenderer._scene.add(this._extrudeMesh);
  }

  //Functions
  resetExtrudeMesh() {
    this._sceneRenderer._scene.remove(this._extrudeMesh);
    this.setExtrudeMesh();
    this._sceneRenderer._scene.add(this._extrudeMesh);
  }

  setDeepth(deepth: number) {
    this._deepth = deepth;
    this.resetExtrudeMesh();
  }

  getVertexByUuid(hoveredMesh: any) {
    return this._vertexArray.find(
      (vertex: Vertex) => vertex._mesh.uuid === hoveredMesh.uuid
    );
  }

  //EventHandler
  moveUpEventHandler() {
    if (this._selectObject) {
      this._selectObject = null;
      this._sceneRenderer._camControls.enabled = true;
    }
  }

  mouseMoveEventListner(ev: PointerEvent) {
    const hoverMesh: any = getHoverMesh(
      this._raycaster,
      ev,
      this._vertexGroup.children,
      this._sceneRenderer._camera
    );

    if (this._hoverObject) {
      if (!hoverMesh) {
        this._hoverObject.material.opacity = 1;
        this._hoverObject = null;
        document.body.style.cursor = "";
      }
    } else {
      if (hoverMesh) {
        hoverMesh.material.opacity = 0.5;
        this._hoverObject = hoverMesh;
        document.body.style.cursor = "pointer";
      }
    }

    if (this._selectObject) {
      const planeIntersectPos = getPlaneIntersectPos(
        this._raycaster,
        ev,
        this._virtualPlane,
        this._sceneRenderer._camera
      );

      const vertexObject: any = this.getVertexByUuid(this._selectObject);

      vertexObject.setPosition(planeIntersectPos);
      this.setVirtualVertexPos();
      this.resetExtrudeMesh();
    }
  }

  mouseDownEventListner(ev: PointerEvent) {
    const hoverMesh: any = getHoverMesh(
      this._raycaster,
      ev,
      this._vertexGroup.children,
      this._sceneRenderer._camera
    );

    if (hoverMesh && !this._selectObject) {
      const hoverVertex = this.getVertexByUuid(hoverMesh);

      if (hoverVertex._type === "virtual") {
        hoverVertex.changeToMain();
        this.resetVirtualVertexPos();
        this._sceneRenderer._scene.remove(this._vertexGroup);
        this.setVertexGroup();
        this._sceneRenderer._scene.add(this._vertexGroup);
      }

      this._selectObject = hoverMesh;
      this._sceneRenderer._camControls.enabled = false;
    }
  }

  addEventListener() {
    document.addEventListener("pointerup", this.moveUpEventHandler.bind(this));

    document.addEventListener(
      "pointermove",
      this.mouseMoveEventListner.bind(this)
    );

    document.addEventListener(
      "pointerdown",
      this.mouseDownEventListner.bind(this)
    );
  }

  dispose() {}
}

export default CubeEditor;
