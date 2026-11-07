import type { RoomDefinition } from "../game/types";

export const achievementHall: RoomDefinition = {
  id: "achievement-hall",
  name: "成就长廊",
  floor: -1,
  theme: "achievements",
  hint: "把值得纪念的日子，慢慢收藏在这里。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 162, y: 166 },
  entrances: { "from-living": { x: 162, y: 166 } },
  stairs: [
    {
      id: "basement-upstairs",
      entry: { x: 142, y: 166 },
      exit: { x: 46, y: 126 },
      direction: "up",
      destination: { roomId: "living-room", spawnId: "from-basement" },
    },
  ],
  furniture: [
    {
      id: "achievement-display",
      kind: "achievement-wall",
      x: 190,
      y: 114,
      width: 180,
      height: 50,
      interaction: { label: "打开成就长廊", action: { type: "achievements" } },
    },
    {
      id: "achievement-plant",
      kind: "plant",
      x: 407,
      y: 244,
      width: 25,
      height: 29,
    },
  ],
};
