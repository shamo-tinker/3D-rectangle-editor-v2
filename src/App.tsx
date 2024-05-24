import { button, buttonGroup, folder, useControls } from "leva";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { useEffect, useRef, useState } from "react";

import "./styles/custom.css";

import CubeEditor, { CubeEditorConfigParams } from "./component/CubeEditor";

import { initDeepth } from "./constants";

const initParams: CubeEditorConfigParams = {
  deepth: initDeepth,
  enableVirtualVertex: true,
  width: 12,
  height: 12,
};

function App() {
  const canvasRef = useRef<HTMLDivElement>(null) as any;
  const cubeRef = useRef<CubeEditor>(null) as any;
  const [enableWidth, setEnableWidth]: [any, any] = useState(false);
  const [enableHeight, setEnableHeight]: [any, any] = useState(false);

  const [, set] = useControls(
    () => ({
      Deepth: {
        value: initParams.deepth,
        min: 0,
        max: 10,
        step: 1,
        onChange: (deepth: number) => {
          if (cubeRef.current) {
            cubeRef.current._deepth = deepth;
            cubeRef.current.resetExtrudeMesh();
          }
        },
      },

      EnableVirtualVertex: {
        value: initParams.enableVirtualVertex,

        onChange: (value: boolean) => {
          if (cubeRef.current) {
            cubeRef.current._enableVirtualVertext = value;
            cubeRef.current.resetVertexGroup();
          }
        },
      },

      EnableWidth: {
        value: enableWidth,
        onChange: (enable: boolean) => {
          if (cubeRef.current) {
            setEnableWidth(enable);
            cubeRef.current._enableWidth = enable;
          }
        },
      },
      Width: {
        disabled: !enableWidth,
        value: initParams.width,
        onChange: (width: number) => {
          if (width < 0) width = 0;
          if (cubeRef.current) {
            cubeRef.current.resetWidth(width);
          }
        },
      },
      EnableHeight: {
        value: enableHeight,
        onChange: (enable: boolean) => {
          if (cubeRef.current) {
            setEnableHeight(enable);
            cubeRef.current._enableHeight = enable;
          }
        },
      },
      Height: {
        disabled: !enableHeight,
        value: initParams.height,
        onChange: (height: number) => {
          if (height < 0) height = 0;
          if (cubeRef.current) {
            cubeRef.current.resetHeight(height);
          }
        },
      },
      "3D Model Expoter": folder({
        ExportModel1: button(
          () => {
            if (cubeRef.current) {
              const exporter = new GLTFExporter();
              exporter.parse(
                cubeRef.current._extrudeMeshGroup.children[0],
                (gltf) => {
                  const text = JSON.stringify(gltf, null, 2);
                  const blob = new Blob([text], { type: "text/plain" });
                  var link = document.createElement("a");
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.href = URL.createObjectURL(blob);
                  link.download = "3dcube.gltf";
                  link.click();
                },
                (err) => {
                  console.error(err);
                }
              );
            }
          },
          { disabled: false }
        ),
        ExportModel2: button(
          () => {
            if (cubeRef.current) {
              const exporter = new GLTFExporter();
              exporter.parse(
                cubeRef.current._extrudeMeshGroup.children[1],
                (gltf) => {
                  const text = JSON.stringify(gltf, null, 2);
                  const blob = new Blob([text], { type: "text/plain" });
                  var link = document.createElement("a");
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.href = URL.createObjectURL(blob);
                  link.download = "3dcube.gltf";
                  link.click();
                },
                (err) => {
                  console.error(err);
                }
              );
            }
          },
          { disabled: false }
        ),
        ExportModel3: button(
          () => {
            if (cubeRef.current) {
              const exporter = new GLTFExporter();
              exporter.parse(
                cubeRef.current._extrudeMeshGroup.children[2],
                (gltf) => {
                  const text = JSON.stringify(gltf, null, 2);
                  const blob = new Blob([text], { type: "text/plain" });
                  var link = document.createElement("a");
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.href = URL.createObjectURL(blob);
                  link.download = "3dcube.gltf";
                  link.click();
                },
                (err) => {
                  console.error(err);
                }
              );
            }
          },
          { disabled: false }
        ),
      }),

      Reset: button(
        () => {
          if (cubeRef.current) {
            cubeRef.current.resetAll();
          }
        },
        { disabled: false }
      ),
    }),
    [enableWidth, enableHeight]
  );

  const setWidth = (width: number) => {
    set({ Width: width });
  };

  const setHeight = (height: number) => {
    set({ Height: height });
  };

  useEffect(() => {
    if (canvasRef.current) {
      cubeRef.current = new CubeEditor(
        canvasRef.current,
        initParams,
        setWidth,
        setHeight
      );
    }
  }, []);

  return (
    <>
      <div className="canvasDiv" ref={canvasRef}></div>
    </>
  );
}

export default App;
