import { expect, test } from "@playwright/test";
import { livingRoom } from "../src/content/livingRoom";
import { movePlayer } from "../src/game/movement";
import { rooms } from "../src/content/world";
import { findNearby } from "../src/game/interaction";
import {
  arrivingStair,
  stairAt,
  stairProgress,
  stairY,
} from "../src/game/stairs";

test("both descending stairwells stop the whole foot body at their exposed side", () => {
  for (const room of Object.values(rooms)) {
    for (const stair of (room.stairs ?? []).filter(
      (item) => item.direction === "down",
    )) {
      const sign = Math.sign(stair.exit.x - stair.entry.x);
      const start = { x: stair.entry.x - sign * 20, y: stair.entry.y + 36 };
      const stopped = movePlayer(start, { x: sign * 90, y: 0 }, 1, room);
      expect(sign * (stopped.x - stair.entry.x), stair.id).toBeLessThanOrEqual(
        -9,
      );
      const alongSide = movePlayer(
        { x: stair.entry.x - sign * 3, y: stair.entry.y - 36 },
        { x: 0, y: 90 },
        0.8,
        room,
      );
      expect(alongSide.y, stair.id).toBeLessThan(stair.entry.y + 12);
    }
  }
});

test("every accepted stair lane reaches the landing and can retreat without edge snags", () => {
  for (const room of Object.values(rooms)) {
    for (const stair of room.stairs ?? []) {
      const sign = Math.sign(stair.exit.x - stair.entry.x);
      for (const offset of [-12, -9, -6, 0, 6, 9, 12]) {
        const start = {
          x: stair.entry.x - sign * 18,
          y: stair.entry.y + offset,
        };
        let position = start;
        for (
          let frame = 0;
          frame < 240 && stairProgress(stair, position) < 0.94;
          frame++
        ) {
          position = movePlayer(position, { x: sign * 90, y: 0 }, 1 / 60, room);
        }
        expect(
          stairProgress(stair, position),
          `${stair.id}, lane ${offset}`,
        ).toBeGreaterThanOrEqual(0.94);
        for (
          let frame = 0;
          frame < 240 && sign * (position.x - start.x) > 0;
          frame++
        ) {
          position = movePlayer(
            position,
            { x: -sign * 90, y: 0 },
            1 / 60,
            room,
          );
        }
        expect(sign * (position.x - stair.entry.x)).toBeLessThan(0);
        expect(position.y).toBeCloseTo(start.y, 4);
      }
    }
  }
});

test("walls stop a player even across a long movement interval", () => {
  const next = movePlayer({ x: 240, y: 210 }, { x: 100, y: 0 }, 10, livingRoom);
  expect(next.x).toBeLessThanOrEqual(446);
  expect(next.x).toBeGreaterThan(440);
});

test("the diary desk cannot be walked through", () => {
  const next = movePlayer(
    { x: 235, y: 220 },
    { x: 0, y: -90 },
    2,
    rooms.bedroom,
  );
  expect(next.y).toBeGreaterThanOrEqual(162);
  expect(next.y).toBeLessThan(168);
});

test("moving along a furniture edge remains possible", () => {
  const next = movePlayer(
    { x: 235, y: 165 },
    { x: -90, y: -90 },
    0.3,
    rooms.bedroom,
  );
  expect(next.x).toBeLessThan(235);
  expect(next.y).toBeGreaterThanOrEqual(162);
});

test("the upper passage crosses the entire living room and kitchen without invisible blocks", () => {
  for (const room of [livingRoom, rooms.kitchen]) {
    const right = movePlayer({ x: 36, y: 95 }, { x: 90, y: 0 }, 4.5, room);
    expect(right.x).toBeCloseTo(441);
    const left = movePlayer(right, { x: -90, y: 0 }, 4.5, room);
    expect(left.x).toBeCloseTo(36);
  }
});

test("corner stairs leave the living room's cross-room route open", () => {
  const right = movePlayer({ x: 36, y: 210 }, { x: 90, y: 0 }, 4.5, livingRoom);
  expect(right.x).toBeCloseTo(441);
  expect(right.y).toBe(210);
  const left = movePlayer(right, { x: -90, y: 0 }, 4.5, livingRoom);
  expect(left.x).toBeCloseTo(36);
  expect(left.y).toBe(210);
});

test("the kitchen doorway stays accessible below the upper corner stairs", () => {
  const bottom = movePlayer(
    { x: 420, y: 180 },
    { x: 0, y: 90 },
    40 / 90,
    livingRoom,
  );
  expect(bottom.y).toBeCloseTo(220);
  expect(bottom.x).toBe(420);
  const top = movePlayer(bottom, { x: 0, y: -90 }, 40 / 90, livingRoom);
  expect(top.y).toBeCloseTo(180);
});

test("each side of the fridge, diary and cake offers an interaction without requiring a facing", () => {
  for (const [room, id] of [
    [rooms.bedroom, "diary-desk"],
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

test("side stairs lift the actual walking path, allow retreat and block crossing the rail", () => {
  const stair = livingRoom.stairs![0];
  const halfway = movePlayer(
    { x: stair.entry.x - 20, y: stair.entry.y },
    { x: 90, y: 0 },
    0.8,
    livingRoom,
  );
  expect(stairProgress(stair, halfway)).toBeGreaterThan(0.3);
  expect(halfway.y).toBeLessThan(stair.entry.y);
  expect(stairAt(halfway, livingRoom)?.id).toBe(stair.id);
  expect(arrivingStair(stair.entry, halfway, livingRoom)).toBeUndefined();
  const returned = movePlayer(halfway, { x: -90, y: 0 }, 1, livingRoom);
  expect(returned.x).toBeLessThan(stair.entry.x);
  expect(Math.abs(returned.y - stair.entry.y)).toBeLessThan(3);
  const middleX = (stair.entry.x + stair.exit.x) / 2;
  const above = movePlayer(
    { x: middleX, y: stair.entry.y - 64 },
    { x: 0, y: 90 },
    1.5,
    livingRoom,
  );
  expect(above.y).toBeLessThan(stairY(stair, middleX) - 12);
  expect(stairAt(above, livingRoom)).toBeUndefined();
  const closedEdge = movePlayer(
    { x: stair.entry.x - 20, y: stair.entry.y - 20 },
    { x: 90, y: 0 },
    1,
    livingRoom,
  );
  expect(closedEdge.x).toBeLessThan(stair.entry.x);
  const landing = {
    x: stair.entry.x + (stair.exit.x - stair.entry.x) * 0.95,
    y: stairY(stair, stair.entry.x + (stair.exit.x - stair.entry.x) * 0.95),
  };
  expect(arrivingStair(halfway, landing, livingRoom)?.id).toBe(stair.id);
  expect(arrivingStair(landing, landing, livingRoom)).toBeUndefined();
});

test("every configured staircase moves along its incline in both directions", () => {
  for (const room of Object.values(rooms)) {
    for (const stair of room.stairs ?? []) {
      const sign = Math.sign(stair.exit.x - stair.entry.x);
      const start = { x: stair.entry.x - sign * 18, y: stair.entry.y };
      const moving = movePlayer(start, { x: sign * 90, y: 0 }, 0.8, room);
      expect(sign * (moving.x - stair.entry.x)).toBeGreaterThan(25);
      expect(
        stair.direction === "up" ? moving.y < start.y : moving.y > start.y,
      ).toBe(true);
      const returned = movePlayer(moving, { x: -sign * 90, y: 0 }, 1, room);
      expect(sign * (returned.x - stair.entry.x)).toBeLessThan(0);
      expect(returned.y).toBeCloseTo(start.y, 0);
    }
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
