import type { Bounds, Point, RoomDefinition, Staircase } from "./types";

export function stairProgress(stair: Staircase, point: Point): number {
  return (point.x - stair.entry.x) / (stair.exit.x - stair.entry.x);
}

export function stairY(stair: Staircase, x: number): number {
  const progress = Math.max(0, Math.min(1, stairProgress(stair, { x, y: 0 })));
  return stair.entry.y + progress * (stair.exit.y - stair.entry.y);
}

/** Art and collision share the same side profile, including the solid timber beneath each step. */
export function stairSteps(stair: Staircase) {
  const left = Math.min(stair.entry.x, stair.exit.x);
  const width = Math.abs(stair.exit.x - stair.entry.x) / 8;
  const baseY = Math.max(stair.entry.y, stair.exit.y) + 18;
  return Array.from({ length: 8 }, (_, index) => ({
    x: left + index * width,
    y: stairY(stair, left + (index + 0.5) * width),
    width,
    baseY,
  }));
}

export function stairRails(stair: Staircase): Bounds[] {
  const rightward = stair.exit.x > stair.entry.x;
  return [
    ...stairSteps(stair).flatMap((step) => [
      { x: step.x, y: step.y - 22, width: step.width, height: 5 },
      {
        x: step.x,
        y: step.y + 18,
        width: step.width,
        height: Math.max(0, step.baseY - step.y - 18),
      },
    ]),
    {
      x: stair.exit.x + (rightward ? 8 : -12),
      y: stair.exit.y - 22,
      width: 4,
      height: 44,
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
  return room.stairs?.find((stair) => {
    const progress = stairProgress(stair, point);
    return (
      progress >= 0 &&
      progress <= 1 &&
      Math.abs(point.y - stairY(stair, point.x)) <= 12
    );
  });
}

export function onStairLanding(stair: Staircase, point: Point): boolean {
  const progress = stairProgress(stair, point);
  return (
    progress >= 0.92 &&
    progress <= 1.02 &&
    Math.abs(point.y - stairY(stair, point.x)) <= 12
  );
}

/** Entering the final platform triggers travel; walking onto the first step alone does not. */
export function arrivingStair(
  previous: Point,
  next: Point,
  room: RoomDefinition,
): Staircase | undefined {
  return room.stairs?.find(
    (stair) => !onStairLanding(stair, previous) && onStairLanding(stair, next),
  );
}
