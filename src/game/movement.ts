import type { Bounds, Point, RoomDefinition } from "./types";
import { roomObstacles } from "./stairs";

export const PLAYER_HALF_SIZE = 6;

function overlaps(first: Bounds, second: Bounds): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function canStand(position: Point, room: RoomDefinition): boolean {
  const body = {
    x: position.x - PLAYER_HALF_SIZE,
    y: position.y - PLAYER_HALF_SIZE,
    width: PLAYER_HALF_SIZE * 2,
    height: PLAYER_HALF_SIZE * 2,
  };
  const floor = room.walkable;
  const inside =
    body.x >= floor.x &&
    body.y >= floor.y &&
    body.x + body.width <= floor.x + floor.width &&
    body.y + body.height <= floor.y + floor.height;
  return (
    inside && !roomObstacles(room).some((obstacle) => overlaps(body, obstacle))
  );
}

/** Substeps prevent tunnelling through furniture after a slow frame. */
export function movePlayer(
  position: Point,
  velocity: Point,
  seconds: number,
  room: RoomDefinition,
): Point {
  const distance =
    Math.max(Math.abs(velocity.x), Math.abs(velocity.y)) * seconds;
  const steps = Math.max(1, Math.ceil(distance / PLAYER_HALF_SIZE));
  const next = { ...position };
  for (let step = 0; step < steps; step++) {
    const horizontal = {
      x: next.x + (velocity.x * seconds) / steps,
      y: next.y,
    };
    if (canStand(horizontal, room)) next.x = horizontal.x;
    const vertical = { x: next.x, y: next.y + (velocity.y * seconds) / steps };
    if (canStand(vertical, room)) next.y = vertical.y;
  }
  return next;
}
