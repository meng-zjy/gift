import type { RoomDefinition } from "../game/types";

export const balcony: RoomDefinition = {
  id: "balcony",
  name: "星空阳台",
  floor: 1,
  theme: "balcony",
  hint: "晚风把城市的声音吹远，只留下我们抬头看见的星星。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 60, y: 210 },
  entrances: { "from-garden": { x: 60, y: 210 } },
  furniture: [
    {
      id: "balcony-return",
      kind: "door",
      x: 20,
      y: 178,
      width: 18,
      height: 48,
      solid: false,
      doorSide: "left",
      interaction: {
        label: "回到庭院",
        range: 36,
        action: {
          type: "travel",
          roomId: "garden",
          spawnId: "from-balcony",
        },
      },
    },
    {
      id: "balcony-telescope",
      kind: "telescope",
      x: 300,
      y: 150,
      width: 62,
      height: 62,
      interaction: {
        label: "看看今晚的星星",
        action: { type: "story", storyId: "night-sky" },
      },
    },
  ],
};
