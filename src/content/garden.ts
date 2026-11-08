import type { RoomDefinition } from "../game/types";

export const garden: RoomDefinition = {
  id: "garden",
  name: "庭院",
  floor: 1,
  theme: "garden",
  hint: "风吹过草地，也把我们一起走过的路留在这里。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 240, y: 108 },
  entrances: { "from-living": { x: 240, y: 108 } },
  furniture: [
    {
      id: "garden-return",
      kind: "door",
      x: 204,
      y: 78,
      width: 72,
      height: 18,
      solid: false,
      doorSide: "bottom",
      interaction: {
        label: "回到客厅",
        range: 36,
        action: {
          type: "travel",
          roomId: "living-room",
          spawnId: "from-garden",
        },
      },
    },
    { id: "garden-bench", kind: "sofa", x: 84, y: 185, width: 100, height: 49 },
    {
      id: "garden-map",
      kind: "table",
      x: 300,
      y: 148,
      width: 72,
      height: 42,
      interaction: {
        label: "查看我们的出游地图",
        action: { type: "collection", collection: "album" },
      },
    },
    { id: "garden-tree", kind: "plant", x: 388, y: 220, width: 25, height: 29 },
  ],
};
