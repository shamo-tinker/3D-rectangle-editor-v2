import ReactDOM from "react-dom/client";
import "./styles/tailwind.css";
import "./styles/custom.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
// import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
// import "./theme/global.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <Router>
    <App />
  </Router>
  // </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
