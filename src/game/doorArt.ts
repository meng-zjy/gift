import Phaser from "phaser";
import type { Furniture } from "./types";

/** Mirrored side doors keep the outer house outline intact and open toward the room. */
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

  // The recess stops at the interior wall face; trim projects inward onto the floor.
  rect(0, -3, 25, height + 6, 0x6c5544);
  rect(1, 1, 21, height - 2, 0x253638);
  rect(1, 2, 4, height - 4, 0x18292f);
  rect(22, 0, 3, height, 0xbe9b72);
  rect(24, 1, 1, height - 2, 0xe0c39a);
  rect(0, -3, 25, 4, 0xc6a17d);
  rect(0, -3, 25, 1, 0xe0c39a);
  rect(0, height - 1, 25, 4, 0xb39470);
  rect(1, height, 22, 1, 0xdfc49b);

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
