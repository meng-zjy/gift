import type { Bounds, Point, RoomDefinition, Staircase } from "./types";

export const STAIR_LANE_HALF_WIDTH = 12;
// Six readable treads still leave room for a full-width approach in a corner bay.
export const MIN_STAIR_RUN = 56;

export function stairProgress(stair: Staircase, point: Point): number {
  return (point.x - stair.entry.x) / (stair.exit.x - stair.entry.x);
}

export function stairY(stair: Staircase, x: number): number {
  const progress = Math.max(0, Math.min(1, stairProgress(stair, { x, y: 0 })));
  return stair.entry.y + progress * (stair.exit.y - stair.entry.y);
}

/** Steps are decorative; collision follows the continuous incline, avoiding sawtooth snags. */
export function stairSteps(stair: Staircase) {
  const left = Math.min(stair.entry.x, stair.exit.x);
  const count = Math.max(
    6,
    Math.ceil(Math.abs(stair.exit.x - stair.entry.x) / 12),
  );
  const width = Math.abs(stair.exit.x - stair.entry.x) / count;
  const baseY = Math.max(stair.entry.y, stair.exit.y) + 18;
  return Array.from({ length: count }, (_, index) => ({
    x: left + index * width,
    y: stairY(stair, left + (index + 0.5) * width),
    width,
    baseY,
  }));
}

export function roomObstacles(room: RoomDefinition): Bounds[] {
  return room.furniture.filter((item) => item.solid !== false);
}

/** Boundaries are expressed in player-centre space: every accepted lane stays clear end to end. */
export function blockedByStairs(point: Point, room: RoomDefinition): boolean {
  return (room.stairs ?? []).some((stair) => {
    const progress = stairProgress(stair, point);
    if (progress < 0) return false;
    if (progress > 1) {
      const pastExit = Math.abs(point.x - stair.exit.x);
      return pastExit <= 20 && Math.abs(point.y - stair.exit.y) <= 28;
    }
    const offset = point.y - stairY(stair, point.x);
    const aboveRail = offset < -STAIR_LANE_HALF_WIDTH - 0.001 && offset > -28;
    const belowTreads =
      offset > STAIR_LANE_HALF_WIDTH + 0.001 &&
      point.y < Math.max(stair.entry.y, stair.exit.y) + 28;
    return aboveRail || belowTreads;
  });
}

/** Only the open first step admits a new walker; crossing a side rail cannot capture one. */
export function enterStair(
  previous: Point,
  next: Point,
  room: RoomDefinition,
): Point {
  const stair = room.stairs?.find(
    (candidate) =>
      stairProgress(candidate, previous) < 0 &&
      stairProgress(candidate, next) >= 0 &&
      Math.abs(previous.y - candidate.entry.y) <= STAIR_LANE_HALF_WIDTH,
  );
  if (!stair) return next;
  return { x: next.x, y: previous.y + stairY(stair, next.x) - stair.entry.y };
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
      Math.abs(point.y - stairY(stair, point.x)) <=
        STAIR_LANE_HALF_WIDTH + 0.001
    );
  });
}

export function onStairLanding(stair: Staircase, point: Point): boolean {
  const progress = stairProgress(stair, point);
  return (
    progress >= 0.92 &&
    progress <= 1.02 &&
    Math.abs(point.y - stairY(stair, point.x)) <= STAIR_LANE_HALF_WIDTH + 0.001
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
