import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./styles/custom.css";
import CubeEditor from "./component/CubeEditor";

import { useControls } from "leva";
import { initDeepth } from "./constants";

function App() {
  const canvasRef = useRef<HTMLDivElement>(null) as any;
  const cubeRef = useRef<CubeEditor>(null) as any;

  useControls(() => ({
    value: {
      value: initDeepth,
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
  }));

  useEffect(() => {
    if (canvasRef.current) {
      cubeRef.current = new CubeEditor(canvasRef.current);
    }
  }, []);

  return (
    <>
      <div className="canvasDiv" ref={canvasRef}></div>
    </>
  );
}

export default App;
