import * as THREE from "three";

import SceneRenderer from "./SceneRenderer";
import {
  disposeMesh,
  getCenterVector,
  getHoverMesh,
  getInsidePos,
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
  _edgeGroup: any;
  _extrudeMesh: any;
  _curveLineGroup: any;
  _curveVertexGroup: any;
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

    // vArray[2]._isCurve = true;
    // vArray[2]._curvePoints = [
    //   new THREE.Vector3(12, 0, -3),
    //   new THREE.Vector3(12, 0, 3),
    // ];

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

      if (vertex._isCurve) return;

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
      if (
        vertex._type === "main" ||
        (vertex._type === "virtual" && this._enableVirtualVertext === true)
      )
        group.add(vertex._mesh);
      group.name = "main";
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

  ///// EdgeGroup Part Start
  setEdgeGroup() {
    const edgeGroup = new THREE.Group();
    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );
    mainArray.forEach((vertex: Vertex, index: number) => {
      const nextIndex = index === mainArray.length - 1 ? 0 : index + 1;
      const curve = new THREE.CatmullRomCurve3();
      if (vertex._isCurve) {
        const bezierCurve = new THREE.CubicBezierCurve3(
          vertex._position,
          vertex._curvePoints[0],
          vertex._curvePoints[1],
          mainArray[nextIndex]._position
        );
        curve.points = bezierCurve.getPoints(5);
      } else {
        curve.points = [vertex._position, mainArray[nextIndex]._position];
      }
      const geometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: vertex._isCurve ? 0xff0000 : 0x0000ff,
        side: THREE.DoubleSide,
        opacity: 0.6,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = vertex._mesh.uuid;
      edgeGroup.add(mesh);
    });
    this._edgeGroup = edgeGroup;
  }
  resetEdgeGroup() {
    disposeMesh(this._edgeGroup);
    this._sceneRenderer._scene.remove(this._edgeGroup);
    this.setEdgeGroup();
    this._sceneRenderer._scene.add(this._edgeGroup);
  }
  // EdgeGroup Part End

  ///// CurveEditor Start
  setCurveLineGroup() {
    const newGroup = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });

    const curveVertexArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._isCurve
    );

    curveVertexArray.forEach((vertex: Vertex) => {
      const points = [
        vertex._position,
        vertex._curvePoints[0],
        vertex._curvePoints[1],
        this.getNextMainVertex(vertex)._position,
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(geometry, material);
      newGroup.add(line);
    });
    this._curveLineGroup = newGroup;
  }
  resetCurveLineGroup() {
    disposeMesh(this._curveLineGroup);
    this._sceneRenderer._scene.remove(this._curveLineGroup);
    this.setCurveLineGroup();
    this._sceneRenderer._scene.add(this._curveLineGroup);
  }
  //CurveEditor End

  ///// CurveVertex Start
  setCurveVertexGroup() {
    const newGroup = new THREE.Group();

    const curveVertexArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._isCurve
    );

    curveVertexArray.forEach((vertex: Vertex) => {
      newGroup.add(...vertex._curveVertexMeshs);
      this._sceneRenderer._scene.add(newGroup);
      newGroup.name = "curve";
    });
    this._curveVertexGroup = newGroup;
  }

  resetCurveVertexGroup() {
    disposeMesh(this._curveVertexGroup);
    this._sceneRenderer._scene.remove(this._curveVertexGroup);
    this.setCurveVertexGroup();
    this._sceneRenderer._scene.add(this._curveVertexGroup);
  }
  //CurveVertex End

  ///// ExtrudeMesh Part Start
  setExtrudeMesh() {
    const shape = new THREE.Shape();

    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );
    const lastVertex = mainArray[mainArray.length - 1];
    shape.moveTo(lastVertex._position.x, lastVertex._position.z);

    mainArray.forEach((vertex: Vertex, index: number) => {
      const nextNodeIndex = index === mainArray.length - 1 ? 0 : index + 1;

      if (vertex._isCurve) {
        shape.moveTo(vertex._position.x, vertex._position.z);
        shape.bezierCurveTo(
          vertex._curvePoints[0].x,
          vertex._curvePoints[0].z,
          vertex._curvePoints[1].x,
          vertex._curvePoints[1].z,
          mainArray[nextNodeIndex]._position.x,
          mainArray[nextNodeIndex]._position.z
        );
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
    this.setEdgeGroup();
    this.setCurveLineGroup();
    this.setCurveVertexGroup();

    this._sceneRenderer._scene.add(this._vertexGroup);
    this._sceneRenderer._scene.add(this._edgeGroup);
    this._sceneRenderer._scene.add(this._extrudeMesh);
    this._sceneRenderer._scene.add(this._curveLineGroup);
    this._sceneRenderer._scene.add(this._curveVertexGroup);
  }

  ///// Functions start

  setDeepth(deepth: number) {
    this._deepth = deepth;
    this.resetExtrudeMesh();
  }

  getNextMainVertex(vertexMain: Vertex) {
    const mainArray = this._vertexArray.filter(
      (vertex: Vertex) => vertex._type === "main"
    );
    const index = mainArray.findIndex(
      (vertex: Vertex) => vertex === vertexMain
    );
    return mainArray[index === mainArray.length - 1 ? 0 : index + 1];
  }

  getVertexByUuid(id: number) {
    return this._vertexArray.find((vertex: Vertex) => vertex._mesh.uuid === id);
  }
  resetAll() {
    this._vertexArray = this.getInitVertexArray();
    this.resetVirtualVertexPos();
    this.resetVertexGroup();
    this.resetEdgeGroup();
    this.resetCurveLineGroup();
    this.resetCurveVertexGroup();
    this.resetExtrudeMesh();
  }
  //Functions end

  ///// EventHandler
  moveUpEventHandler() {
    if (this._selectObject) {
      this._selectObject = null;
      this._sceneRenderer._camControls.enabled = true;
    }
  }

  mouseMoveEventListner(ev: PointerEvent) {
    const hoverVertex: any = getHoverMesh(
      this._raycaster,
      ev,
      this._vertexGroup.children,
      this._sceneRenderer._camera
    );

    const hoverEdge: any = getHoverMesh(
      this._raycaster,
      ev,
      this._edgeGroup.children,
      this._sceneRenderer._camera
    );

    const hoverCurveVertex: any = getHoverMesh(
      this._raycaster,
      ev,
      this._curveVertexGroup.children,
      this._sceneRenderer._camera
    );

    const hoverMesh = hoverVertex
      ? hoverVertex
      : hoverCurveVertex
      ? hoverCurveVertex
      : hoverEdge;

    if (hoverMesh) {
      hoverMesh.material.opacity = 1;
      this._hoverObject = hoverMesh;
      document.body.style.cursor = "pointer";
    } else if (this._hoverObject) {
      this._hoverObject.material.opacity = 0.6;
      this._hoverObject = null;
      document.body.style.cursor = "";
    }

    if (this._selectObject) {
      const planeIntersectPos = getPlaneIntersectPos(
        this._raycaster,
        ev,
        this._virtualPlane,
        this._sceneRenderer._camera
      );

      if (this._selectObject.parent.name === "main") {
        const vertexObject: any = this.getVertexByUuid(this._selectObject.uuid);
        vertexObject.setPosition(planeIntersectPos);
      } else if (this._selectObject.parent.name === "curve") {
        const vertexObject: any = this.getVertexByUuid(this._selectObject.name);
        vertexObject.changeCurvePos(this._selectObject, planeIntersectPos);
      }

      this.setVirtualVertexPos();
      // this.resetVertexGroup();
      this.resetCurveLineGroup();
      this.resetCurveVertexGroup();
      this.resetEdgeGroup();
      this.resetExtrudeMesh();
    }
  }

  mouseDownEventListner(ev: PointerEvent) {
    const hoverVertexMesh: any = getHoverMesh(
      this._raycaster,
      ev,
      this._vertexGroup.children,
      this._sceneRenderer._camera
    );
    const hoverCurveVertexMesh: any = getHoverMesh(
      this._raycaster,
      ev,
      this._curveVertexGroup.children,
      this._sceneRenderer._camera
    );

    if (hoverVertexMesh) {
      const hoverVertex = this.getVertexByUuid(hoverVertexMesh.uuid);

      if (hoverVertex._type === "virtual") {
        hoverVertex.changeToMain();
        this.resetVirtualVertexPos();
        this.resetVertexGroup();
      }
      this._selectObject = hoverVertexMesh;
      this._sceneRenderer._camControls.enabled = false;
    } else if (hoverCurveVertexMesh) {
      // const hoverVertex = this.getVertexByUuid(hoverVertexMesh.uuid);?.,kjmhngbvrf

      this._selectObject = hoverCurveVertexMesh;
      this._sceneRenderer._camControls.enabled = false;
    }
  }

  // change to curve vertex
  dblClickEventHandler(ev: MouseEvent) {
    if (this._hoverObject) {
      if (this._hoverObject.geometry instanceof THREE.TubeGeometry) {
        const ownVertex = this.getVertexByUuid(this._hoverObject.name);
        const nextVertex = this.getNextMainVertex(ownVertex);

        if (ownVertex._isCurve) {
          ownVertex.changeFromCurve();
        } else {
          ownVertex.changeToCurve(
            getInsidePos(ownVertex._position, nextVertex._position)[0],
            getInsidePos(ownVertex._position, nextVertex._position)[1]
          );
        }

        this.resetVirtualVertexPos();
        this.resetVertexGroup();
        this.resetCurveLineGroup();
        this.resetEdgeGroup();
        this.resetExtrudeMesh();
        this.resetCurveVertexGroup();
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
