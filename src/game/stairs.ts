import type { Bounds, Point, RoomDefinition, Staircase } from "./types";

export function containsPoint(bounds: Bounds, point: Point): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/** Rails prevent entering from the side. The closed end is beyond the travel landing. */
export function stairRails(stair: Staircase): Bounds[] {
  return [
    { x: stair.x, y: stair.y, width: 6, height: stair.height },
    {
      x: stair.x + stair.width - 6,
      y: stair.y,
      width: 6,
      height: stair.height,
    },
    {
      x: stair.x,
      y: stair.direction === "up" ? stair.y : stair.y + stair.height - 6,
      width: stair.width,
      height: 6,
    },
  ];
}

export function roomObstacles(room: RoomDefinition): Bounds[] {
  return [
    ...room.furniture.filter((item) => item.solid !== false),
    ...(room.stairs ?? []).flatMap(stairRails),
  ];
}

export function stairAt(
  point: Point,
  room: RoomDefinition,
): Staircase | undefined {
  return room.stairs?.find((stair) => containsPoint(stair, point));
}

/** Entering the final platform triggers travel; walking onto the first step alone does not. */
export function arrivingStair(
  previous: Point,
  next: Point,
  room: RoomDefinition,
): Staircase | undefined {
  return room.stairs?.find(
    (stair) =>
      !containsPoint(stair.landing, previous) &&
      containsPoint(stair.landing, next),
  );
}
