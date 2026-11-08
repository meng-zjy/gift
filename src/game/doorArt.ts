import Phaser from "phaser";
import type { Furniture } from "./types";

/** Draw a compact side doorway that stays inside the wall and floor grid. */
export function drawSideDoor(scene: Phaser.Scene, item: Furniture): void {
  const brush = scene.add.graphics().setDepth(1);
  const right = item.doorSide === "right";
  const height = item.height;
  const openingX = right ? item.x + 3 : item.x - 1;
  const openingWidth = item.width - 3;
  const panelX = right ? openingX + 1 : openingX + 4;
  const panelWidth = openingWidth - 6;
  const rect = (
    x: number,
    y: number,
    width: number,
    heightPx: number,
    color: number,
  ) => brush.fillStyle(color).fillRect(x, y, width, heightPx);

  // A shallow cavity follows the side wall. No diagonal polygon reaches into the room.
  rect(openingX, item.y, openingWidth, height, 0x27383a);
  rect(
    right ? openingX : openingX + openingWidth - 3,
    item.y + 2,
    3,
    height - 4,
    0x17282e,
  );

  // Wall returns and a single sill make the break belong to the architecture.
  const returnX = right ? item.x - 3 : item.x + item.width - 1;
  rect(returnX, item.y - 4, 6, 4, 0x987d63);
  rect(returnX, item.y - 4, 6, 2, 0xd8dbcf);
  rect(returnX, item.y + height, 6, 4, 0x987d63);
  rect(returnX, item.y + height + 2, 6, 2, 0xd8dbcf);
  rect(right ? item.x - 3 : item.x - 1, item.y + height - 2, 10, 3, 0xc2a67f);

  // The door leaf sits in the opening. A narrow inset window and handle explain its scale.
  rect(panelX, item.y + 3, panelWidth, height - 6, 0x6b503d);
  rect(panelX + 2, item.y + 5, panelWidth - 4, height - 10, 0xb08b62);
  rect(panelX + 4, item.y + 9, panelWidth - 8, 17, 0x809486);
  rect(panelX + 6, item.y + 11, panelWidth - 12, 13, 0xa5b39a);
  rect(panelX + 4, item.y + 31, panelWidth - 8, height - 40, 0x8b684a);
  const handleX = right ? panelX + 2 : panelX + panelWidth - 4;
  rect(handleX, item.y + 25, 3, 6, 0xd9b566);
  rect(handleX - (right ? 1 : 0), item.y + 27, 4, 2, 0xf0d17d);
}
