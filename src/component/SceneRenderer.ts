import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import {
  RENDERER_PROPS,
  cameraPos,
  HemiLight,
  SpotLight,
  defaultVertextPositions,
} from "../constants/sceneParams";

// import { ANG2RAD } from "../utils/math";
import { disposeMesh } from "../utils/three";

let aspectWidth = window.innerWidth;
let aspectHeight = window.innerHeight;

export default class SceneRenderer {
  _camera: any;
  _renderer: any;
  _scene: any;
  _camControls: any;
  _canvasDiv: any;
  _gridHelper: THREE.GridHelper;

  constructor(canvasDiv: HTMLDivElement) {
    this._gridHelper = new THREE.GridHelper();
    this._canvasDiv = canvasDiv;

    this.initialize();
  }

  initRenderer() {
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(aspectWidth, aspectHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    // this._renderer.outputEncoding = RENDERER_PROPS.outputEncoding;
    this._renderer.toneMapping = RENDERER_PROPS.toneMapping;
    this._renderer.toneMappingExposure = 1;
    this._renderer.shadowMap.enabled = RENDERER_PROPS.shadowMapEnable;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._canvasDiv.appendChild(this._renderer.domElement);
  }

  initCamera() {
    this._camera = new THREE.PerspectiveCamera(
      45,
      aspectWidth / aspectHeight,
      0.1,
      10000
    );

    this._camera.position.copy(cameraPos.D2Pos);
  }

  initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x101010);
  }

  initLights() {
    this._scene.add(HemiLight());
    this._scene.add(SpotLight());
  }

  initCameraControl() {
    this._camControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    // this._camControls.enablePan = false;
    // this._camControls.minPolarAngle = ANG2RAD(10);
    // this._camControls.maxPolarAngle = ANG2RAD(65);
    // this._camControls.maxDistance = 100;
    // this._camControls.minDistance = 25;
  }

  initGridHelper() {
    const size = 100;
    const divisions = 100;

    const centerLineColor = new THREE.Color(0x888888);
    const lineColor = new THREE.Color(0x333333);

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      centerLineColor,
      lineColor
    );
    gridHelper.position.y = -5;

    this._gridHelper = gridHelper;

    this._scene.add(this._gridHelper);
  }

  onResize() {
    aspectWidth = window.innerWidth;
    aspectHeight = window.innerHeight;
    this._camera.aspect = aspectWidth / aspectHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(aspectWidth, aspectHeight);
  }

  getScene() {
    return this._scene;
  }

  getCamera() {
    return this._camera;
  }

  initialize() {
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initLights();
    this.initCameraControl();
    this.initGridHelper();

    window.addEventListener("resize", this.onResize.bind(this), false);
    this.render();
  }

  render() {
    // const delta = this._clock.getDelta();
    requestAnimationFrame(this.render.bind(this));
    this._renderer.render(this._scene, this._camera);
  }

  dispose() {
    window.addEventListener("resize", this.onResize.bind(this), false);

    this._renderer.domElement.remove();
    this._renderer.dispose();

    disposeMesh(this._scene);
  }
}
