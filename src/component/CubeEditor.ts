import * as THREE from "three";

import SceneRenderer from "./SceneRenderer";
import {
  disposeMesh,
  getCenterVector,
  getHoverMesh,
  getPlaneIntersectPos,
} from "../utils/three";
import { defaultVertextPositions } from "../constants/sceneParams";
import { ANG2RAD } from "../utils/math";
import Vertex from "./Vertex";

export interface CubeEditorConfigParams {
  deepth: number;
  enableVirtualVertex: boolean;
}

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
  _enableVirtualVertext: boolean;

  constructor(canvasDiv: HTMLDivElement, editorParams: CubeEditorConfigParams) {
    this._sceneRenderer = new SceneRenderer(canvasDiv);
    this._raycaster = new THREE.Raycaster();
    this._virtualPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
    this._deepth = editorParams.deepth;
    this._vertexArray = this.getInitVertexArray();
    this._hoverObject = null;
    this._selectObject = null;
    this._enableVirtualVertext = editorParams.enableVirtualVertex;

    this.initScene();
    this.addEventListener();
  }

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

  // VertexGroup Part Start

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

      if (vertex._isCurve || mainArray[secondPosIndex]._isCurve) return;

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
      if (
        vertex._type === "main" ||
        (vertex._type === "virtual" && this._enableVirtualVertext === true)
      )
        group.add(vertex._mesh);
    });
    this._vertexGroup = group;
  }

  resetVertexGroup() {
    disposeMesh(this._vertexGroup);
    this._sceneRenderer._scene.remove(this._vertexGroup);
    this.setVertexGroup();
    this._sceneRenderer._scene.add(this._vertexGroup);
  }

  // VertexGroup Part End

  // ExtrudeMesh Part Start

  setExtrudeMesh() {
    const shape = new THREE.Shape();

    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );
    const lastVertex = mainArray[mainArray.length - 1];
    shape.moveTo(lastVertex._position.x, lastVertex._position.z);

    mainArray.forEach((vertex: Vertex, index: number) => {
      const beforeNodeIndex = index === 0 ? mainArray.length - 1 : index - 1;
      if (mainArray[beforeNodeIndex]._isCurve) return;

      const nextNodeIndex = index === mainArray.length - 1 ? 0 : index + 1;
      if (vertex._isCurve) {
        shape.splineThru([
          new THREE.Vector2(
            mainArray[beforeNodeIndex]._position.x,
            mainArray[beforeNodeIndex]._position.z
          ),
          new THREE.Vector2(vertex._position.x, vertex._position.z),
          new THREE.Vector2(
            mainArray[nextNodeIndex]._position.x,
            mainArray[nextNodeIndex]._position.z
          ),
        ]);
        return;
      }

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

  resetExtrudeMesh() {
    disposeMesh(this._extrudeMesh);
    this._sceneRenderer._scene.remove(this._extrudeMesh);
    this.setExtrudeMesh();
    this._sceneRenderer._scene.add(this._extrudeMesh);
  }

  // ExtrudeMesh Part End

  initScene() {
    this.setVertexGroup();
    this.setExtrudeMesh();

    this._sceneRenderer._scene.add(this._vertexGroup);
    this._sceneRenderer._scene.add(this._extrudeMesh);
  }

  //Functions

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
        this._hoverObject.material.opacity = 0.6;
        this._hoverObject = null;
        document.body.style.cursor = "";
      }
    } else {
      if (hoverMesh) {
        hoverMesh.material.opacity = 1;
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
        // hoverVertex._type = "main";
        // hoverVertex.initMesh()

        this.resetVirtualVertexPos();

        this.resetVertexGroup();
      }

      this._selectObject = hoverMesh;
      this._sceneRenderer._camControls.enabled = false;
    }
  }

  // change to curve vertex
  dblClickEventHandler(ev: MouseEvent) {
    if (this._hoverObject) {
      const clickVertex = this.getVertexByUuid(this._hoverObject);
      if (clickVertex._type === "main") {
        console.log("dblclick");
        // clickVertex._isCurve = !clickVertex._isCurve;
        clickVertex.changeCurveProperty(!clickVertex._isCurve);

        this.resetVirtualVertexPos();
        this.resetVertexGroup();
        this.resetExtrudeMesh();
      }
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

    document.addEventListener("dblclick", this.dblClickEventHandler.bind(this));
  }
  dispose() {
    document.removeEventListener(
      "pointerup",
      this.moveUpEventHandler.bind(this)
    );

    document.removeEventListener(
      "pointermove",
      this.mouseMoveEventListner.bind(this)
    );

    document.removeEventListener(
      "pointerdown",
      this.mouseDownEventListner.bind(this)
    );
  }
}

export default CubeEditor;
