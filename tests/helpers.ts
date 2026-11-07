import { expect, type Page } from "@playwright/test";

export async function playerPosition(page: Page) {
  const position = await page
    .locator("canvas")
    .getAttribute("data-player-position");
  expect(position).toMatch(/^\d+,\d+$/);
  return position;
}

async function settleInput(page: Page) {
  // Let React's modal effects and Phaser's next input frame settle before a new hold.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

export async function holdDirection(page: Page, key: string, duration: number) {
  await settleInput(page);
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}
export async function expectRoom(page: Page, name: string) {
  await expect(page.getByTestId("room-name")).toHaveText(name);
  await expect(page.locator(".floor-transition")).not.toBeVisible();
}

/** Walk using real input until the scene reports the destination, independent of frame rate. */
export async function walkTo(
  page: Page,
  key: string,
  axis: "x" | "y",
  target: number,
) {
  const forward = key === "d" || key === "s";
  await settleInput(page);
  await page.keyboard.down(key);
  try {
    await expect
      .poll(
        async () => {
          const coordinates = (await playerPosition(page))!
            .split(",")
            .map(Number);
          const coordinate = coordinates[axis === "x" ? 0 : 1];
          return forward ? coordinate >= target : coordinate <= target;
        },
        { timeout: 7000, intervals: [25] },
      )
      .toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}

export async function walkToRoom(page: Page, key: string, name: string) {
  await settleInput(page);
  await page.keyboard.down(key);
  try {
    await expectRoom(page, name);
  } finally {
    await page.keyboard.up(key);
  }
}
export async function goUpstairs(page: Page) {
  await walkTo(page, "w", "y", 190);
  await walkToRoom(page, "d", "二楼过道");
}
export async function goBedroom(page: Page) {
  await goUpstairs(page);
  await walkTo(page, "s", "y", 210);
  await walkTo(page, "d", "x", 430);
  await expect(page.getByRole("button", { name: /去卧室/ })).toBeEnabled();
  await page.keyboard.press("e");
  await expectRoom(page, "卧室");
}
export async function approachDiary(page: Page) {
  await walkTo(page, "d", "x", 235);
  await walkTo(page, "w", "y", 165);
  await expect(page.getByRole("button", { name: /翻开日记/ })).toBeEnabled();
}
export async function approachPhotoBoard(page: Page) {
  await goUpstairs(page);
  await walkTo(page, "s", "y", 210);
  await walkTo(page, "d", "x", 280);
  await walkTo(page, "w", "y", 175);
  await expect(
    page.getByRole("button", { name: /看看照片展板/ }),
  ).toBeEnabled();
}
export async function goBasement(page: Page) {
  await walkTo(page, "w", "y", 220);
  await walkToRoom(page, "a", "成就长廊");
}
export async function openAchievementDisplay(page: Page) {
  await walkTo(page, "d", "x", 270);
  await walkTo(page, "w", "y", 173);
  await expect(
    page.getByRole("button", { name: /打开成就长廊/ }),
  ).toBeEnabled();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("heading", { name: "成就长廊", exact: true }),
  ).toBeVisible();
}
