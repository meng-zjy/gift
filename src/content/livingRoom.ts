import type { RoomDefinition, Story } from "../game/types";

export const stories: Record<string, Story> = {
  "first-page": {
    id: "first-page",
    kind: "memory",
    title: "先把这一页，留给我们",
    speaker: "书桌上的日记 · 演示内容",
    paragraphs: [
      "如果把喜欢变成一间小屋，我想先在窗边放一张书桌。阳光好的时候，你可以坐下来，翻翻那些被我们记住的日子。",
      "以后这里会有我们一起走过的路、你说过的话，也有你对我的好。每一件小事，都值得有一个自己的位置。",
      "现在故事才刚刚开始。这张桌子上的下一页，等我们一起写。",
    ],
  },
  "welcome-home": {
    id: "welcome-home",
    kind: "dialogue",
    title: "你来啦。",
    speaker: "屋里的另一个小人 · 演示对白",
    paragraphs: [
      "窗边的日记本，是留给你的。走近那张小书桌，就能翻开看看。",
      "你慢慢逛，我就在这里。以后这间小屋，会装下越来越多我们的故事。",
    ],
  },
};

export const livingRoom: RoomDefinition = {
  id: "living-room",
  name: "客厅",
  theme: "living",
  hint: "右侧小门通往厨房；窗边的书桌与地毯旁的小人都藏着故事。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 240, y: 252 },
  entrances: { "from-kitchen": { x: 405, y: 210 } },
  furniture: [
    { id: "sofa", kind: "sofa", x: 54, y: 109, width: 100, height: 49 },
    {
      id: "diary-desk",
      kind: "desk",
      x: 322,
      y: 109,
      width: 89,
      height: 42,
      interaction: {
        label: "翻开日记",
        action: { type: "story", storyId: "first-page" },
        point: { x: 366, y: 151 },
      },
    },
    { id: "bookshelf", kind: "shelf", x: 200, y: 88, width: 60, height: 26 },
    { id: "left-plant", kind: "plant", x: 42, y: 238, width: 25, height: 29 },
    { id: "right-plant", kind: "plant", x: 417, y: 238, width: 25, height: 29 },
    {
      id: "companion",
      kind: "npc",
      x: 170,
      y: 183,
      width: 16,
      height: 20,
      interaction: {
        label: "和小人说说话",
        action: { type: "story", storyId: "welcome-home" },
        point: { x: 178, y: 203 },
      },
    },
    {
      id: "kitchen-door",
      kind: "door",
      x: 425,
      y: 173,
      width: 25,
      height: 49,
      interaction: {
        label: "去厨房",
        point: { x: 418, y: 209 },
        action: { type: "travel", roomId: "kitchen", spawnId: "from-living" },
      },
    },
  ],
};
