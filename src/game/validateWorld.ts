import { PLAYER_HALF_SIZE, movePlayer } from "./movement";
import type { Point, RoomDefinition, Story } from "./types";

/** Validate cross-room references before creating scenes, so expansion fails visibly. */
export function validateWorld(
  rooms: Record<string, RoomDefinition>,
  stories: Record<string, Story>,
): void {
  const allIds = new Set<string>();
  for (const [id, room] of Object.entries(rooms)) {
    if (room.id !== id) throw new Error(`房间 ID 不匹配：${id}`);
    if (room.width !== 480 || room.height !== 320)
      throw new Error(`房间 ${id} 暂仅支持 480×320 画布`);
    for (const [entranceId, point] of Object.entries({
      default: room.spawn,
      ...room.entrances,
    })) {
      validateSpawn(room, point, entranceId);
    }
    for (const item of room.furniture) {
      if (allIds.has(item.id)) throw new Error(`物件 ID 重复：${item.id}`);
      allIds.add(item.id);
      const action = item.interaction?.action;
      if (action?.type === "story" && !stories[action.storyId])
        throw new Error(`物件 ${item.id} 引用了不存在的回忆`);
      if (
        action?.type === "travel" &&
        !rooms[action.roomId]?.entrances[action.spawnId]
      )
        throw new Error(`物件 ${item.id} 的目标入口不存在`);
    }
  }
  for (const [id, story] of Object.entries(stories)) {
    if (id !== story.id || story.paragraphs.length === 0)
      throw new Error(`回忆配置无效：${id}`);
  }
}

function validateSpawn(
  room: RoomDefinition,
  point: Point,
  entranceId: string,
): void {
  const floor = room.walkable;
  const valid =
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x - PLAYER_HALF_SIZE >= floor.x &&
    point.x + PLAYER_HALF_SIZE <= floor.x + floor.width &&
    point.y - PLAYER_HALF_SIZE >= floor.y &&
    point.y + PLAYER_HALF_SIZE <= floor.y + floor.height;
  // A tiny movement in every direction must remain possible at an entrance.
  const movable = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ].every((velocity) => {
    const next = movePlayer(point, velocity, 0.1, room);
    return next.x !== point.x || next.y !== point.y;
  });
  if (!valid || !movable)
    throw new Error(`房间 ${room.id} 的入口 ${entranceId} 不可通行`);
}
