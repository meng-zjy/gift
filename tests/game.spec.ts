import {
  goBedroom,
  approachDiary,
  playerPosition,
  walkTo,
  holdDirection as holdKey,
} from "./helpers";
import { expect, test, type Page } from "@playwright/test";

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
  await goBedroom(page);
  await approachDiary(page);
  await expect(page.getByRole("button", { name: /翻开日记/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "先把这一页，留给我们" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/diary.png", fullPage: true });
  const before = await playerPosition(page);
  await holdKey(page, "ArrowLeft", 500);
  expect(await playerPosition(page)).toEqual(before);
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
  await holdKey(page, "d", 650);
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
  await expect(page.locator(".food-cards article")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/food-cards.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "下一段" }).click();
  await expect(page.getByText(/不喜欢的食物：还没有记录/)).toBeVisible();
  await page.getByRole("button", { name: "读完，回到小屋" }).click();
  await page.screenshot({ path: "test-results/kitchen.png", fullPage: true });
  await holdKey(page, "s", 900);
  await holdKey(page, "d", 2150);
  await holdKey(page, "w", 200);
  await page.keyboard.press("e");
  await expect(page.locator(".reader-dessert")).toBeVisible();
  await page.screenshot({ path: "test-results/dessert.png", fullPage: true });
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await walkTo(page, "s", "y", 260);
  await walkTo(page, "a", "x", 60);
  await walkTo(page, "w", "y", 210);
  await expect(page.getByRole("button", { name: /回客厅/ })).toBeEnabled();
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
  await expect(page.getByText("2 / 3")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "暂停阅读" }),
  ).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("button", { name: "下一段" })).toBeDisabled();
  await page.getByRole("button", { name: "继续阅读" }).click();
  await page.getByRole("button", { name: "下一段" }).click();
  await page.getByRole("button", { name: "读完，回到小屋" }).click();
  const before = await playerPosition(page);
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已读完 · 停在第 3 段")).toBeVisible();
  await page.getByRole("button", { name: "从头回看" }).click();
  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.getByRole("button", { name: "跳过本段剧情" }).click();
  expect(await playerPosition(page)).toEqual(before);
  await page.getByRole("button", { name: /回忆册/ }).click();
  await expect(page.getByText("已读完 · 停在第 3 段")).toBeVisible();
});

test("the painting opens actual local artworks with original and pixel views", async ({
  page,
}) => {
  await openGame(page);
  await holdKey(page, "d", 430);
  await holdKey(page, "w", 1900);
  await page.keyboard.press("e");
  await expect(
    page.getByRole("heading", { name: "客厅里的一池睡莲" }),
  ).toBeVisible();
  const painting = page.getByRole("img", { name: "克劳德·莫奈《睡莲》原画" });
  await expect(painting).toBeVisible();
  await expect
    .poll(() =>
      painting.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(500);
  await page.getByRole("button", { name: "查看像素版" }).click();
  await expect(
    page.getByRole("img", { name: "克劳德·莫奈《睡莲》像素版" }),
  ).toHaveAttribute("src", /monet-pixel.png/);
  await expect(page.getByRole("button", { name: "下一幅" })).not.toBeVisible();
  await expect(
    page.getByRole("img", { name: /梵高《卧室》/ }),
  ).not.toBeVisible();
  await page.screenshot({ path: "test-results/gallery.png", fullPage: true });
});

test("the bedroom has its own painting and wall openings lead back home", async ({
  page,
}) => {
  await openGame(page);
  await goBedroom(page);
  await page.screenshot({ path: "test-results/bedroom.png", fullPage: true });
  await walkTo(page, "d", "x", 294);
  await walkTo(page, "w", "y", 90);
  await expect(
    page.getByRole("button", { name: /看看梵高的卧室/ }),
  ).toBeEnabled();
  await page.keyboard.press("e");
  const painting = page.getByRole("img", { name: "文森特·梵高《卧室》原画" });
  await expect(painting).toBeVisible();
  await expect
    .poll(() =>
      painting.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(500);
  await expect(page.getByRole("img", { name: /莫奈/ })).not.toBeVisible();
  await page.screenshot({
    path: "test-results/bedroom-gallery.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await walkTo(page, "s", "y", 215);
  await walkTo(page, "a", "x", 50);
  await page.keyboard.press("e");
  await expect(page.getByTestId("room-name")).toHaveText("二楼过道");
});

test("the fridge can be discovered from above and from its right side", async ({
  page,
}) => {
  await openGame(page);
  await holdKey(page, "d", 1850);
  await holdKey(page, "w", 450);
  await holdKey(page, "d", 650);
  await expect(page.getByRole("button", { name: /去厨房/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.getByTestId("room-name")).toHaveText("厨房");
  await holdKey(page, "w", 1600);
  await holdKey(page, "d", 430);
  await expect(
    page.getByRole("button", { name: /打开口味小本/ }),
  ).toBeEnabled();
  await page.screenshot({
    path: "test-results/fridge-above.png",
    fullPage: true,
  });
  await page.keyboard.press("e");
  await expect(page.locator(".reader-collection")).toBeVisible();
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await holdKey(page, "d", 900);
  await holdKey(page, "s", 750);
  await holdKey(page, "a", 520);
  await expect(
    page.getByRole("button", { name: /打开口味小本/ }),
  ).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.locator(".reader-collection")).toBeVisible();
});

test("a new visitor has independent progress and restarting requires confirmation", async ({
  page,
  browser,
}) => {
  await openGame(page);
  await goBedroom(page);
  await approachDiary(page);
  await page.keyboard.press("e");
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  const fresh = await browser.newContext();
  const visitor = await fresh.newPage();
  await visitor.goto(new URL(page.url()).origin);
  await expect(
    visitor.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  expect(
    await visitor.evaluate(
      () =>
        JSON.parse(localStorage.getItem("our-little-world:reading:v1")!)
          .entries["first-page"],
    ),
  ).toBeUndefined();
  await fresh.close();
  await page.bringToFront();
  const resume = page.getByRole("button", { name: "继续探索" });
  if (await resume.isVisible()) await resume.click();
  await page.getByRole("button", { name: /回忆册/ }).click();
  await page.getByRole("button", { name: "重新开始体验", exact: true }).click();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "先把这一页，留给我们" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "重新开始体验", exact: true }).click();
  await page.getByRole("button", { name: "确认重新开始", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("our-little-world:reading:v1")!)
          .entries["first-page"],
    ),
  ).toBeUndefined();
});

test("the entire game fits without browser zoom at desktop and phone sizes", async ({
  page,
}) => {
  await openGame(page);
  for (const size of [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 360, height: 640 },
  ]) {
    await page.setViewportSize(size);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        })),
      )
      .toEqual(size);
    const interaction = await page.locator(".interaction-bar").boundingBox();
    expect(interaction!.y + interaction!.height).toBeLessThanOrEqual(
      size.height,
    );
  }
  await expect(
    page.getByRole("region", { name: "小屋指南" }),
  ).not.toBeVisible();
});

test("the fixed companion can be approached and spoken to", async ({
  page,
}) => {
  await openGame(page);
  await holdKey(page, "a", 690);
  await holdKey(page, "w", 400);
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "你来啦。" })).toBeVisible();
  await expect(page.locator(".reader-dialogue")).toBeVisible();
  await page.screenshot({ path: "test-results/dialogue.png", fullPage: true });
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
  await expect(page.getByText("1 / 3")).toBeVisible();
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
  await goBedroom(page);
  const right = page.getByRole("button", { name: "向右移动" });
  await right.scrollIntoViewIfNeeded();
  const rightBox = (await right.boundingBox())!;
  await page.mouse.move(
    rightBox.x + rightBox.width / 2,
    rightBox.y + rightBox.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(1950);
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
  const before = await playerPosition(page);
  await page.waitForTimeout(250);
  expect(await playerPosition(page)).toEqual(before);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("button", { name: "继续探索" })).toBeVisible();
  await page.getByRole("button", { name: "继续探索" }).click();
  await expect(
    page.getByRole("button", { name: "继续探索" }),
  ).not.toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
