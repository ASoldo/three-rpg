import "./style.css";
import Alpine from "alpinejs";
// @ts-ignore
window.Alpine = Alpine;
// src/main.ts
import { App } from "./app";

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
  Alpine.start();
  initSoldo();
});

export function initSoldo() {
  console.log("Game Initialized");
}
