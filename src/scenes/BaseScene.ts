import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Grid, AStarFinder } from "pathfinding";

export default class BaseScene {
  public renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
  public scene: THREE.Scene = new THREE.Scene();
  public camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  public cubes: THREE.Mesh[] = [];
  private grid: Grid;
  private pathfinder: AStarFinder;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private startPoint: THREE.Mesh | null;
  private endPoint: THREE.Mesh | null;
  private pathGroup: THREE.Group;
  private controls: OrbitControls;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xffffff, 1); // Set background color to white

    this.camera.position.set(0, 20, 0); // Position the camera above the grid
    this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look down at the center of the grid
    this.camera.near = 0.01;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Enable damping (inertia), which can result in a smoother ending to camera movement
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.cubes = [];

    // Create a 10x10 grid of cubes
    for (let i = -5; i < 5; i++) {
      for (let j = -5; j < 5; j++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(i, 0.5, j); // Position centered, with y offset to rest on the grid plane
        this.scene.add(cube);
        this.cubes.push(cube);
      }
    }

    const light = new THREE.PointLight(0xffffff, 100, 100);
    light.position.set(0, 50, 0);
    this.scene.add(light);

    this.grid = new Grid(10, 10);
    this.pathfinder = new AStarFinder();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.startPoint = null;
    this.endPoint = null;

    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);

    window.addEventListener("click", this.onMouseClick.bind(this));
  }

  onMouseClick(event: MouseEvent) {
    if (event.ctrlKey) {
      // Handle cube selection here
      // Update the mouse position
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Calculate objects intersecting the picking ray
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cubes);

      if (intersects.length > 0) {
        const selectedCube = intersects[0].object as THREE.Mesh;

        if (!this.startPoint) {
          this.startPoint = selectedCube;
        } else {
          this.endPoint = selectedCube;
          this.findPath();
        }
      }
    }
  }

  findPath() {
    if (!this.startPoint || !this.endPoint) return;

    // Reset the grid for a new pathfinding operation
    this.grid = this.grid.clone();

    // Convert the THREE.js world positions to grid coordinates
    const startNode = this.grid.getNodeAt(
      this.startPoint.position.x + 5,
      this.startPoint.position.z + 5,
    );
    const endNode = this.grid.getNodeAt(
      this.endPoint.position.x + 5,
      this.endPoint.position.z + 5,
    );

    // Find the path
    const path = this.pathfinder.findPath(
      startNode.x,
      startNode.y,
      endNode.x,
      endNode.y,
      this.grid,
    );

    // Visualize the path
    this.visualizePath(path);

    // Clear start and end points for the next pathfinding operation
    this.startPoint = null;
    this.endPoint = null;
    console.log("FindPath Triggered");
  }

  visualizePath(path: number[][]) {
    // Clear previous path visualization
    this.pathGroup.clear();

    if (path.length === 0) {
      console.log("No path found");
      return; // No path to visualize
    }

    // Materials for the path and points
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 1,
    });
    lineMaterial.depthTest = false;
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Create a geometry for the line with the path points
    const points = path.map(([x, z]) => {
      // Convert grid coordinates to world coordinates
      const worldX = x - 5;
      const worldZ = z - 5;

      // Create a sphere at each point and add to the path group
      const sphereGeometry = new THREE.SphereGeometry(0.51);
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(worldX, 0.5, worldZ);
      this.pathGroup.add(sphere);

      // Return the position as a Vector3 for the line
      return new THREE.Vector3(worldX, sphere.position.y + 0.5, worldZ);
    });

    // Create the line with the points and add to the path group
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances(); // This may be needed for dashed lines or if THREE.LineDashedMaterial is used
    this.pathGroup.add(line);

    console.log("Path visualized");
  }

  update() {
    // Your update logic here
    this.controls.update();
  }
}
