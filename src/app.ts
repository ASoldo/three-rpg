// src/app.ts
import * as THREE from "three";
// import BaseScene from "./scenes/BaseScene";
import BaseScene1 from "./scenes/BaseScene1";
import Alpine from "alpinejs";

export class App {
  private renderer: THREE.WebGLRenderer;
  private currentScene: BaseScene1 = new BaseScene1();
  public data: any;

  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("app")?.appendChild(this.renderer.domElement);
  }

  init() {
    this.currentScene = new BaseScene1();
    this.animate();
    this.data = this.mydata();
    Alpine.data("scene", this.mydata);
    console.log(this.data);
  }

  mydata() {
    return {
      name: "whaterever",
    };
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.currentScene.update();
    this.renderer.render(this.currentScene.scene, this.currentScene.camera);
  };
}
