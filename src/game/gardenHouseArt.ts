import Phaser from "phaser";
import type { Furniture } from "./types";

const palette = {
  plaster: 0xeee0bd,
  plasterShade: 0xcbbb98,
  trim: 0xffeccb,
  roof: 0x76998b,
  roofShade: 0x54776e,
  roofLight: 0x99b3a0,
  wood: 0x98745e,
  glass: 0xa8c7c2,
  pink: 0xd5999e,
  leaf: 0x6e9567,
};

/** A small garden facade: scalloped eaves, a strawberry crest and climbing flowers. */
export function drawGardenHouse(scene: Phaser.Scene, item: Furniture): void {
  const brush = scene.add.graphics().setDepth(1);
  const rect = (x: number, y: number, w: number, h: number, color: number) => {
    brush.fillStyle(color).fillRect(item.x + x, item.y + y, w, h);
  };

  rect(0, 0, item.width, item.height, palette.plasterShade);
  rect(3, 2, item.width - 6, item.height - 5, palette.plaster);
  rect(3, item.height - 6, item.width - 6, 3, 0xd7c9a9);
  // Staggered tiles follow a low, gently stepped roof rather than a generic triangle.
  for (let row = 0; row < 6; row++) {
    const inset = (5 - row) * 3;
    const left = inset - 4;
    const width = item.width + 8 - inset * 2;
    const y = row * 3 - 14;
    rect(left, y, width, 3, row % 2 ? palette.roof : palette.roofShade);
    for (let x = left + 5 + (row % 2) * 4; x < left + width - 3; x += 10) {
      rect(x, y, 1, 2, palette.roofLight);
    }
  }
  rect(-4, 4, item.width + 8, 2, palette.roofShade);
  for (let x = -3; x < item.width + 3; x += 6) {
    rect(x, 6, 5, 2, palette.trim);
    rect(x + 1, 8, 3, 1, palette.trim);
  }

  // A cream dormer and muted lavender shutters give the facade its own silhouette.
  rect(10, -9, 15, 14, palette.trim);
  rect(13, -6, 9, 9, palette.glass);
  rect(17, -6, 1, 9, palette.trim);
  rect(9, -12, 17, 3, palette.roofShade);
  rect(12, -14, 11, 2, palette.roof);

  for (const x of [7, 53]) {
    rect(x - 2, 21, 16, 16, 0xa49bac);
    rect(x, 20, 12, 17, palette.wood);
    rect(x + 2, 22, 8, 12, palette.glass);
    rect(x + 5, 22, 1, 12, palette.trim);
    rect(x, 37, 12, 4, palette.wood);
    rect(x + 1, 37, 10, 1, 0xc1a17c);
    for (const dx of [1, 5, 9]) {
      rect(x + dx, 34, 2, 3, palette.leaf);
      rect(x + dx - 1, 32, 3, 3, dx === 5 ? 0xe5bb83 : palette.pink);
    }
  }

  // Pixel steps form the rounded doorway; the threshold retains the existing arrival area.
  rect(24, 26, 24, 28, palette.wood);
  rect(26, 22, 20, 7, palette.wood);
  rect(30, 20, 12, 3, palette.wood);
  rect(27, 27, 18, 27, palette.roof);
  rect(29, 24, 14, 5, palette.roof);
  rect(32, 23, 8, 2, palette.roof);
  rect(32, 29, 8, 8, palette.trim);
  rect(34, 31, 4, 4, palette.glass);
  rect(40, 43, 3, 3, 0xe4c17c);
  rect(30, 48, 12, 1, palette.roofShade);
  rect(22, 53, 28, 3, 0xb1a38c);

  // A tiny strawberry above the door connects the house to her favourite sweet things.
  rect(33, 13, 7, 5, 0xc98185);
  rect(35, 18, 3, 2, 0xc98185);
  rect(34, 11, 5, 3, palette.leaf);
  rect(35, 15, 1, 1, palette.trim);
  rect(38, 16, 1, 1, palette.trim);
  for (const [x, y] of [
    [2, 17],
    [0, 27],
    [3, 42],
    [item.width - 4, 12],
  ]) {
    rect(x, y, 2, 9, palette.leaf);
    rect(x - 2, y + 2, 5, 2, 0x96ae79);
    rect(x - 1, y, 3, 3, palette.pink);
  }
}
