import Phaser from "phaser";
import type { RoomDefinition, Staircase } from "./types";
import { stairProgress, stairSteps, stairY } from "./stairs";

interface HouseMaterials {
  wall: number;
  wood: number;
  woodLight: number;
  floor: number;
  floorLine: number;
  outline: number;
}

/** Fixed architectural layers; wall reveals connect the flight to the room boundary. */
export function drawStairwell(
  scene: Phaser.Scene,
  room: RoomDefinition,
  stair: Staircase,
  materials: HouseMaterials,
): void {
  const structure = scene.add.graphics().setDepth(0.5);
  const treads = scene.add.graphics().setDepth(1);
  const foreground = scene.add.graphics().setDepth(3);
  const rect = (
    brush: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
  ) => {
    if (width <= 0 || height <= 0) return;
    brush
      .fillStyle(color)
      .fillRect(
        Math.round(x),
        Math.round(y),
        Math.ceil(width),
        Math.ceil(height),
      );
  };
  const polygon = (points: { x: number; y: number }[], color: number) =>
    structure.fillStyle(color).fillPoints(points, true);
  const steps = stairSteps(stair);
  const left = steps[0].x;
  const right = steps.at(-1)!.x + steps.at(-1)!.width;
  const bottom = Math.min(
    steps[0].baseY,
    room.walkable.y + room.walkable.height,
  );
  const sideWallX =
    stair.exit.x > stair.entry.x
      ? room.walkable.x + room.walkable.width
      : room.walkable.x;
  // Interior flights retain a local end reveal; only nearby walls are opened.
  const wallX =
    Math.abs(sideWallX - stair.exit.x) <= 24
      ? sideWallX
      : stair.exit.x + Math.sign(stair.exit.x - stair.entry.x) * 12;
  const rightExit = wallX > stair.exit.x;
  const endTread = rightExit ? steps.at(-1)! : steps[0];
  // Every flight uses the approved basement detail, mirrored for right-hand exits.
  // The painted floor extends two pixels beyond the collision-safe walking bounds.
  const wallFaceX = wallX + (rightExit ? 2 : -2);
  const exitLeft = Math.min(wallFaceX, stair.exit.x - 1);
  const exitRight = Math.max(wallFaceX, stair.exit.x + 1);
  const openingTop = endTread.y - 16;
  const openingBottom = endTread.y + 14;
  const lintelTop = openingTop - 4;

  // Erase floorboard seams inside a real stair opening, rather than framing a pasted object.
  polygon(
    [
      { x: left - 1, y: stairY(stair, left) - 20 },
      { x: right + 1, y: stairY(stair, right) - 20 },
      { x: right + 1, y: bottom + 3 },
      { x: left - 1, y: bottom + 3 },
    ],
    stair.direction === "down" ? 0x413b32 : materials.wall,
  );

  if (stair.direction === "up") {
    // Plastered spandrel and the house's timber skirting meet the bottom cutaway wall.
    polygon(
      [
        { x: left, y: stairY(stair, left) + 14 },
        { x: right, y: stairY(stair, right) + 14 },
        { x: right, y: bottom + 3 },
        { x: left, y: bottom + 3 },
      ],
      materials.wall,
    );
    rect(structure, left, bottom, right - left, 3, materials.wood);
    rect(structure, left, bottom - 1, right - left, 1, materials.woodLight);
  } else {
    // The descending flight sits below the floor: a dark well, masonry cheeks and a timber rim.
    polygon(
      [
        { x: left, y: stairY(stair, left) + 15 },
        { x: right, y: stairY(stair, right) + 15 },
        { x: right, y: bottom + 2 },
        { x: left, y: bottom + 2 },
      ],
      0x61584a,
    );
    rect(structure, left, bottom, right - left, 3, materials.wood);
    rect(structure, left + 2, bottom - 2, right - left - 4, 2, 0x302e28);
  }

  // The last landing continues through the enclosing wall; no isolated upright end cap.
  rect(
    structure,
    exitLeft,
    lintelTop,
    exitRight - exitLeft,
    bottom + 3 - lintelTop,
    materials.outline,
  );
  rect(
    structure,
    exitLeft + 2,
    openingTop,
    exitRight - exitLeft - 4,
    openingBottom - openingTop,
    0x302e28,
  );
  rect(
    structure,
    exitLeft + 2,
    openingBottom,
    exitRight - exitLeft - 4,
    bottom + 3 - openingBottom,
    materials.wall,
  );
  rect(
    structure,
    exitLeft + 2,
    bottom,
    exitRight - exitLeft - 4,
    3,
    materials.wood,
  );

  // A short landing uses the floor's own wood and grain, with only a contact shadow at the first riser.
  const landingX =
    stair.exit.x > stair.entry.x ? stair.entry.x - 9 : stair.entry.x;
  rect(treads, landingX, stair.entry.y - 16, 9, 31, materials.floor);
  rect(treads, landingX + 2, stair.entry.y + 4, 5, 1, materials.floorLine);
  rect(treads, landingX, stair.entry.y + 15, 9, 1, materials.floorLine);

  for (const step of steps) {
    const progress = stairProgress(stair, {
      x: step.x + step.width / 2,
      y: step.y,
    });
    const light = stair.direction === "down" ? 1 - progress * 0.46 : 1;
    const wood = Phaser.Display.Color.GetColor(
      Math.round(191 * light),
      Math.round(151 * light),
      Math.round(107 * light),
    );
    const riser = Phaser.Display.Color.GetColor(
      Math.round(131 * light),
      Math.round(99 * light),
      Math.round(70 * light),
    );
    const highlight = Phaser.Display.Color.GetColor(
      Math.round(218 * light),
      Math.round(184 * light),
      Math.round(135 * light),
    );
    const grain = Phaser.Display.Color.GetColor(
      Math.round(175 * light),
      Math.round(137 * light),
      Math.round(92 * light),
    );
    rect(treads, step.x, step.y - 16, step.width + 1, 30, wood);
    // Side-to-side flights need transverse riser seams to read as individual steps, not a ramp.
    const risesToRight = stairY(stair, right) < stairY(stair, left);
    const riserX = risesToRight ? step.x : step.x + step.width - 2;
    rect(treads, riserX, step.y - 15, 2, 29, riser);
    rect(treads, step.x + 2, step.y - 16, step.width - 3, 1, highlight);
    rect(treads, step.x + 2, step.y + 12, step.width - 2, 2, riser);
    rect(treads, step.x + 3, step.y - 7, step.width - 5, 1, grain);
    rect(treads, step.x + 4, step.y + 4, step.width - 6, 1, grain);
  }

  // Wall-mounted rail and narrow stringer replace the solid green frame.
  for (let x = Math.round(left); x <= right; x++) {
    const y = stairY(stair, x);
    rect(treads, x, y - 23, 1, 2, materials.wood);
    rect(treads, x, y - 24, 1, 1, materials.woodLight);
    rect(treads, x, y + 15, 1, 2, 0x71543e);
    if (stair.direction === "up") rect(structure, x, y + 18, 1, 2, 0xa8aa9b);
  }
  for (const progress of [0, 1]) {
    const x = stair.entry.x + (stair.exit.x - stair.entry.x) * progress;
    rect(treads, x - 1, stairY(stair, x) - 22, 2, 7, materials.wood);
  }

  // The jamb occludes the arriving character at a fixed layer, without Y sorting or height physics.
  const jambX = rightExit ? wallFaceX - 5 : wallFaceX;
  rect(foreground, jambX, lintelTop, 5, bottom + 3 - lintelTop, materials.wall);
  rect(
    foreground,
    rightExit ? jambX : jambX + 4,
    lintelTop,
    1,
    bottom + 3 - lintelTop,
    materials.wood,
  );
  rect(
    foreground,
    exitLeft,
    lintelTop,
    exitRight - exitLeft,
    3,
    materials.wood,
  );
  rect(
    foreground,
    exitLeft,
    lintelTop - 1,
    exitRight - exitLeft,
    1,
    materials.woodLight,
  );
}
