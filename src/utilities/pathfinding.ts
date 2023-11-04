// utilities/pathfinding.ts
import * as THREE from "three";
import { Grid, AStarFinder } from "pathfinding";

export class PathfindingUtilities {
  private grid: Grid;
  private pathfinder: AStarFinder;

  constructor(gridSizeX: number, gridSizeY: number) {
    this.grid = new Grid(gridSizeX, gridSizeY);
    this.pathfinder = new AStarFinder();
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): number[][] {
    // Clone the grid for a new pathfinding operation
    const gridClone = this.grid.clone();

    // Find the path
    return this.pathfinder.findPath(startX, startY, endX, endY, gridClone);
  }

  isWithinRange(
    start: THREE.Vector3,
    end: THREE.Vector3,
    range: number,
  ): boolean {
    return start.distanceTo(end) <= range;
  }
}

// You can also export standalone functions if they don't rely on any state within the class.
