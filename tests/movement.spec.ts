import { expect, test } from "@playwright/test";
import { livingRoom } from "../src/content/livingRoom";
import { movePlayer } from "../src/game/movement";

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
