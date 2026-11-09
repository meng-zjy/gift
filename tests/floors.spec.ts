import { expect, test } from "@playwright/test";
import {
  goUpstairs,
  goBasement,
  openAchievementDisplay,
  holdDirection,
  expectRoom,
  walkTo,
  walkToRoom,
  playerPosition,
} from "./helpers";
import { buildCatalog } from "../src/memories/catalog";
import { validateArchive, type MemoryEntry } from "../src/memories/model";
import { parseExploration } from "../src/achievements/useExploration";

async function enter(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
  await expect(page.locator(".direction-up")).toBeEnabled();
}

test("stairs allow turning back and pausing before the landing, then travel up and down without bouncing", async ({
  page,
}) => {
  await enter(page);
  await walkTo(page, "d", "x", 354);
  await walkTo(page, "w", "y", 134);
  await walkTo(page, "d", "x", 406);
  const [stepX, stepY] = (await playerPosition(page))!.split(",").map(Number);
  expect(stepX).toBeGreaterThan(374);
  expect(stepY).toBeLessThan(134);
  await page.screenshot({
    path: "test-results/side-stair-walking.png",
    fullPage: true,
  });
  await expectRoom(page, "客厅");
  await page.keyboard.press("e");
  await expectRoom(page, "客厅");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.getByRole("button", { name: "继续探索" }).click();
  await walkTo(page, "a", "x", 354);
  await expectRoom(page, "客厅");
  await walkToRoom(page, "d", "二楼过道");
  await expectRoom(page, "二楼过道");
  await expect(page.getByTestId("floor-name")).toHaveText("2F");
  await page.screenshot({
    path: "test-results/upper-hall.png",
    fullPage: true,
  });
  await walkTo(page, "a", "x", 80);
  const descendingY = Number((await playerPosition(page))!.split(",")[1]);
  expect(descendingY).toBeGreaterThan(250);
  await page.screenshot({
    path: "test-results/side-stair-descending.png",
    fullPage: true,
  });
  await walkToRoom(page, "a", "客厅");
  await expectRoom(page, "客厅");
  await expect(page.getByTestId("floor-name")).toHaveText("1F");
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("a single touch direction climbs the side staircase and releasing it does not move the arrival", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await walkTo(page, "d", "x", 354);
  await walkTo(page, "w", "y", 134);
  const button = page.getByRole("button", { name: "向右移动" });
  const bounds = (await button.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  try {
    await expectRoom(page, "二楼过道");
  } finally {
    await page.mouse.up();
  }
  const arrival = await playerPosition(page);
  await page.waitForTimeout(250);
  expect(await playerPosition(page)).toBe(arrival);
  await page.screenshot({
    path: "test-results/side-stair-mobile.png",
    fullPage: true,
  });
});

test("keyboard walkers can use both edges of the stairs on consecutive round trips", async ({
  page,
}) => {
  test.setTimeout(45000);
  await enter(page);
  await walkTo(page, "d", "x", 354);
  await walkTo(page, "w", "y", 126);
  await walkToRoom(page, "d", "二楼过道");
  await walkTo(page, "s", "y", 254);
  await walkToRoom(page, "a", "客厅");
  await walkTo(page, "s", "y", 142);
  await walkToRoom(page, "d", "二楼过道");
  await walkTo(page, "w", "y", 238);
  await walkToRoom(page, "a", "客厅");
});

test("basement achievements persist and the return staircase works with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  await goBasement(page);
  await expect(page.getByTestId("floor-name")).toHaveText("B1");
  await page.screenshot({ path: "test-results/basement.png", fullPage: true });
  await openAchievementDisplay(page);
  await expect(page.locator(".badge-earned")).toHaveCount(1);
  await page.getByRole("button", { name: /生活里程碑/ }).click();
  await expect(page.getByText("待记录", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: "关闭成就长廊" }).click();
  await walkTo(page, "s", "y", 220);
  await walkTo(page, "a", "x", 130);
  await walkTo(page, "s", "y", 272);
  await walkToRoom(page, "a", "客厅");
  await expectRoom(page, "客厅");
  const progress = await page.evaluate(() =>
    localStorage.getItem("our-little-world:exploration:v1"),
  );
  await page.reload();
  await expect(page.getByTestId("room-name")).toHaveText("客厅");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("our-little-world:exploration:v1"),
    ),
  ).toBe(progress);
  await goUpstairs(page);
});

test("the exposed sides of both descending stairwells stop feet while their entrances remain open", async ({
  page,
}) => {
  test.setTimeout(45000);
  await enter(page);
  await walkTo(page, "s", "y", 282);
  await walkTo(page, "a", "x", 130);
  await holdDirection(page, "a", 700);
  expect(
    Number((await playerPosition(page))!.split(",")[0]),
  ).toBeGreaterThanOrEqual(119);
  await page.screenshot({
    path: "test-results/living-downstair-side.png",
    fullPage: true,
  });
  await walkTo(page, "d", "x", 354);
  await walkTo(page, "w", "y", 134);
  await walkToRoom(page, "d", "二楼过道");
  await walkTo(page, "s", "y", 282);
  await holdDirection(page, "a", 700);
  expect(
    Number((await playerPosition(page))!.split(",")[0]),
  ).toBeGreaterThanOrEqual(119);
  await page.screenshot({
    path: "test-results/hall-downstair-side.png",
    fullPage: true,
  });
  await walkTo(page, "w", "y", 246);
  await walkToRoom(page, "a", "客厅");
});

test("the garden doorway opens a reusable outdoor memory space and returns home", async ({
  page,
}) => {
  await enter(page);
  await walkTo(page, "s", "y", 260);
  await expect(page.getByRole("button", { name: /去庭院/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expectRoom(page, "庭院");
  await expect(page.getByTestId("floor-name")).toHaveText("1F");
  await page.screenshot({
    path: "test-results/garden-room.png",
    fullPage: true,
  });
  await walkTo(page, "d", "x", 334);
  await walkTo(page, "s", "y", 132);
  await expect(
    page.getByRole("button", { name: /查看我们的出游地图/ }),
  ).toBeEnabled();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("heading", { name: "一起去过的地方" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭收藏" }).click();
  await walkTo(page, "w", "y", 108);
  await walkTo(page, "a", "x", 240);
  await expect(page.getByRole("button", { name: /回到客厅/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expectRoom(page, "客厅");
});

test("publish a real milestone, read its story and linked memory, and preserve it when resetting exploration", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.goto("/#manage");
  await page.getByRole("button", { name: "＋ 新建日记", exact: true }).click();
  await page.getByLabel("标题", { exact: true }).fill("那天的散步");
  await page.getByLabel("正文", { exact: true }).fill("演示关联日记。");
  await page.getByLabel("发布状态").selectOption("published");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page
    .getByRole("button", { name: "＋ 新建生活里程碑", exact: true })
    .click();
  await page.getByLabel("标题", { exact: true }).fill("演示：第一次约会");
  await page.getByLabel("日期", { exact: true }).fill("2026-11-06");
  await page.getByLabel("里程碑类型").selectOption("first-date");
  await page
    .getByLabel("关联回忆（选填）")
    .selectOption({ label: "那天的散步" });
  await page.getByLabel("正文", { exact: true }).fill("演示里程碑故事。");
  await page.getByLabel("发布状态").selectOption("published");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  const backup = await page.evaluate(async () => {
    const repositoryPath = "/src/memories/repository.ts";
    const backupPath = "/src/memories/backup.ts";
    const { memoryRepository } = await import(repositoryPath);
    const { exportBackup, importBackup } = await import(backupPath);
    const blob = await exportBackup(await memoryRepository.load());
    const exported = JSON.parse(await blob.text());
    const restored = await importBackup(new File([blob], "backup.json"));
    const legacy = await importBackup(
      new File(
        [
          JSON.stringify({
            ...exported,
            version: 1,
            entries: exported.entries.filter(
              (entry: { kind: string }) => entry.kind === "diary",
            ),
          }),
        ],
        "legacy.json",
      ),
    );
    return {
      version: exported.version,
      restored: restored.entries.find(
        (entry: { kind: string }) => entry.kind === "milestone",
      ),
      legacy: legacy.entries.length,
    };
  });
  expect(backup.version).toBe(2);
  expect(backup.restored).toMatchObject({
    milestoneKey: "first-date",
    date: "2026-11-06",
  });
  expect(backup.restored.relatedId).toBeTruthy();
  expect(backup.legacy).toBe(1);
  await page.getByRole("link", { name: /回到小屋/ }).click();
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
  await goBasement(page);
  await openAchievementDisplay(page);
  await page.getByRole("button", { name: /生活里程碑/ }).click();
  await expect(page.getByText("待记录", { exact: true })).toHaveCount(2);
  await page.screenshot({
    path: "test-results/achievements.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "读这段故事" }).click();
  await expect(
    page.getByText("演示里程碑故事。", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /读完，回到成就长廊/ }).click();
  await page.getByRole("button", { name: /翻开关联回忆/ }).click();
  await expect(page.getByText("演示关联日记。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await page.getByRole("button", { name: "关闭成就长廊" }).click();
  await page.getByRole("button", { name: /回忆册/ }).click();
  await page.getByRole("button", { name: "重新开始体验", exact: true }).click();
  await page.getByRole("button", { name: "确认重新开始", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("our-little-world:exploration:v1")!)
          .rooms["achievement-hall"],
    ),
  ).toBeUndefined();
  await page.goto("/#manage");
  await expect(
    page.locator(".entry-select").filter({ hasText: "演示：第一次约会" }),
  ).toBeVisible();
});

test("milestone uniqueness and unpublished links are enforced; corrupt exploration data is ignored", () => {
  const milestone: MemoryEntry = {
    id: "milestone",
    revision: "one",
    kind: "milestone",
    status: "published",
    title: "演示",
    date: "2026-11-06",
    body: "故事",
    place: "",
    voice: "us",
    photos: [],
    updatedAt: "2026-11-06T00:00:00Z",
    milestoneKey: "first-date",
    relatedId: "diary",
  };
  const archive = {
    version: 1 as const,
    revision: "one",
    entries: [milestone],
    assets: [],
  };
  expect(() =>
    validateArchive({
      ...archive,
      entries: [
        {
          ...milestone,
          milestoneKey: ["first-date"],
        } as unknown as MemoryEntry,
      ],
    }),
  ).toThrow("里程碑类型无效");
  expect(() =>
    validateArchive({
      ...archive,
      entries: [milestone, { ...milestone, id: "duplicate" }],
    }),
  ).toThrow();
  const catalog = buildCatalog(
    {
      ...archive,
      entries: [
        milestone,
        {
          ...milestone,
          id: "diary",
          kind: "diary",
          status: "draft",
          relatedId: undefined,
        },
      ],
    },
    {},
  );
  expect(catalog.milestones[0].relatedStoryId).toBeUndefined();
  expect(parseExploration("broken")).toEqual({
    version: 1,
    rooms: {},
    reading: {},
  });
  expect(
    parseExploration(
      JSON.stringify({
        version: 1,
        rooms: { "living-room": "2026-11-06T00:00:00Z", unknown: "2026-11-06" },
        reading: { memory: "bad" },
      }),
    ),
  ).toEqual({
    version: 1,
    rooms: { "living-room": "2026-11-06T00:00:00Z" },
    reading: {},
  });
});
