import Phaser from "phaser";
import type { Furniture } from "./types";

/** Side doors interrupt the cutaway wall; the open leaf projects into the room. */
export function drawSideDoor(scene: Phaser.Scene, item: Furniture): void {
  const brush = scene.add.graphics().setDepth(1);
  const right = item.doorSide === "right";
  const wallFace = right ? item.x + item.width - 6 : item.x + 6;
  const inward = right ? -1 : 1;
  const point = (u: number, v: number) => ({
    x: wallFace + inward * u,
    y: item.y + v,
  });
  const rect = (u: number, v: number, w: number, h: number, color: number) => {
    const a = point(u, v);
    const b = point(u + w, v);
    brush.fillStyle(color).fillRect(Math.min(a.x, b.x), a.y, w, h);
  };
  const polygon = (vertices: number[][], color: number) => {
    brush.fillStyle(color).fillPoints(
      vertices.map(([u, v]) => point(u, v)),
      true,
    );
  };
  const height = item.height;

  const wallThickness = 6;
  const recessDepth = 8;

  // Remove the wall stripe only inside the opening. A continuous stripe behind
  // the door makes it read as a framed picture sitting on the floor.
  rect(-wallThickness, 0, wallThickness + recessDepth, height, 0x253638);
  rect(-wallThickness, 2, wallThickness + 2, height - 4, 0x18292f);

  // Short wall returns reveal its thickness above and below the actual passage.
  rect(-wallThickness, -5, wallThickness + 3, 5, 0x927d66);
  rect(-wallThickness, -5, wallThickness + 3, 2, 0xd8dbcf);
  rect(-wallThickness, height, wallThickness + 3, 5, 0x927d66);
  rect(-wallThickness, height + 3, wallThickness + 3, 2, 0xd8dbcf);
  rect(1, 0, 3, height, 0x8c7157);
  rect(3, 1, 1, height - 2, 0xd0ab7c);
  rect(-wallThickness, -2, wallThickness + recessDepth, 3, 0xc6a17d);

  // The sill continues through the wall; the leaf casts a small contact shadow
  // onto the room floor instead of carrying a rectangular dark backing.
  polygon(
    [
      [-wallThickness, height - 12],
      [4, height - 10],
      [8, height],
      [-wallThickness, height],
    ],
    0xa9a593,
  );
  rect(-wallThickness, height - 1, wallThickness + 14, 2, 0xc4b390);
  polygon(
    [
      [3, height - 3],
      [18, height - 7],
      [23, height + 1],
      [8, height + 3],
    ],
    0xa68a6e,
  );

  // A foreshortened open leaf, two inset panels and a latch distinguish it from a window.
  polygon(
    [
      [3, 2],
      [18, 8],
      [18, height - 5],
      [3, height - 1],
    ],
    0x6e5340,
  );
  polygon(
    [
      [4, 3],
      [16, 8],
      [16, height - 6],
      [4, height - 2],
    ],
    0xb08b62,
  );
  polygon(
    [
      [6, 8],
      [14, 11],
      [14, 23],
      [6, 22],
    ],
    0x7c9580,
  );
  polygon(
    [
      [7, 10],
      [13, 12],
      [13, 21],
      [7, 20],
    ],
    0x9bad8e,
  );
  polygon(
    [
      [6, 27],
      [14, 27],
      [14, height - 10],
      [6, height - 7],
    ],
    0x8d6b4d,
  );
  rect(17, 8, 1, height - 13, 0xd0ab7c);
  rect(13, 25, 2, 5, 0x795b3b);
  rect(13, 26, 4, 2, 0xe1bd70);
  rect(3, 10, 2, 3, 0xd1b98b);
  rect(3, height - 12, 2, 3, 0xd1b98b);
}
