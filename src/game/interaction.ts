import type { Bounds, Furniture, Point, RoomDefinition } from "./types";

const INTERACTION_RANGE = 28;

/** Measure from any side of an object instead of requiring a single standing spot. */
export function distanceToBounds(position: Point, bounds: Bounds): number {
  const dx = Math.max(
    bounds.x - position.x,
    0,
    position.x - bounds.x - bounds.width,
  );
  const dy = Math.max(
    bounds.y - position.y,
    0,
    position.y - bounds.y - bounds.height,
  );
  return Math.hypot(dx, dy);
}

function hasClearApproach(
  position: Point,
  target: Furniture,
  room: RoomDefinition,
): boolean {
  const area = target.interaction?.area ?? target;
  const end = {
    x: Math.max(area.x, Math.min(position.x, area.x + area.width)),
    y: Math.max(area.y, Math.min(position.y, area.y + area.height)),
  };
  const steps = Math.ceil(
    Math.hypot(end.x - position.x, end.y - position.y) / 2,
  );
  // Reject prompts through another solid object, but allow touching the target itself.
  for (let step = 1; step < steps; step++) {
    const point = {
      x: position.x + ((end.x - position.x) * step) / steps,
      y: position.y + ((end.y - position.y) * step) / steps,
    };
    if (
      room.furniture.some(
        (item) =>
          item !== target &&
          item.solid !== false &&
          point.x > item.x &&
          point.x < item.x + item.width &&
          point.y > item.y &&
          point.y < item.y + item.height,
      )
    )
      return false;
  }
  return true;
}

/** Prefer the closest reachable object; facing does not gate discovery or interaction. */
export function findNearby(
  position: Point,
  room: RoomDefinition,
): Furniture | null {
  return (
    room.furniture
      .filter((item) => item.interaction)
      .map((item) => ({
        item,
        distance: distanceToBounds(position, item.interaction?.area ?? item),
      }))
      .filter(
        ({ item, distance }) =>
          distance <= (item.interaction?.range ?? INTERACTION_RANGE),
      )
      .sort((first, second) => first.distance - second.distance)
      .find(({ item }) => hasClearApproach(position, item, room))?.item ?? null
  );
}
