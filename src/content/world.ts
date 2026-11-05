import { livingRoom, stories as livingStories } from "./livingRoom";
import { bedroom } from "./bedroom";
import type { RoomDefinition, Story } from "../game/types";

export const stories: Record<string, Story> = {
  ...livingStories,
  opening: {
    id: "opening",
    kind: "intro",
    title: "欢迎来到，我们的小小世界",
    speaker: "开场短笺 · 演示文案",
    paragraphs: [
      "有些普通的日子，因为和你一起，就变成了想收藏的回忆。于是，我想给它们造一间小屋。",
      "这里有窗边的日记，有厨房里你喜欢的甜食，也有一个一直等着你的小人。这里也会记下你对我的好。",
      "你可以慢慢探索，也可以直接跳过这段话。想回头看的时候，打开「回忆册」，我说过的话都还在。",
    ],
  },
  "favorite-foods": {
    id: "favorite-foods",
    kind: "collection",
    title: "冰箱里，为你留的甜",
    speaker: "她的口味小本 · 已提供的喜好",
    paragraphs: [
      "喜欢的水果：草莓、芒果。\n喜欢的甜食：小蛋糕，还有甜甜的东西。",
      "不喜欢的食物：还没有记录。\n以后慢慢了解，再把真实的答案放进来。",
    ],
  },
  "cake-note": {
    id: "cake-note",
    kind: "dessert",
    title: "给生活留一点甜",
    speaker: "餐桌上的小纸条 · 演示内容",
    paragraphs: [
      "这里先放一块草莓小蛋糕。以后我们一起吃过的甜品，都可以在这张桌子上留下一个位置。",
      "可以记下店名、口味和那天的小事。至于最上面的那颗草莓，就留给你。",
    ],
  },
  paintings: {
    id: "paintings",
    kind: "gallery",
    title: "客厅里的一池睡莲",
    speaker: "客厅墙上的莫奈",
    artworkId: "monet-water-lilies",
    paragraphs: ["莫奈《睡莲》，1906"],
  },
  "bedroom-painting": {
    id: "bedroom-painting",
    kind: "gallery",
    title: "卧室里，梵高的卧室",
    speaker: "卧室墙上的梵高",
    artworkId: "van-gogh-bedroom",
    paragraphs: ["梵高《卧室》，1889"],
  },
};

const kitchen: RoomDefinition = {
  id: "kitchen",
  name: "厨房",
  theme: "kitchen",
  hint: "左侧门洞可以回客厅。冰箱四周都能打开口味小本，餐桌上还放着小蛋糕。",
  width: 480,
  height: 320,
  walkable: { x: 28, y: 82, width: 424, height: 208 },
  spawn: { x: 60, y: 210 },
  entrances: { "from-living": { x: 60, y: 210 } },
  furniture: [
    {
      id: "living-door",
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
          spawnId: "from-kitchen",
        },
      },
    },
    {
      id: "fridge",
      kind: "fridge",
      x: 95,
      y: 112,
      width: 51,
      height: 65,
      interaction: {
        label: "打开口味小本",
        action: { type: "story", storyId: "favorite-foods" },
      },
    },
    { id: "counter", kind: "counter", x: 216, y: 112, width: 180, height: 44 },
    {
      id: "cake-table",
      kind: "table",
      x: 273,
      y: 187,
      width: 82,
      height: 50,
      interaction: {
        label: "看看草莓蛋糕",
        action: { type: "story", storyId: "cake-note" },
      },
    },
    {
      id: "kitchen-plant",
      kind: "plant",
      x: 414,
      y: 246,
      width: 25,
      height: 29,
    },
  ],
};

export const rooms: Record<string, RoomDefinition> = {
  [livingRoom.id]: livingRoom,
  [kitchen.id]: kitchen,
  [bedroom.id]: bedroom,
};
