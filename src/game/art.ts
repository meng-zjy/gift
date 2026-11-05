import Phaser from "phaser";
import type { Furniture, RoomDefinition } from "./types";

const colors = {
  outline: 0x394554,
  wood: 0x98745e,
  woodLight: 0xc6a17d,
  floor: 0xd8bb93,
  floorLine: 0xbe9a77,
  wall: 0xd8dbcf,
  sage: 0x8aada0,
  sageLight: 0xb6c9af,
  leaf: 0x60816d,
};

/** Original code-drawn placeholder art: fixed layers, no Y-dependent sorting. */
export function drawRoom(scene: Phaser.Scene, room: RoomDefinition): void {
  const brush = scene.add.graphics().setDepth(0);
  const rect = (x: number, y: number, w: number, h: number, color: number) => {
    brush.fillStyle(color).fillRect(x, y, w, h);
  };
  rect(14, 27, 452, 279, 0x152836);
  rect(20, 20, 440, 278, colors.outline);
  rect(26, 26, 428, 64, colors.wall);
  rect(26, 82, 428, 210, colors.floor);
  if (room.theme === "kitchen") {
    for (let y = 84; y < 292; y += 16) {
      for (let x = 28; x < 452; x += 16) {
        rect(
          x,
          y,
          Math.min(15, 452 - x),
          Math.min(15, 292 - y),
          (x / 16 + y / 16) % 2 < 1 ? 0xd8d5bd : 0xbfcbbd,
        );
      }
    }
  } else
    for (let y = 85; y < 291; y += 17) {
      rect(28, y, 424, 1, colors.floorLine);
      for (let x = 28 + (y % 2) * 30; x < 451; x += 62) {
        rect(x, y, 1, Math.min(17, 292 - y), colors.floorLine);
        if (x + 10 < 452 && y + 5 < 292) {
          rect(x + 10, y + 5, Math.min(20, 452 - x - 10), 1, 0xd0af89);
        }
      }
    }
  for (let x = 33; x < 452; x += 14) rect(x, 28, 1, 51, 0xc8cfc3);
  rect(26, 77, 428, 7, colors.wood);
  rect(26, 77, 428, 2, colors.woodLight);
  // Two windows frame the room without requiring perspective geometry.
  for (const x of [73, 332]) {
    rect(x - 5, 31, 69, 43, colors.wood);
    rect(x, 35, 59, 33, 0x92b7c3);
    rect(x + 3, 38, 24, 12, 0xb6d3d0);
    rect(x + 33, 38, 22, 12, 0xd0dcd2);
    rect(x + 28, 35, 3, 33, 0xf1e7ca);
    rect(x, 51, 59, 3, 0xf1e7ca);
    rect(x - 6, 68, 71, 5, colors.woodLight);
    rect(x - 8, 31, 9, 32, 0x9fa8c2);
    rect(x + 59, 31, 9, 32, 0x9fa8c2);
  }
  // A small night-sky painting, using the blue/gold motif of her favorite art.
  rect(212, 33, 51, 35, colors.wood);
  rect(216, 37, 43, 27, 0x516b8b);
  rect(220, 53, 35, 6, 0x8393ae);
  for (const [x, y] of [
    [223, 43],
    [245, 45],
    [235, 53],
    [251, 39],
  ]) {
    rect(x, y, 3, 3, 0xf1d68b);
  }
  // The rug is decorative, so movement stays on a simple flat plane.
  if (room.theme === "living") {
    rect(176, 167, 129, 94, 0xa3879e);
    rect(180, 171, 121, 86, 0xc6adbb);
    rect(186, 177, 109, 74, 0xaaa8bc);
    for (let x = 187; x < 295; x += 12) {
      rect(x, 169, 5, 2, 0xf1ddbe);
      rect(x, 257, 5, 3, 0xf1ddbe);
    }
    rect(234, 203, 10, 3, 0xd9c6cb);
    rect(237, 200, 4, 9, 0xd9c6cb);
  }
  rect(220, 288, 40, 7, 0xb08b70);

  for (const furniture of room.furniture) drawFurniture(scene, furniture);
}

function drawFurniture(scene: Phaser.Scene, item: Furniture): void {
  if (item.kind === "npc") return;
  const brush = scene.add.graphics().setDepth(1);
  const rect = (
    dx: number,
    dy: number,
    w: number,
    h: number,
    color: number,
  ) => {
    brush.fillStyle(color).fillRect(item.x + dx, item.y + dy, w, h);
  };
  rect(3, item.height - 3, item.width, 7, 0x9c816d);
  if (item.kind === "sofa") {
    rect(0, 0, 100, 49, colors.outline);
    rect(3, 3, 94, 42, colors.sage);
    rect(8, 5, 84, 13, colors.sageLight);
    rect(11, 23, 37, 17, 0xa5b99f);
    rect(51, 23, 37, 17, 0xa5b99f);
    rect(3, 16, 8, 27, 0x72978c);
    rect(89, 16, 8, 27, 0x72978c);
    rect(17, 16, 17, 17, 0xd9c397);
    rect(64, 17, 17, 17, 0xbb9db3);
  } else if (item.kind === "desk") {
    rect(0, 0, 89, 32, colors.outline);
    rect(3, 3, 83, 23, colors.woodLight);
    rect(4, 29, 7, 13, colors.wood);
    rect(77, 29, 7, 13, colors.wood);
    rect(27, 8, 25, 17, 0x586b85);
    rect(30, 7, 21, 15, 0xf4ead1);
    rect(33, 11, 13, 1, 0xbba796);
    rect(33, 15, 10, 1, 0xbba796);
    rect(39, 5, 3, 10, 0xc97d80);
    rect(64, 7, 10, 10, 0xe8d1b0);
    rect(65, 8, 8, 3, 0x7f6056);
    rect(74, 9, 3, 6, 0xe8d1b0);
  } else if (item.kind === "shelf") {
    rect(0, 0, item.width, item.height, colors.wood);
    rect(3, 3, 54, 18, 0x6d615a);
    const books = [0x91aaa2, 0xc89a92, 0xe1c28b, 0x8197b2, 0xb8a3b8];
    books.forEach((color, index) => rect(7 + index * 9, 5, 6, 14, color));
    rect(0, 22, 60, 4, colors.woodLight);
  } else if (item.kind === "door") {
    rect(0, 0, 25, 49, colors.outline);
    rect(3, 3, 19, 43, 0x987d6d);
    rect(6, 6, 13, 18, 0xb49a7c);
    rect(6, 28, 13, 13, 0xab9076);
    rect(17, 25, 3, 3, 0xf0d08b);
  } else if (item.kind === "fridge") {
    rect(0, 0, 51, 65, colors.outline);
    rect(3, 3, 45, 59, 0xa4bdba);
    rect(5, 5, 40, 19, 0xc7d4c4);
    rect(5, 27, 40, 32, 0xb8cebe);
    rect(8, 12, 3, 8, 0x637f80);
    rect(8, 31, 3, 11, 0x637f80);
    rect(25, 31, 13, 15, 0xf5e6b9);
    rect(29, 34, 5, 6, 0xcc7e83);
    rect(30, 32, 3, 2, 0x70946f);
  } else if (item.kind === "counter") {
    rect(0, 0, item.width, 44, colors.wood);
    rect(0, 0, item.width, 27, 0xe5d9bf);
    for (let x = 5; x < item.width - 5; x += 43) {
      rect(x, 29, 38, 12, 0xbba58a);
      rect(x + 14, 31, 10, 2, 0x7c7669);
    }
    rect(13, 4, 43, 19, 0x8ea5a7);
    rect(17, 7, 35, 13, 0xb9c7bd);
    rect(76, 4, 42, 20, 0x67747b);
    rect(81, 8, 12, 12, 0x364d59);
    rect(101, 8, 12, 12, 0x364d59);
    rect(137, 12, 14, 8, 0xd6a967);
    rect(154, 10, 12, 10, 0xd68789);
  } else if (item.kind === "table") {
    rect(4, 0, 74, 43, colors.outline);
    rect(7, 3, 68, 36, 0xd6b083);
    rect(8, 43, 6, 7, colors.wood);
    rect(68, 43, 6, 7, colors.wood);
    rect(27, 15, 30, 17, 0xf3e5c8);
    rect(29, 12, 26, 9, 0xe5b6bb);
    rect(29, 21, 26, 7, 0xe9ca9b);
    rect(37, 7, 9, 8, 0xce747b);
    rect(39, 5, 5, 3, 0x6f9377);
  } else if (item.kind === "plant") {
    rect(6, 17, 14, 12, 0xb77e68);
    rect(4, 15, 18, 5, 0xd19a7d);
    rect(11, 2, 3, 16, colors.leaf);
    rect(2, 7, 11, 6, colors.leaf);
    rect(13, 3, 12, 7, 0x8ba886);
    rect(5, 0, 7, 8, 0xa8ba8e);
  }
}

export function createCharacterTextures(scene: Phaser.Scene): void {
  const pixels = [
    "....hhhhhh......",
    "...hhhhhhhh.....",
    "...hssssssh.....",
    "...hsessesh.....",
    "....ssssss......",
    ".....ssss.......",
    "...cccccccc.....",
    "..sccccccccs....",
    "..sccccccccs....",
    "...cccccccc.....",
    "....pppppp......",
    "....pp..pp......",
    "....bb..bb......",
    "................",
  ];
  for (const person of ["player", "companion"]) {
    for (const direction of ["down", "up", "left", "right"]) {
      for (let frame = 0; frame < 3; frame++) {
        const brush = scene.make.graphics({ x: 0, y: 0 });
        const palette: Record<string, number> = {
          h: person === "player" ? 0x594452 : 0x57493f,
          s: 0xedc6a0,
          e: 0x3f4049,
          c: person === "player" ? 0x9ca9cf : 0xc3aa7d,
          p: 0x667387,
          b: 0x3c4656,
        };
        pixels.forEach((row, y) =>
          [...row].forEach((pixel, x) => {
            if (pixel === ".") return;
            let color = palette[pixel];
            if (direction === "up" && y < 6) color = palette.h;
            if (direction === "left" && pixel === "e" && x > 6)
              color = palette.s;
            if (direction === "right" && pixel === "e" && x < 6)
              color = palette.s;
            // Keep thighs attached; vary the foot length instead of moving whole legs.
            if (
              y === 12 &&
              frame > 0 &&
              ((frame === 1 && x < 7) || (frame === 2 && x >= 7))
            )
              return;
            brush.fillStyle(color).fillRect(x, y, 1, 1);
          }),
        );
        brush.generateTexture(`${person}-${direction}-${frame}`, 16, 16);
        brush.destroy();
      }
    }
  }
}
