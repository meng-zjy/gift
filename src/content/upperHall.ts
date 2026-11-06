import type { RoomDefinition } from "../game/types";

export const upperHall: RoomDefinition = {
  id: "upper-hall",
  name: "二楼过道",
  floor: 2,
  theme: "hallway",
  hint: "照片展板在前方，右侧门洞去卧室。左边楼梯从上端进入，往下走回一楼。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 92, y: 138 },
  entrances: {
    "from-living": { x: 92, y: 138 },
    "from-bedroom": { x: 420, y: 210 },
  },
  stairs: [
    {
      id: "hall-downstairs",
      label: "下一楼",
      x: 60,
      y: 160,
      width: 64,
      height: 104,
      direction: "down",
      landing: { x: 72, y: 240, width: 40, height: 12 },
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
