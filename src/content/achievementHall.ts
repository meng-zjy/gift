import type { RoomDefinition } from "../game/types";

export const achievementHall: RoomDefinition = {
  id: "achievement-hall",
  name: "成就长廊",
  floor: -1,
  theme: "achievements",
  hint: "前方金色展柜收藏小屋探索与生活里程碑。左侧沿楼梯往上走，回一楼客厅。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 92, y: 248 },
  entrances: { "from-living": { x: 92, y: 248 } },
  stairs: [
    {
      id: "basement-upstairs",
      label: "回一楼",
      x: 60,
      y: 125,
      width: 64,
      height: 104,
      direction: "up",
      landing: { x: 72, y: 135, width: 40, height: 12 },
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
