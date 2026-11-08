import Phaser from "phaser";
import type { Furniture } from "./types";

/** Draw a compact side doorway that stays inside the wall and floor grid. */
export function drawSideDoor(scene: Phaser.Scene, item: Furniture): void {
  const brush = scene.add.graphics().setDepth(1);
  const height = item.height;
  const rect = (
    x: number,
    y: number,
    width: number,
    heightPx: number,
    color: number,
  ) => brush.fillStyle(color).fillRect(x, y, width, heightPx);

  // Use the stairwell palette: one dark reveal, one continuous timber jamb and no floating pixels.
  rect(item.x + 1, item.y, item.width - 2, height, 0x27383a);
  rect(item.x + 1, item.y + 2, 3, height - 4, 0x17282e);
  rect(item.x + item.width - 4, item.y + 2, 3, height - 4, 0x6c5544);
  rect(item.x + 1, item.y - 2, item.width - 2, 2, 0x98745e);
  rect(item.x + 1, item.y + height, item.width - 2, 2, 0x98745e);

  // A flush timber leaf keeps the doorway readable without projecting into the floor.
  const panelX = item.x + 4;
  const panelWidth = item.width - 8;
  rect(panelX, item.y + 3, panelWidth, height - 6, 0x6b503d);
  rect(panelX + 2, item.y + 5, panelWidth - 4, height - 10, 0xb08b62);
  rect(panelX + 4, item.y + 9, panelWidth - 8, 17, 0x809486);
  rect(panelX + 6, item.y + 11, panelWidth - 12, 13, 0xa5b39a);
  rect(panelX + 4, item.y + 31, panelWidth - 8, height - 40, 0x8b684a);
  rect(panelX + panelWidth - 4, item.y + 25, 3, 6, 0xd9b566);
  rect(panelX + panelWidth - 5, item.y + 27, 4, 2, 0xf0d17d);
}
