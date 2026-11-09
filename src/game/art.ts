import Phaser from "phaser";
import type { Furniture, RoomDefinition } from "./types";
import { artworks } from "../content/artworks";
import { drawStairwell } from "./stairArt";
import { drawSideDoor } from "./doorArt";
import { drawGardenHouse } from "./gardenHouseArt";

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
  const isOutdoor = room.theme === "garden" || room.theme === "balcony";
  rect(
    14,
    27,
    452,
    279,
    isOutdoor ? (room.theme === "balcony" ? 0x111c35 : 0x3f6150) : 0x152836,
  );
  rect(
    20,
    20,
    440,
    278,
    room.theme === "garden"
      ? 0x708a65
      : room.theme === "balcony"
        ? 0x3c4d72
        : colors.outline,
  );
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
  } else if (room.theme === "balcony") {
    rect(26, 82, 428, 210, 0x273456);
    for (let x = 30; x < 450; x += 38) {
      rect(x, 85, 2, 207, 0x344269);
      rect(x + 14, 104 + (x % 3) * 18, 3, 3, 0xe7d48b);
    }
    rect(26, 236, 428, 56, 0x6e7e9e);
    for (let x = 32; x < 450; x += 22) rect(x, 244, 12, 2, 0x8e9db8);
  } else if (room.theme === "garden") {
    rect(26, 82, 428, 210, 0x8baa7e);
    for (const [x, y, width] of [
      [42, 111, 9],
      [186, 132, 7],
      [352, 104, 11],
      [74, 254, 8],
      [430, 274, 9],
      [292, 236, 7],
    ]) {
      rect(x, y, width, 2, 0xaac08d);
      rect(x + 3, y - 3, 2, 5, 0x70956e);
    }
    rect(28, 192, 424, 34, 0xb4a27b);
    // A branch leads from the main path to the house door, keeping furniture off the route.
    rect(226, 94, 28, 98, 0xb4a27b);
    for (const y of [112, 138, 164, 186]) rect(230, y, 20, 2, 0xcab98e);
    for (const [x, y, width] of [
      [38, 198, 28],
      [92, 211, 20],
      [142, 198, 36],
      [206, 211, 26],
      [259, 199, 31],
      [316, 212, 38],
      [377, 198, 28],
      [420, 211, 20],
    ])
      rect(x, y, width, 3, 0xcab98e);
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
  drawWalls(scene, room, rect);
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
  if (room.theme === "bedroom") {
    rect(163, 185, 122, 77, 0x6d839c);
    rect(167, 189, 114, 69, 0xa7b3ba);
    rect(171, 193, 106, 61, 0x899eae);
    for (let x = 173; x < 275; x += 10) {
      rect(x, 187, 4, 2, 0xdfd6b7);
      rect(x, 259, 4, 2, 0xdfd6b7);
    }
  }

  for (const stair of room.stairs ?? [])
    drawStairwell(scene, room, stair, colors);
  for (const furniture of room.furniture) drawFurniture(scene, furniture);
}

type PaintRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
) => void;

function drawWalls(
  scene: Phaser.Scene,
  room: RoomDefinition,
  rect: PaintRect,
): void {
  if (room.theme === "living") {
    for (let x = 33; x < 452; x += 12) {
      rect(x, 28, 1, 49, 0xc6d0c1);
      rect(x + 3, 29, 1, 47, 0xe4e6d6);
    }
    for (const x of [65, 337]) {
      rect(x - 4, 29, 77, 47, 0x695a52);
      rect(x, 32, 69, 39, 0xced5bc);
      rect(x + 3, 35, 63, 32, 0xa1bdba);
      // Garden silhouettes and sunlight, framed by pleated fabric curtains.
      rect(x + 4, 51, 61, 16, 0x849e8b);
      for (let leaf = 0; leaf < 13; leaf++) {
        rect(
          x + 5 + leaf * 4,
          45 + (leaf % 4) * 3,
          5,
          7,
          leaf % 2 ? 0xa7b49b : 0x748f7d,
        );
      }
      rect(x + 32, 34, 3, 35, 0xf0e7cc);
      rect(x + 3, 49, 63, 3, 0xf0e7cc);
      rect(x - 6, 27, 81, 2, 0x8e7a63);
      for (let fold = 0; fold < 4; fold++) {
        rect(
          x - 5 + fold * 2,
          30,
          2,
          31 - fold * 3,
          fold % 2 ? 0xa29fb5 : 0xbcb6c9,
        );
        rect(
          x + 66 + fold * 2,
          30,
          2,
          22 + fold * 3,
          fold % 2 ? 0xa29fb5 : 0xbcb6c9,
        );
      }
      rect(x - 6, 69, 81, 4, 0xc3a784);
      rect(x - 3, 73, 75, 2, 0x8f7966);
    }
    rect(26, 77, 428, 7, 0x927d66);
    rect(26, 77, 428, 2, 0xd4bb95);
  } else if (room.theme === "bedroom") {
    rect(26, 26, 428, 56, 0x9eafbc);
    for (let x = 30; x < 452; x += 16) rect(x, 28, 1, 48, 0xadc0c8);
    rect(26, 77, 428, 7, 0x667f91);
    rect(26, 77, 428, 2, 0xc8d4cb);
    rect(87, 30, 78, 45, 0x697e90);
    rect(91, 33, 70, 37, 0xa4c2c0);
    rect(91, 53, 70, 17, 0x94ad8e);
    rect(125, 33, 3, 37, 0xc8d3cc);
    rect(91, 50, 70, 2, 0xc8d3cc);
    rect(84, 29, 10, 42, 0xb3a5ba);
    rect(158, 29, 10, 42, 0xb3a5ba);
    rect(82, 70, 88, 4, 0xb09b83);
    // A shaded lamp and small wall shelf make this a different room, not a palette swap.
    rect(350, 48, 2, 20, 0x937957);
    rect(338, 38, 26, 16, 0xe3d2a6);
    rect(342, 35, 18, 4, 0xe3d2a6);
    rect(345, 68, 13, 3, 0x937957);
  } else if (room.theme === "hallway") {
    rect(26, 26, 428, 56, 0xc9d5c6);
    for (let x = 32; x < 450; x += 18) rect(x, 28, 1, 48, 0xb8c9b7);
    rect(26, 77, 428, 7, 0x8ba18d);
    rect(73, 33, 91, 35, 0x9b8b74);
    rect(77, 36, 83, 28, 0xafcbc3);
    rect(77, 53, 83, 11, 0x94ad8e);
    rect(117, 36, 3, 28, 0xf0e9ce);
    rect(195, 42, 168, 3, 0x8b8170);
    for (const x of [210, 253, 296, 339]) {
      rect(x, 35, 17, 22, 0xd1b88c);
      rect(x + 3, 38, 11, 16, 0xb1bfa7);
    }
  } else if (room.theme === "achievements") {
    rect(26, 26, 428, 56, 0x65776e);
    for (let x = 32; x < 450; x += 20) rect(x, 29, 1, 46, 0x718278);
    rect(26, 77, 428, 7, 0xaa9470);
    for (const x of [83, 239, 395]) {
      rect(x - 8, 40, 16, 20, 0xd6bd83);
      rect(x - 5, 43, 10, 12, 0xf0dfaa);
      rect(x - 2, 60, 4, 8, 0x8c7760);
    }
    rect(177, 31, 125, 4, 0xa58b66);
    rect(191, 35, 97, 19, 0x51675e);
    rect(199, 42, 81, 2, 0xa1b29b);
  } else if (room.theme === "balcony") {
    rect(26, 26, 428, 56, 0x182541);
    for (const [x, y] of [
      [62, 41],
      [142, 32],
      [224, 53],
      [308, 38],
      [397, 58],
    ]) {
      rect(x, y, 3, 3, 0xf3dda0);
      rect(x + 5, y + 6, 2, 2, 0xd8c98c);
    }
    rect(26, 77, 428, 7, 0x7b8cab);
    rect(26, 77, 428, 2, 0xc5c8c0);
    rect(92, 39, 300, 3, 0x667897);
    rect(92, 42, 3, 32, 0x667897);
    rect(389, 42, 3, 32, 0x667897);
  } else if (room.theme === "garden") {
    rect(26, 26, 428, 56, 0x9ec5d0);
    rect(26, 52, 428, 30, 0x9ab997);
    rect(26, 77, 428, 7, 0x527653);
    rect(26, 77, 428, 2, 0xbed19e);
    rect(55, 42, 42, 3, 0xdde8dc);
    rect(49, 45, 56, 4, 0xdde8dc);
    rect(328, 34, 72, 3, 0xdde8dc);
    rect(319, 37, 90, 4, 0xdde8dc);
    for (const x of [30, 62, 110, 146, 192, 232, 275, 315, 362, 415, 445]) {
      rect(x, 59, Math.min(18, 454 - x), 19, 0x5b855d);
      rect(x + 4, 54, Math.min(12, 450 - x), 25, 0x6f9865);
    }
  } else {
    rect(26, 26, 428, 56, 0xeee5cc);
    for (let y = 28; y < 77; y += 12) {
      rect(27, y, 426, 1, 0xd0cbb6);
      for (let x = 28 + (y % 24 ? 10 : 0); x < 452; x += 24)
        rect(x, y, 1, 12, 0xd0cbb6);
    }
    // One broad kitchen window; this room has its own architecture.
    rect(281, 29, 110, 45, 0x9e927b);
    rect(285, 32, 102, 38, 0xa4c2c0);
    rect(287, 52, 98, 16, 0x94ad8e);
    rect(334, 32, 3, 38, 0xfff5dd);
    rect(285, 49, 102, 3, 0xfff5dd);
    rect(279, 69, 114, 5, 0xd8c5a1);
    for (let x = 282; x < 389; x += 9) rect(x, 30, 6, 7, 0xc5ab85);
    // Clock, hanging utensils and open shelves replace the living-room art wall.
    rect(70, 35, 24, 25, 0xb4916b);
    rect(73, 38, 18, 18, 0xf9efd4);
    rect(81, 40, 1, 9, 0x706b62);
    rect(81, 48, 5, 1, 0x706b62);
    rect(131, 36, 106, 4, 0x937e69);
    for (const x of [144, 166, 188]) {
      rect(x, 40, 2, 12, 0x8c9490);
      rect(x - 3, 51, 8, 9, x === 166 ? 0x758a86 : 0xb8bbaa);
      rect(x - 1, 53, 4, 5, 0x969f94);
    }
    rect(205, 45, 7, 17, 0xbba083);
    rect(216, 43, 10, 19, 0xc7b08d);
    rect(26, 77, 428, 7, 0x8caa98);
    rect(26, 77, 428, 2, 0xc3d0b6);
  }
}

function drawFurniture(scene: Phaser.Scene, item: Furniture): void {
  if (item.kind === "npc") return;
  if (item.kind === "garden-entry") {
    drawGardenHouse(scene, item);
    return;
  }
  if (item.kind === "telescope") {
    const brush = scene.add.graphics().setDepth(1);
    brush.fillStyle(0x6b5546).fillRect(item.x + 20, item.y + 34, 4, 28);
    brush.fillStyle(0x6b5546).fillRect(item.x + 38, item.y + 34, 4, 28);
    brush.fillStyle(0xb69a6e).fillRect(item.x + 10, item.y + 20, 43, 9);
    brush.fillStyle(0x6b8794).fillRect(item.x + 18, item.y + 21, 27, 7);
    brush.fillStyle(0xd4bb78).fillRect(item.x + 10, item.y + 18, 7, 13);
    brush.fillStyle(0xd4bb78).fillRect(item.x + 45, item.y + 19, 8, 11);
    return;
  }
  if (item.kind === "painting") {
    const frame = scene.add.graphics().setDepth(1);
    frame.fillStyle(0x6c5544).fillRect(item.x, item.y, item.width, item.height);
    frame
      .fillStyle(0xd0af78)
      .fillRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);
    frame
      .fillStyle(0xe7d9b7)
      .fillRect(item.x + 4, item.y + 4, item.width - 8, item.height - 8);
    const artwork = artworks.find((entry) => entry.id === item.artworkId);
    if (artwork && scene.textures.exists(artwork.id)) {
      const texture = scene.textures.get(artwork.id).getSourceImage();
      const scale = Math.min(
        (item.width - 12) / texture.width,
        (item.height - 12) / texture.height,
      );
      scene.add
        .image(item.x + item.width / 2, item.y + item.height / 2, artwork.id)
        .setDisplaySize(texture.width * scale, texture.height * scale)
        .setDepth(1);
    }
    return;
  }
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
  if (item.kind === "door") {
    // Cut the opening into the enclosing wall, with jambs and a floor-level threshold.
    // This is decorative; the room boundary still contains movement until E is pressed.
    if (item.doorSide === "bottom") {
      rect(-3, 2, item.width + 6, item.height - 2, 0x6e665e);
      rect(2, 0, item.width - 4, item.height, 0x344a50);
      rect(3, 1, item.width - 6, 5, 0xb49e81);
      rect(-3, 0, 5, item.height, 0xbda280);
      rect(item.width - 2, 0, 5, item.height, 0xbda280);
      rect(6, 10, item.width - 12, 3, 0x7e8879);
    } else {
      drawSideDoor(scene, item);
    }
    return;
  }
  const outdoors = [
    "bench",
    "tree",
    "flower",
    "map-board",
    "garden-entry",
  ].includes(item.kind);
  // Outdoor foliage casts a soft green shadow rather than a rectangular furniture base.
  if (outdoors) {
    brush
      .fillStyle(0x78966e)
      .fillEllipse(
        item.x + item.width / 2,
        item.y + item.height - 2,
        item.width - 4,
        6,
      );
  } else rect(3, item.height - 3, item.width, 7, 0x9c816d);
  if (item.kind === "photo-board") {
    rect(0, 0, item.width, item.height, 0x6b6756);
    rect(3, 3, item.width - 6, item.height - 8, 0xae9d7b);
    for (let index = 0; index < 5; index++) {
      const x = 10 + index * 28;
      const y = index % 2 ? 14 : 7;
      rect(x, y, 23, 27, 0xf1ebd9);
      rect(x + 2, y + 3, 19, 15, index % 2 ? 0x8aa9b7 : 0x99b59a);
      rect(x + 8, y - 2, 9, 4, 0xd4c494);
      rect(x + 4, y + 21, 15, 1, 0xb5aa8b);
    }
    rect(9, item.height - 5, 5, 9, 0x846f57);
    rect(item.width - 14, item.height - 5, 5, 9, 0x846f57);
  } else if (item.kind === "achievement-wall") {
    rect(0, 0, item.width, item.height, 0x4b625b);
    rect(3, 3, item.width - 6, item.height - 6, 0x74857a);
    for (let index = 0; index < 5; index++) {
      const x = 9 + index * 33;
      rect(x, 7, 29, 33, 0xa18a62);
      rect(x + 2, 9, 25, 29, 0xd4bc83);
      rect(x + 5, 12, 19, 21, 0x566f63);
      rect(x + 11, 15, 7, 8, 0xd4bc83);
      rect(x + 9, 23, 11, 2, 0xd4bc83);
      rect(x + 6, 29, 17, 1, 0x9eae95);
    }
  } else if (item.kind === "bench") {
    rect(9, 1, 4, 30, 0x635b49);
    rect(item.width - 13, 1, 4, 30, 0x635b49);
    for (const y of [1, 7, 13]) {
      rect(2, y, item.width - 4, 4, 0x9a714f);
      rect(3, y, item.width - 6, 1, 0xd1ac79);
    }
    rect(0, 20, item.width, 6, 0xb28a5e);
    rect(2, 20, item.width - 4, 2, 0xd1ac79);
    rect(8, 26, 5, 8, 0x635b49);
    rect(item.width - 13, 26, 5, 8, 0x635b49);
  } else if (item.kind === "tree") {
    rect(17, 31, 10, 25, 0x7b563d);
    rect(7, 17, 30, 25, 0x5f8660);
    rect(2, 23, 38, 18, 0x70996b);
    rect(12, 10, 20, 22, 0x80a875);
    rect(17, 4, 12, 14, 0x9abb80);
    rect(8, 53, 26, 3, 0x6f8f68);
  } else if (item.kind === "flower") {
    rect(8, 11, 3, 11, 0x5f8b5e);
    rect(4, 15, 11, 3, 0x6c9a63);
    rect(7, 4, 7, 7, 0xe7a5a5);
    rect(4, 7, 7, 5, 0xf0c177);
    rect(10, 7, 7, 5, 0xf0c177);
    rect(8, 7, 4, 4, 0xd28b61);
  } else if (item.kind === "map-board") {
    const boardHeight = item.height - 18;
    rect(10, boardHeight - 2, 5, 20, 0x806044);
    rect(item.width - 15, boardHeight - 2, 5, 20, 0x806044);
    rect(0, 0, item.width, boardHeight, 0x5d493b);
    rect(3, 3, item.width - 6, boardHeight - 6, 0xa58b63);
    // A separate sheet with pinned corners reads as a map attached to a noticeboard.
    rect(10, 7, item.width - 20, boardHeight - 14, 0xe5dcb8);
    rect(15, 12, 16, 9, 0xa8bd92);
    rect(40, 22, 15, 11, 0xa8bd92);
    rect(25, 17, 3, 13, 0xbc9c70);
    rect(25, 27, 24, 3, 0xbc9c70);
    for (const [x, y] of [
      [12, 9],
      [item.width - 14, 9],
      [25, 17],
      [47, 27],
    ]) {
      rect(x, y, 3, 3, 0xc98276);
    }
    rect(1, 0, item.width - 2, 2, 0xc6a875);
  } else if (item.kind === "sofa") {
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
  } else if (item.kind === "bed") {
    rect(0, 0, 100, 132, colors.outline);
    rect(3, 3, 94, 126, 0x9a8067);
    rect(7, 8, 86, 116, 0xe7ddc5);
    rect(12, 12, 32, 23, 0xf5ead4);
    rect(56, 12, 32, 23, 0xf5ead4);
    rect(7, 41, 86, 78, 0x91a5b5);
    rect(7, 41, 86, 9, 0xb9c9ce);
    for (let x = 13; x < 90; x += 12) rect(x, 52, 1, 61, 0xa9bbc3);
    rect(3, 119, 94, 7, 0x9a8067);
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
  if (item.kind === "sofa") {
    for (let stitch = 13; stitch < 87; stitch += 4)
      rect(stitch, 40, 1, 1, 0xd0d7b8);
    rect(12, 24, 34, 1, 0xc1ceb1);
    rect(52, 24, 34, 1, 0xc1ceb1);
    rect(18, 18, 14, 1, 0xe7d4b3);
    rect(65, 19, 14, 1, 0xd7bed0);
    rect(12, 46, 5, 3, 0x6b6458);
    rect(83, 46, 5, 3, 0x6b6458);
  } else if (item.kind === "desk") {
    for (let grain = 5; grain < 84; grain += 13) rect(grain, 5, 9, 1, 0xd6b58e);
    rect(55, 22, 2, 3, 0xab7b5d);
    rect(54, 20, 4, 3, 0xd6b176);
    rect(58, 13, 2, 9, 0x758e75);
    rect(56, 12, 3, 4, 0xaab28e);
  } else if (item.kind === "shelf") {
    for (let book = 7; book < 48; book += 9) rect(book + 1, 8, 4, 1, 0xe6dfb9);
  } else if (item.kind === "fridge") {
    rect(42, 5, 2, 52, 0xd7dfcb);
    rect(29, 34, 3, 2, 0x88a078);
    for (const [x, y] of [
      [29, 38],
      [31, 40],
      [33, 37],
    ])
      rect(x, y, 1, 1, 0xf6d5a1);
    rect(26, 48, 9, 1, 0xb9a88a);
  } else if (item.kind === "counter") {
    // Tiny recognisable utensils give the kitchen a lived-in scale.
    rect(32, 1, 3, 10, 0x768c8d);
    rect(32, 0, 13, 3, 0x8b9e99);
    rect(42, 2, 3, 6, 0x8b9e99);
    rect(24, 14, 27, 1, 0xd9ded0);
    rect(18, 17, 4, 1, 0x859b95);
    brush.fillStyle(0x394d55).fillCircle(item.x + 87, item.y + 14, 6);
    brush.fillStyle(0x91a7a0).fillCircle(item.x + 87, item.y + 13, 4);
    rect(86, 7, 2, 2, 0xd3dfc8);
    brush.fillStyle(0xb0bcb0).fillEllipse(item.x + 107, item.y + 12, 14, 9);
    rect(114, 11, 9, 2, 0x746957);
    rect(103, 10, 6, 3, 0xd8bf7d);
    rect(132, 9, 38, 16, 0xbba685);
    rect(134, 10, 34, 13, 0xd6bb91);
    brush.fillStyle(0xf1cb77).fillEllipse(item.x + 143, item.y + 16, 12, 8);
    brush.fillStyle(0xcf8587).fillCircle(item.x + 158, item.y + 15, 4);
    rect(157, 10, 3, 3, 0x729478);
    for (let drawer = 5; drawer < item.width - 5; drawer += 43) {
      rect(drawer + 2, 33, 1, 6, 0xa18c75);
      rect(drawer + 3, 39, 31, 1, 0xcfbda0);
    }
  } else if (item.kind === "table") {
    rect(22, 31, 42, 2, 0xeadbbd);
    rect(26, 12, 31, 2, 0xfff0dc);
    rect(29, 15, 2, 5, 0xfff0dc);
    rect(35, 15, 2, 4, 0xfff0dc);
    rect(43, 15, 2, 5, 0xfff0dc);
    rect(51, 15, 2, 4, 0xfff0dc);
    rect(39, 9, 1, 1, 0xffdeb1);
    rect(42, 11, 1, 1, 0xffdeb1);
    rect(63, 18, 1, 12, 0x828e8b);
    rect(61, 18, 5, 1, 0x828e8b);
  } else if (item.kind === "plant") {
    rect(7, 22, 11, 1, 0xd3a58c);
    rect(6, 8, 4, 1, 0xb5c49a);
    rect(16, 5, 5, 1, 0xc3cfac);
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
