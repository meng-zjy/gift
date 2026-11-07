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
      "二楼卧室的日记本，是留给你的。右上方的楼梯能走上去，过道还有我们的照片墙。",
      "你慢慢逛，我就在这里。以后这间小屋，会装下越来越多我们的故事。",
    ],
  },
};

export const livingRoom: RoomDefinition = {
  id: "living-room",
  name: "客厅",
  floor: 1,
  theme: "living",
  hint: "莫奈的睡莲、温软的沙发，还有一直等你的小人。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 240, y: 252 },
  entrances: {
    "from-kitchen": { x: 420, y: 220 },
    "from-upstairs": { x: 286, y: 190 },
    "from-basement": { x: 196, y: 220 },
  },
  stairs: [
    {
      id: "living-upstairs",
      entry: { x: 306, y: 190 },
      exit: { x: 438, y: 126 },
      direction: "up",
      destination: { roomId: "upper-hall", spawnId: "from-living" },
    },
    {
      id: "living-basement",
      entry: { x: 176, y: 220 },
      exit: { x: 48, y: 270 },
      direction: "down",
      destination: { roomId: "achievement-hall", spawnId: "from-living" },
    },
  ],
  furniture: [
    {
      id: "monet-painting",
      kind: "painting",
      x: 217,
      y: 28,
      width: 58,
      height: 46,
      solid: false,
      artworkId: "monet-water-lilies",
      interaction: {
        label: "看看莫奈的睡莲",
        area: { x: 217, y: 84, width: 58, height: 0 },
        action: { type: "story", storyId: "paintings" },
      },
    },
    { id: "sofa", kind: "sofa", x: 54, y: 109, width: 100, height: 49 },
    {
      id: "bookshelf",
      kind: "shelf",
      x: 200,
      y: 114,
      width: 60,
      height: 26,
    },
    { id: "left-plant", kind: "plant", x: 34, y: 183, width: 25, height: 29 },
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
        action: { type: "collection", collection: "words" },
      },
    },
    {
      id: "kitchen-door",
      kind: "door",
      x: 442,
      y: 178,
      width: 18,
      height: 48,
      solid: false,
      doorSide: "right",
      interaction: {
        label: "去厨房",
        range: 40,
        action: { type: "travel", roomId: "kitchen", spawnId: "from-living" },
      },
    },
  ],
};
