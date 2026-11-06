export const lifeMilestones = {
  "first-date": { title: "第一次约会", symbol: "♡" },
  "first-trip": { title: "第一次一起旅行", symbol: "⌁" },
  "first-birthday": { title: "一起过生日", symbol: "✧" },
};
export type MilestoneKey = keyof typeof lifeMilestones | "custom";

export interface ExplorationProgress {
  version: 1;
  rooms: Record<string, string>;
  reading: Record<string, string>;
}
export const explorationAchievements = [
  {
    id: "welcome",
    title: "小屋亮起第一盏灯",
    description: "走进客厅。",
    symbol: "⌂",
    rooms: ["living-room"],
  },
  {
    id: "upstairs",
    title: "拾级而上",
    description: "沿楼梯走到二楼。",
    symbol: "↟",
    rooms: ["upper-hall"],
  },
  {
    id: "three-floors",
    title: "把每一层都走过",
    description: "到访一楼、二楼和负一楼。",
    symbol: "≋",
    rooms: ["living-room", "upper-hall", "achievement-hall"],
  },
  {
    id: "every-room",
    title: "每个角落都有故事",
    description: "到访当前五个房间。",
    symbol: "✦",
    rooms: [
      "living-room",
      "kitchen",
      "upper-hall",
      "bedroom",
      "achievement-hall",
    ],
  },
  {
    id: "diary",
    title: "读完这一页",
    description: "完整读完一篇日记，示例也可以。",
    symbol: "▤",
    reading: "memory",
  },
  {
    id: "album",
    title: "把那天再走一遍",
    description: "翻完一本出游相册。",
    symbol: "▧",
    reading: "album",
  },
] as const;

export function unlockedAt(
  achievement: (typeof explorationAchievements)[number],
  progress: ExplorationProgress,
): string | null {
  if ("reading" in achievement)
    return progress.reading[achievement.reading] ?? null;
  const dates = achievement.rooms.map((room) => progress.rooms[room]);
  return dates.every(Boolean) ? dates.sort().at(-1)! : null;
}
