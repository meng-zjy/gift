import { expect, test, type Page } from "@playwright/test";

async function holdKey(page: Page, key: string, duration: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

async function openGame(page: Page) {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("正在点亮小屋里的灯…")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
}

test("walk to the diary, freeze movement while reading, close and read again", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await holdKey(page, "ArrowRight", 1400);
  await holdKey(page, "ArrowUp", 1600);
  await expect(page.getByRole("button", { name: /翻开日记/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "先把这一页，留给我们" }),
  ).toBeVisible();
  const before = await page.locator("canvas").screenshot();
  await holdKey(page, "ArrowLeft", 500);
  expect(await page.locator("canvas").screenshot()).toEqual(before);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await holdKey(page, "ArrowDown", 800);
  await expect(page.getByRole("button", { name: /靠近后互动/ })).toBeDisabled();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("travel to kitchen, read food preferences, return repeatedly without duplicating the renderer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await holdKey(page, "d", 1850);
  await holdKey(page, "w", 450);
  await expect(page.getByRole("button", { name: /去厨房/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.getByTestId("room-name")).toHaveText("厨房");
  await holdKey(page, "d", 450);
  await holdKey(page, "w", 400);
  await page.keyboard.press("e");
  await expect(
    page.getByRole("heading", { name: "冰箱里，为你留的甜" }),
  ).toBeVisible();
  await expect(page.getByText(/喜欢的水果：草莓、芒果/)).toBeVisible();
  await page.getByRole("button", { name: "下一段" }).click();
  await expect(page.getByText(/不喜欢的食物：还没有记录/)).toBeVisible();
  await page.getByRole("button", { name: "读完，回到小屋" }).click();
  await page.screenshot({ path: "test-results/kitchen.png", fullPage: true });
  await holdKey(page, "s", 450);
  await holdKey(page, "a", 450);
  for (let trip = 0; trip < 3; trip++) {
    await page.keyboard.press("e");
    await expect(page.getByTestId("room-name")).toHaveText("客厅");
    await page.keyboard.press("e");
    await expect(page.getByTestId("room-name")).toHaveText("厨房");
  }
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("opening can be skipped, resumed after reload, paused and replayed without changing original progress", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "下一段" }).click();
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
  await page.reload();
  await expect(page.getByText("正在点亮小屋里的灯…")).not.toBeVisible();
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已跳过 · 停在第 2 段")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "先把这一页，留给我们" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "继续阅读" }).click();
  await expect(page.getByText("第 2 / 3 段")).toBeVisible();
  await page.getByRole("button", { name: "暂停阅读" }).click();
  await expect(page.getByRole("button", { name: "下一段" })).toBeDisabled();
  await page.getByRole("button", { name: "继续阅读" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("button", { name: "下一段" })).toBeDisabled();
  await page.getByRole("button", { name: "继续阅读" }).click();
  await page.getByRole("button", { name: "下一段" }).click();
  await page.getByRole("button", { name: "读完，回到小屋" }).click();
  const before = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已读完 · 停在第 3 段")).toBeVisible();
  await page.getByRole("button", { name: "从头回看" }).click();
  await expect(page.getByText("第 1 / 3 段")).toBeVisible();
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
  expect(await page.locator("canvas").screenshot()).toEqual(before);
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已读完 · 停在第 3 段")).toBeVisible();
});

test("the fixed companion can be approached and spoken to", async ({
  page,
}) => {
  await openGame(page);
  await holdKey(page, "a", 690);
  await holdKey(page, "w", 400);
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "你来啦。" })).toBeVisible();
  await page.getByRole("button", { name: "关闭回忆" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("keyboard buttons work while the game is paused and the room fits a laptop viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openGame(page);
  const bar = await page.locator(".interaction-bar").boundingBox();
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(768);
  await page.getByRole("button", { name: /回忆册/ }).click();
  const replay = page.getByRole("button", { name: "从头回看" });
  await replay.focus();
  await page.waitForTimeout(100);
  await page.keyboard.press("Space");
  await expect(page.getByText("第 1 / 3 段")).toBeVisible();
  await page.screenshot({ path: "test-results/opening.png", fullPage: true });
});

test("reading still works when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "QuotaExceededError");
    };
  });
  await openGame(page);
  await expect(page.getByText(/浏览器暂时无法保存阅读进度/)).toBeVisible();
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已跳过 · 停在第 1 段")).toBeVisible();
});

test("phone controls move and release; losing focus requires explicit resume", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const right = page.getByRole("button", { name: "向右移动" });
  await right.scrollIntoViewIfNeeded();
  const rightBox = (await right.boundingBox())!;
  await page.mouse.move(
    rightBox.x + rightBox.width / 2,
    rightBox.y + rightBox.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(1400);
  await page.mouse.up();
  const up = page.getByRole("button", { name: "向上移动" });
  const upBox = (await up.boundingBox())!;
  await page.mouse.move(upBox.x + upBox.width / 2, upBox.y + upBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1600);
  await page.mouse.up();
  await page.getByRole("button", { name: /翻开日记/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭回忆" }).click();
  const before = await page.locator("canvas").screenshot();
  await page.waitForTimeout(250);
  expect(await page.locator("canvas").screenshot()).toEqual(before);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("button", { name: "继续探索" })).toBeVisible();
  await page.getByRole("button", { name: "继续探索" }).click();
  await expect(
    page.getByRole("button", { name: "继续探索" }),
  ).not.toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
