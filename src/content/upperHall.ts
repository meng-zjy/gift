import type { RoomDefinition } from "../game/types";

export const upperHall: RoomDefinition = {
  id: "upper-hall",
  name: "二楼过道",
  floor: 2,
  theme: "hallway",
  hint: "照片展板收着一起出发的日子，卧室就在右侧。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 130, y: 246 },
  entrances: {
    "from-living": { x: 130, y: 246 },
    "from-bedroom": { x: 420, y: 210 },
  },
  stairs: [
    {
      id: "hall-downstairs",
      entry: { x: 110, y: 246 },
      exit: { x: 46, y: 272 },
      direction: "down",
      destination: { roomId: "living-room", spawnId: "from-upstairs" },
    },
  ],
  furniture: [
    {
      id: "photo-board",
      kind: "photo-board",
      x: 204,
      y: 120,
      width: 156,
      height: 48,
      interaction: {
        label: "看看照片展板",
        action: { type: "collection", collection: "album" },
      },
    },
    {
      id: "hall-bedroom-door",
      kind: "door",
      x: 442,
      y: 178,
      width: 18,
      height: 48,
      solid: false,
      doorSide: "right",
      interaction: {
        label: "去卧室",
        range: 40,
        action: { type: "travel", roomId: "bedroom", spawnId: "from-hall" },
      },
    },
    { id: "hall-plant", kind: "plant", x: 400, y: 250, width: 25, height: 29 },
  ],
};
