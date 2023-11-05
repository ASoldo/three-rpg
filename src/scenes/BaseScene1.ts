import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Grid, AStarFinder, FinderOptions } from "pathfinding";
// import { PathfindingUtilities } from "../utilities/pathfinding"; // Import your utilities here
export default class BaseScene1 {
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
  // private pathfindingUtilities: PathfindingUtilities;

  constructor() {
    // this.pathfindingUtilities = new PathfindingUtilities(10, 10);
    console.log("BaseScene1");
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

    this.camera.position.set(20, 20, 0); // Position the camera above the grid
    this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look down at the center of the grid
    this.camera.near = 0.01;
    // OrbitControls setup
    this.controls = new OrbitControls(
      this.camera,
      document.getElementById("app") as HTMLElement,
    );
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enabled = true;
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 5;
    this.controls.enableZoom = true;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: false,
    });
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

    const light = new THREE.PointLight(0xffffff, 1, 10);
    light.position.set(0, 500, 0);
    this.scene.add(light);

    this.grid = new Grid(10, 10);
    this.pathfinder = new AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true,
      heuristic: function (dx, dy) {
        return dx + dy;
      },
    } as FinderOptions);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.startPoint = null;
    this.endPoint = null;

    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);

    window.addEventListener("click", this.onMouseClick.bind(this));
  }

  resetCubeColors() {
    this.cubes.forEach((cube) => {
      // If the cube has an array of materials, iterate over them
      if (Array.isArray(cube.material)) {
        cube.material.forEach((mat) => {
          (mat as THREE.MeshBasicMaterial).color.set(0x00ff00);
        });
      } else {
        // Otherwise, just set the color directly
        (cube.material as THREE.MeshBasicMaterial).color.set(0x00ff00);
      }
    });
  }

  resetSphereColors() {
    this.pathGroup.children.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        const sphereMaterial = obj.material as THREE.MeshBasicMaterial;
        sphereMaterial.color.set(0xff0000); // Red color for the path spheres
      }
    });
  }

  highlightRange(centerCube: THREE.Mesh, range: number) {
    // Reset colors first
    this.resetCubeColors();

    // Calculate and highlight the range
    this.cubes.forEach((cube) => {
      const distance = centerCube.position.distanceTo(cube.position);
      if (distance <= range) {
        // Check if the material is an array
        if (Array.isArray(cube.material)) {
          cube.material = cube.material.map((mat) => {
            const clonedMat = mat.clone();
            (clonedMat as THREE.MeshBasicMaterial).color.set(0xff0000);
            return clonedMat;
          });
        } else {
          // Clone the material and set a different color to highlight
          cube.material = cube.material.clone();
          (cube.material as THREE.MeshBasicMaterial).color.set(0xff0000);
        }
      }
    });
  }

  onMouseClick(event: MouseEvent) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // Calculate objects intersecting the picking ray
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cubes);

    if (intersects.length > 0) {
      const selectedCube = intersects[0].object as THREE.Mesh;

      if (!this.startPoint) {
        this.startPoint = selectedCube;
        this.highlightRange(selectedCube, 3);
      } else {
        this.endPoint = selectedCube;
        this.findPath();
      }
    }

    if (event.ctrlKey) {
      // Handle cube selection here
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

  // Utility method to check if one position is within a certain range from another position
  isWithinRange(
    start: THREE.Vector3,
    end: THREE.Vector3,
    range: number,
  ): boolean {
    return start.distanceTo(end) <= range;
  }

  // Function to calculate a point on the parabola at parameter t
  parabolaPoint(
    t: number,
    start: THREE.Vector3,
    end: THREE.Vector3,
    vertex: THREE.Vector3,
  ) {
    const x = start.x * (1 - t) + end.x * t;
    const z = start.z * (1 - t) + end.z * t;
    const y = (1 - 4 * (t - 0.5) * (t - 0.5)) * vertex.y;
    return new THREE.Vector3(x, y, z);
  }

  // Utility function to draw a parabola
  drawParabola(startVec: THREE.Vector3, endVec: THREE.Vector3, color: number) {
    // Calculate parabola vertex (the highest point)
    const vertexHeight = 5; // Adjust this value as needed for the curve
    const vertex = new THREE.Vector3(
      (startVec.x + endVec.x) / 2,
      vertexHeight,
      (startVec.z + endVec.z) / 2,
    );

    // Function to calculate a point on the parabola at parameter t
    const parabolaPoint = (
      t: number,
      start: THREE.Vector3,
      end: THREE.Vector3,
      vertex: THREE.Vector3,
    ) => {
      const x = start.x * (1 - t) + end.x * t;
      const z = start.z * (1 - t) + end.z * t;
      const y = (1 - 4 * (t - 0.5) * (t - 0.5)) * vertex.y;
      return new THREE.Vector3(x, y, z);
    };

    // Create parabola points
    const parabolaPoints = [];
    const segments = 20; // Increase for a smoother curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      parabolaPoints.push(parabolaPoint(t, startVec, endVec, vertex));
    }

    // Create geometry and line for the parabola
    const parabolaGeometry = new THREE.BufferGeometry().setFromPoints(
      parabolaPoints,
    );
    const parabolaMaterial = new THREE.LineBasicMaterial({ color });
    const parabolaLine = new THREE.Line(parabolaGeometry, parabolaMaterial);

    // Add the parabola line to the path group
    this.pathGroup.add(parabolaLine);
  }

  visualizePath(path: number[][]) {
    // Clear previous path visualization
    this.pathGroup.clear();

    if (path.length === 0 || !this.startPoint || !this.endPoint) {
      console.log("No path found or start/end point not set");
      return; // No path to visualize or no start/end point set
    }

    // Calculate parabola vertex (the highest point)
    const startVec = new THREE.Vector3().copy(this.startPoint.position);
    const endVec = new THREE.Vector3().copy(this.endPoint.position);
    const vertexHeight = 5; // Adjust this value as needed for the curve
    const vertex = new THREE.Vector3(
      (startVec.x + endVec.x) / 2,
      vertexHeight,
      (startVec.z + endVec.z) / 2,
    );

    // Create parabola points
    const parabolaPoints = [];
    const segments = 20; // Increase for a smoother curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      parabolaPoints.push(this.parabolaPoint(t, startVec, endVec, vertex));
    }

    // Create geometry and line for the parabola
    const parabolaGeometry = new THREE.BufferGeometry().setFromPoints(
      parabolaPoints,
    );
    const parabolaMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const parabolaLine = new THREE.Line(parabolaGeometry, parabolaMaterial);

    // Add the parabola line to the path group
    this.pathGroup.add(parabolaLine);

    if (path.length === 0) {
      console.log("No path found");
      return; // No path to visualize
    }

    if (!this.startPoint) {
      console.log("No start point set");
      return; // Need a start point to determine the highlight range
    }

    // Define the highlight range
    const highlightRange = 3; // For example, 3 units from the start point

    // Materials for the path and points
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff,
      linewidth: 1,
    });
    lineMaterial.depthTest = false;

    // Convert start point to grid coordinates
    const startNode = this.grid.getNodeAt(
      this.startPoint.position.x + 5,
      this.startPoint.position.z + 5,
    );

    // Create a geometry for the line with the path points
    const points = path.map(([x, z]) => {
      // Convert grid coordinates to world coordinates
      const worldX = x - 5;
      const worldZ = z - 5;

      // Check if the point is within the highlight range
      const distance = Math.hypot(startNode.x - x, startNode.y - z);
      const color =
        distance <= highlightRange
          ? new THREE.Color(0x0000ff)
          : new THREE.Color(0xff0000);

      // Create a sphere at each point and add to the path group
      const sphereGeometry = new THREE.SphereGeometry(0.2, 20);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(worldX, 1.5, worldZ);
      this.pathGroup.add(sphere);

      // Return the position as a Vector3 for the line
      return new THREE.Vector3(worldX, sphere.position.y, worldZ);
    });

    // Create the line with the points and add to the path group
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances(); // This may be needed for dashed lines or if THREE.LineDashedMaterial is used
    this.pathGroup.add(line);

    console.log("Path visualized");
  }

  update() {
    this.controls.update();
  }
}
