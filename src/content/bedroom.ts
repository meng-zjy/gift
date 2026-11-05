import type { RoomDefinition } from "../game/types";

/** A quiet room for Van Gogh's painting; stories and personal photos can be added later. */
export const bedroom: RoomDefinition = {
  id: "bedroom",
  name: "卧室",
  theme: "bedroom",
  hint: "梵高的《卧室》挂在墙上；左侧门洞回到客厅。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 60, y: 210 },
  entrances: { "from-living": { x: 60, y: 210 } },
  furniture: [
    {
      id: "bedroom-living-door",
      kind: "door",
      x: 20,
      y: 178,
      width: 18,
      height: 48,
      solid: false,
      doorSide: "left",
      interaction: {
        label: "回客厅",
        range: 36,
        action: {
          type: "travel",
          roomId: "living-room",
          spawnId: "from-bedroom",
        },
      },
    },
    {
      id: "van-gogh-painting",
      kind: "painting",
      x: 220,
      y: 28,
      width: 65,
      height: 46,
      solid: false,
      artworkId: "van-gogh-bedroom",
      interaction: {
        label: "看看梵高的卧室",
        area: { x: 220, y: 84, width: 65, height: 0 },
        action: { type: "story", storyId: "bedroom-painting" },
      },
    },
    { id: "our-bed", kind: "bed", x: 312, y: 120, width: 100, height: 132 },
    {
      id: "bedroom-books",
      kind: "shelf",
      x: 100,
      y: 119,
      width: 60,
      height: 26,
    },
    {
      id: "bedroom-plant",
      kind: "plant",
      x: 57,
      y: 254,
      width: 25,
      height: 29,
    },
  ],
};
