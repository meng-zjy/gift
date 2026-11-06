import { expect, test } from "@playwright/test";
import { rooms, stories } from "../src/content/world";
import { validateWorld } from "../src/game/validateWorld";
import { parseReadingProgress } from "../src/ui/useStoryBook";

test("all room exits and entry positions are valid", () => {
  expect(() => validateWorld(rooms, stories)).not.toThrow();
});

test("a third configured room can be registered without a new scene implementation", () => {
  const studio = {
    ...structuredClone(rooms.kitchen),
    id: "studio",
    furniture: [],
  };
  expect(() => validateWorld({ ...rooms, studio }, stories)).not.toThrow();
});

test("broken destinations, duplicate objects and blocked spawns are rejected", () => {
  const broken = structuredClone(rooms);
  broken.kitchen.furniture[0].interaction!.action = {
    type: "travel",
    roomId: "missing",
    spawnId: "none",
  };
  expect(() => validateWorld(broken, stories)).toThrow("目标入口不存在");
  const duplicate = structuredClone(rooms);
  duplicate.kitchen.furniture[0].id = "sofa";
  expect(() => validateWorld(duplicate, stories)).toThrow("ID 重复");
  const blocked = structuredClone(rooms);
  blocked.kitchen.entrances["from-living"] = { x: 120, y: 120 };
  expect(() => validateWorld(blocked, stories)).toThrow("不可通行");
});

test("reading saves recover safely from corrupt, obsolete and out of range values", () => {
  expect(parseReadingProgress("not json")).toEqual({});
  expect(parseReadingProgress('{"version":99,"entries":{}}')).toEqual({});
  expect(
    parseReadingProgress(
      JSON.stringify({
        version: 1,
        entries: {
          opening: { step: 100, status: "skipped" },
          missing: { step: 1, status: "completed" },
          "first-page": { step: -2, status: "opened" },
          "cake-note": { step: 0, status: "invalid" },
        },
      }),
    ),
  ).toEqual({
    opening: { step: 2, status: "skipped" },
    "first-page": { step: 0, status: "opened" },
  });
});

test("stair destinations, landings and arrival positions reject invalid expansion configs", () => {
  const missing = structuredClone(rooms);
  missing["living-room"].stairs![0].destination.spawnId = "missing";
  expect(() => validateWorld(missing, stories)).toThrow("目标入口不存在");
  const landing = structuredClone(rooms);
  landing["living-room"].stairs![0].landing.x = 900;
  expect(() => validateWorld(landing, stories)).toThrow("平台配置无效");
  const arrival = structuredClone(rooms);
  arrival["living-room"].entrances["from-upstairs"] = { x: 367, y: 124 };
  expect(() => validateWorld(arrival, stories)).toThrow("入口位于楼梯触发区");
});
