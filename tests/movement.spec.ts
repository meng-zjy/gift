import { expect, test } from "@playwright/test";
import { livingRoom } from "../src/content/livingRoom";
import { movePlayer } from "../src/game/movement";
import { rooms } from "../src/content/world";
import { findNearby } from "../src/game/interaction";

test("walls stop a player even across a long movement interval", () => {
  const next = movePlayer({ x: 240, y: 280 }, { x: 100, y: 0 }, 10, livingRoom);
  expect(next.x).toBeLessThanOrEqual(446);
  expect(next.x).toBeGreaterThan(440);
});

test("the diary desk cannot be walked through", () => {
  const next = movePlayer({ x: 366, y: 220 }, { x: 0, y: -90 }, 2, livingRoom);
  expect(next.y).toBeGreaterThanOrEqual(157);
  expect(next.y).toBeLessThan(163);
});

test("moving along a furniture edge remains possible", () => {
  const next = movePlayer(
    { x: 366, y: 160 },
    { x: -90, y: -90 },
    0.3,
    livingRoom,
  );
  expect(next.x).toBeLessThan(366);
  expect(next.y).toBeGreaterThanOrEqual(157);
});

test("the upper passage crosses the entire living room and kitchen without invisible blocks", () => {
  for (const room of [livingRoom, rooms.kitchen]) {
    const right = movePlayer({ x: 36, y: 95 }, { x: 90, y: 0 }, 4.5, room);
    expect(right.x).toBeCloseTo(441);
    const left = movePlayer(right, { x: -90, y: 0 }, 4.5, room);
    expect(left.x).toBeCloseTo(36);
  }
});

test("each side of the fridge, diary and cake offers an interaction without requiring a facing", () => {
  for (const [room, id] of [
    [livingRoom, "diary-desk"],
    [rooms.kitchen, "fridge"],
    [rooms.kitchen, "cake-table"],
  ] as const) {
    const item = room.furniture.find((furniture) => furniture.id === id)!;
    for (const position of [
      { x: item.x - 8, y: item.y + item.height / 2 },
      { x: item.x + item.width + 8, y: item.y + item.height / 2 },
      { x: item.x + item.width / 2, y: item.y - 8 },
      { x: item.x + item.width / 2, y: item.y + item.height + 8 },
    ])
      expect(findNearby(position, room)?.id).toBe(id);
  }
});

test("another solid object blocks interaction and faraway objects have no prompt", () => {
  const room = structuredClone(rooms.kitchen);
  room.furniture.push({
    id: "blocker",
    kind: "shelf",
    x: 148,
    y: 113,
    width: 8,
    height: 64,
  });
  expect(findNearby({ x: 160, y: 145 }, room)).toBeNull();
  expect(findNearby({ x: 240, y: 210 }, livingRoom)).toBeNull();
});
