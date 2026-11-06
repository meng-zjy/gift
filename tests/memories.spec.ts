import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  validateArchive,
  validateEntry,
  type MemoryEntry,
} from "../src/memories/model";
import { buildCatalog, memoryStoryId } from "../src/memories/catalog";

async function manager(page: Page) {
  await page.goto("/#manage");
  await expect(
    page.getByRole("heading", { name: "把日子，慢慢收好。" }),
  ).toBeVisible();
}
async function hold(page: Page, key: string, duration: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}
async function game(page: Page, first = true) {
  await page.getByRole("link", { name: "回到小屋", exact: false }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("正在点亮小屋里的灯…")).not.toBeVisible();
  if (first) await page.getByRole("button", { name: "跳过本段剧情" }).click();
}
async function fillMemory(
  page: Page,
  kind: string,
  title: string,
  status = "published",
) {
  await page
    .getByRole("button", { name: `＋ 新建${kind}`, exact: true })
    .click();
  await page.getByLabel("标题", { exact: true }).fill(title);
  await page.getByLabel("日期", { exact: true }).fill("2026-11-06");
  await page.getByLabel("发布状态").selectOption(status);
  if (kind !== "出游相册")
    await page
      .getByLabel("正文", { exact: true })
      .fill("第一段，演示文字。\n\n第二段，也是演示文字。");
}
async function save(page: Page) {
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/已保存|草稿已/);
}
async function diaryDesk(page: Page) {
  await hold(page, "d", 1400);
  await hold(page, "w", 1600);
  await expect(page.getByRole("button", { name: /翻开日记/ })).toBeEnabled();
  await page.keyboard.press("e");
}

test("drafts stay private to the editor; publishing and revisions appear at the diary desk", async ({
  page,
}) => {
  test.setTimeout(60000);
  await manager(page);
  await fillMemory(page, "日记", "演示：雨天的散步", "draft");
  await page.getByLabel("表达方").selectOption("her");
  await save(page);
  await game(page);
  await diaryDesk(page);
  await expect(
    page.getByRole("heading", { name: "先把这一页，留给我们" }),
  ).toBeVisible();
  await expect(page.getByText("演示：雨天的散步")).not.toBeVisible();
  await page.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await page.getByRole("link", { name: "手账台" }).click();
  await page
    .locator(".entry-select")
    .filter({ hasText: "演示：雨天的散步" })
    .click();
  await expect(page.getByLabel("表达方")).toHaveValue("her");
  await page.getByLabel("发布状态").selectOption("published");
  await save(page);
  await game(page, false);
  await diaryDesk(page);
  await page.getByRole("button", { name: /演示：雨天的散步/ }).click();
  await expect(
    page.getByText("第一段，演示文字。", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/2026-11-06 · 她对我说/)).toBeVisible();
  await page.getByRole("button", { name: "下一段" }).click();
  await page.getByRole("button", { name: "读完，回到小屋" }).click();
  await page.getByRole("link", { name: "手账台" }).click();
  await page
    .locator(".entry-select")
    .filter({ hasText: "演示：雨天的散步" })
    .click();
  await page
    .getByLabel("正文", { exact: true })
    .fill("修改后的第一段。\n\n修改后的第二段。");
  await save(page);
  await page.reload();
  await page
    .locator(".entry-select")
    .filter({ hasText: "演示：雨天的散步" })
    .click();
  await expect(page.getByLabel("正文", { exact: true })).toHaveValue(
    "修改后的第一段。\n\n修改后的第二段。",
  );
  await game(page, false);
  await diaryDesk(page);
  await page.getByRole("button", { name: /演示：雨天的散步/ }).click();
  await expect(page.getByText("1 / 2")).toBeVisible();
  await expect(
    page.getByText("修改后的第一段。", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("回看中", { exact: true })).not.toBeVisible();
  await page.screenshot({
    path: "test-results/custom-diary.png",
    fullPage: true,
  });
});

test("a multi-photo album can be reordered, exported and restored on an independent browser", async ({
  page,
  browser,
}) => {
  await manager(page);
  await fillMemory(page, "出游相册", "演示：两幅画的旅行");
  await page.getByLabel("地点（选填）").fill("演示画廊");
  await page
    .getByLabel("相册说明", { exact: true })
    .fill("用于验证相册的演示素材，不是真实出游。");
  await page
    .getByLabel("添加照片", { exact: true })
    .setInputFiles([
      path.resolve("public/art/monet-pixel.png"),
      path.resolve("public/art/van-gogh-pixel.png"),
    ]);
  await expect(page.getByRole("img", { name: /待保存照片/ })).toHaveCount(2);
  await page.getByLabel("第 1 张说明").fill("演示：睡莲");
  await page.getByLabel("第 2 张说明").fill("演示：卧室");
  await page.getByRole("button", { name: "上移照片 2", exact: true }).click();
  await expect(page.getByLabel("第 1 张说明")).toHaveValue("演示：卧室");
  await save(page);
  await page.reload();
  await page
    .locator(".entry-select")
    .filter({ hasText: "演示：两幅画的旅行" })
    .click();
  await expect(page.getByRole("img", { name: /待保存照片/ })).toHaveCount(2);
  await page.screenshot({
    path: "test-results/manager-album.png",
    fullPage: true,
  });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const download = await downloadEvent;
  const bytes = await readFile((await download.path())!);
  const backup = JSON.parse(bytes.toString());
  expect(backup.entries).toHaveLength(1);
  expect(backup.assets).toHaveLength(2);
  expect(backup.assets[0].data).toMatch(/^data:image\/webp;base64,/);
  expect(backup).not.toHaveProperty("reading");
  const fresh = await browser.newContext();
  const visitor = await fresh.newPage();
  await visitor.goto(`${new URL(page.url()).origin}/#manage`);
  await visitor.getByLabel("导入备份", { exact: true }).setInputFiles({
    name: "memories.json",
    mimeType: "application/json",
    buffer: bytes,
  });
  await expect(
    visitor.getByRole("heading", { name: "确认恢复这份备份？" }),
  ).toBeVisible();
  await visitor
    .getByRole("button", { name: "确认替换本机内容", exact: true })
    .click();
  await expect(visitor.getByRole("status")).toContainText("内容与照片已恢复");
  await game(visitor);
  await hold(visitor, "w", 2000);
  await expect(
    visitor.getByRole("button", { name: /翻翻出游相册/ }),
  ).toBeEnabled();
  await visitor.keyboard.press("e");
  await expect(
    visitor.getByRole("heading", { name: "演示：两幅画的旅行" }),
  ).toBeVisible();
  await expect(
    visitor.getByRole("img", { name: "演示：卧室", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      visitor
        .getByRole("img", { name: "演示：卧室", exact: true })
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(100);
  await visitor.getByRole("button", { name: "下一张" }).click();
  await expect(
    visitor.getByRole("img", { name: "演示：睡莲", exact: true }),
  ).toBeVisible();
  await visitor.screenshot({
    path: "test-results/custom-album.png",
    fullPage: true,
  });
  await visitor.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await visitor.reload();
  await visitor.getByRole("button", { name: /回忆册/ }).click();
  const albumCard = visitor
    .locator(".library-list article")
    .filter({ hasText: "演示：两幅画的旅行" });
  await expect(albumCard).toContainText("停在第 2 段");
  await albumCard.getByRole("button", { name: "继续阅读" }).click();
  await expect(
    visitor.getByRole("img", { name: "演示：睡莲", exact: true }),
  ).toBeVisible();
  await visitor.getByRole("button", { name: "关闭回忆", exact: true }).click();
  await visitor.getByRole("button", { name: /回忆册/ }).click();
  await visitor
    .getByRole("button", { name: "重新开始体验", exact: true })
    .click();
  await visitor
    .getByRole("button", { name: "确认重新开始", exact: true })
    .click();
  await expect(
    visitor.getByRole("heading", { name: "欢迎来到，我们的小小世界" }),
  ).toBeVisible();
  await visitor.goto(`${new URL(page.url()).origin}/#manage`);
  await expect(
    visitor.locator(".entry-select").filter({ hasText: "演示：两幅画的旅行" }),
  ).toBeVisible();
  await fresh.close();
});

test("both sides of the conversation can be published and found through the companion", async ({
  page,
}) => {
  await manager(page);
  await fillMemory(page, "说过的话", "演示：她给我的回应");
  await page.getByLabel("表达方").selectOption("her");
  await save(page);
  await game(page);
  await hold(page, "a", 690);
  await hold(page, "w", 400);
  await page.keyboard.press("e");
  await page.getByRole("button", { name: /演示：她给我的回应/ }).click();
  await expect(page.locator(".reader-dialogue")).toBeVisible();
  await expect(page.getByText(/2026-11-06 · 她对我说/)).toBeVisible();
  await expect(
    page.getByText("第一段，演示文字。", { exact: true }),
  ).toBeVisible();
});

test("unsafe files and invalid imports preserve existing content; deletion and unsaved edits require confirmation", async ({
  page,
}) => {
  await manager(page);
  await fillMemory(page, "说过的话", "演示：她的一句话");
  await save(page);
  await page.getByLabel("标题", { exact: true }).fill("尚未保存的标题");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "回到小屋" }).click();
  await expect(page.getByLabel("标题", { exact: true })).toHaveValue(
    "尚未保存的标题",
  );
  await expect.poll(() => new URL(page.url()).hash).toBe("#manage");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "＋ 新建出游相册", exact: true })
    .click();
  await page.getByLabel("添加照片", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a real image"),
  });
  await expect(page.getByRole("alert")).toContainText("无法读取这张图片");
  await expect(page.getByRole("img", { name: /待保存照片/ })).toHaveCount(0);
  await page.getByLabel("导入备份", { exact: true }).setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"our-little-world-memories","version":99}'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "备份版本不受支持" }),
  ).toBeVisible();
  await expect(
    page.locator(".entry-select").filter({ hasText: "演示：她的一句话" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "删除 演示：她的一句话", exact: true })
    .click();
  await expect(
    page.locator(".entry-select").filter({ hasText: "演示：她的一句话" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "删除 演示：她的一句话", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "删除 演示：她的一句话", exact: true }),
  ).not.toBeVisible();
});

test("a failed write reports failure and leaves the last committed diary intact", async ({
  page,
}) => {
  await manager(page);
  await fillMemory(page, "日记", "演示：已保存的版本");
  await save(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
  });
  await page.getByLabel("标题", { exact: true }).fill("不能假装保存的版本");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("内容未保存");
  await expect(page.getByText("尚未保存", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.locator(".entry-select").filter({ hasText: "演示：已保存的版本" }),
  ).toBeVisible();
  await expect(
    page.getByText("不能假装保存的版本", { exact: true }),
  ).not.toBeVisible();
});

test("concurrent saves cannot overwrite a newer revision and an import cannot replace a changed library", async ({
  page,
}) => {
  await manager(page);
  const result = await page.evaluate(async () => {
    const modulePath = "/src/memories/repository.ts";
    const { memoryRepository: repository } = await import(modulePath);
    const entry = {
      id: "concurrent",
      revision: "one",
      kind: "diary",
      status: "published",
      title: "原始内容",
      date: "2026-11-06",
      body: "演示",
      place: "",
      voice: "us",
      photos: [],
      updatedAt: new Date().toISOString(),
    };
    const original = await repository.save(entry, [], null);
    const results = await Promise.allSettled([
      repository.save(
        { ...entry, title: "第一个编辑", revision: "two" },
        [],
        "one",
      ),
      repository.save(
        { ...entry, title: "第二个编辑", revision: "three" },
        [],
        "one",
      ),
    ]);
    let importRejected = false;
    try {
      await repository.replace(
        { version: 1, revision: "import", entries: [], assets: [] },
        original.revision,
      );
    } catch {
      importRejected = true;
    }
    const current = await repository.load();
    return {
      states: results.map((result) => result.status),
      count: current.entries.length,
      importRejected,
    };
  });
  expect(result.states.sort()).toEqual(["fulfilled", "rejected"]);
  expect(result.count).toBe(1);
  expect(result.importRejected).toBe(true);
});

test("the editor remains within the phone viewport and supports photo removal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await manager(page);
  await fillMemory(page, "出游相册", "演示：手机相册", "draft");
  await page
    .getByLabel("添加照片", { exact: true })
    .setInputFiles(path.resolve("public/art/monet-pixel.png"));
  await expect(page.getByRole("img", { name: "待保存照片 1" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(360);
  await page.screenshot({
    path: "test-results/manager-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "移除照片 1", exact: true }).click();
  await expect(page.getByRole("img", { name: /待保存照片/ })).toHaveCount(0);
  await save(page);
});

const validEntry: MemoryEntry = {
  id: "sample",
  revision: "revision",
  title: "演示",
  kind: "diary",
  status: "published",
  date: "2026-11-06",
  body: "正文",
  voice: "us",
  place: "",
  photos: [],
  updatedAt: "2026-11-06T00:00:00Z",
};
test("content boundaries reject invalid dates, missing images and duplicate IDs; drafts never become playable stories", () => {
  expect(() => validateEntry({ ...validEntry, date: "2026-02-30" })).toThrow(
    "有效日期",
  );
  expect(() => validateEntry({ ...validEntry, title: " " })).toThrow("标题");
  expect(() =>
    validateArchive({
      version: 1,
      revision: "valid",
      entries: [validEntry, validEntry],
      assets: [],
    }),
  ).toThrow("编号重复");
  expect(() =>
    validateArchive({
      version: 1,
      revision: "valid",
      entries: [
        {
          ...validEntry,
          kind: "album",
          photos: [{ id: "missing", caption: "" }],
        },
      ],
      assets: [],
    }),
  ).toThrow("缺失");
  const catalog = buildCatalog(
    {
      version: 1,
      revision: "valid",
      entries: [validEntry, { ...validEntry, id: "draft", status: "draft" }],
      assets: [],
    },
    {},
  );
  expect(catalog.collections.diary).toContain(
    memoryStoryId("sample", "revision"),
  );
  expect(catalog.stories[memoryStoryId("draft", "revision")]).toBeUndefined();
});
