/* Ponto de entrada: monta o App no #raiz. */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./estilos.css";

createRoot(document.getElementById("raiz")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
