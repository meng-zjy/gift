import { PLAYER_HALF_SIZE, movePlayer } from "./movement";
import type { Point, RoomDefinition, Story } from "./types";
import { artworks } from "../content/artworks";
import { onStairLanding, stairY } from "./stairs";

/** Validate cross-room references before creating scenes, so expansion fails visibly. */
export function validateWorld(
  rooms: Record<string, RoomDefinition>,
  stories: Record<string, Story>,
): void {
  const allIds = new Set<string>();
  for (const [id, room] of Object.entries(rooms)) {
    if (room.id !== id) throw new Error(`房间 ID 不匹配：${id}`);
    if (![-1, 1, 2].includes(room.floor))
      throw new Error(`房间 ${id} 的楼层无效`);
    if (room.width !== 480 || room.height !== 320)
      throw new Error(`房间 ${id} 暂仅支持 480×320 画布`);
    for (const [entranceId, point] of Object.entries({
      default: room.spawn,
      ...room.entrances,
    })) {
      validateSpawn(room, point, entranceId);
      if (room.stairs?.some((stair) => onStairLanding(stair, point)))
        throw new Error(`房间 ${id} 的入口位于楼梯触发区`);
    }
    for (const stair of room.stairs ?? []) {
      if (allIds.has(stair.id)) throw new Error(`物件 ID 重复：${stair.id}`);
      allIds.add(stair.id);
      if (
        !rooms[stair.destination.roomId]?.entrances[stair.destination.spawnId]
      )
        throw new Error(`楼梯 ${stair.id} 的目标入口不存在`);
      if (
        ![stair.entry.x, stair.entry.y, stair.exit.x, stair.exit.y].every(
          Number.isFinite,
        ) ||
        Math.abs(stair.exit.x - stair.entry.x) < 72 ||
        (stair.direction === "up"
          ? stair.entry.y - stair.exit.y
          : stair.exit.y - stair.entry.y) < 24
      )
        throw new Error(`楼梯 ${stair.id} 的平台配置无效`);
      validateSpawn(
        room,
        {
          x: stair.entry.x + (stair.exit.x - stair.entry.x) * 0.95,
          y: stairY(
            stair,
            stair.entry.x + (stair.exit.x - stair.entry.x) * 0.95,
          ),
        },
        `楼梯 ${stair.id} 平台`,
      );
    }
    for (const item of room.furniture) {
      if (allIds.has(item.id)) throw new Error(`物件 ID 重复：${item.id}`);
      allIds.add(item.id);
      if (
        item.kind === "painting" &&
        !artworks.some((artwork) => artwork.id === item.artworkId)
      )
        throw new Error(`物件 ${item.id} 的画作不存在`);
      if (item.kind === "door" && !item.doorSide)
        throw new Error(`门洞 ${item.id} 缺少墙面方向`);
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
    if (
      story.kind === "gallery" &&
      !artworks.some((artwork) => artwork.id === story.artworkId)
    )
      throw new Error(`画作回忆配置无效：${id}`);
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
