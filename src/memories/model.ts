export type MemoryKind = "diary" | "words" | "album";
export type Voice = "me" | "her" | "us";
export interface MemoryPhoto {
  id: string;
  caption: string;
}
export interface MemoryEntry {
  id: string;
  revision: string;
  kind: MemoryKind;
  status: "draft" | "published";
  title: string;
  date: string;
  body: string;
  place: string;
  voice: Voice;
  photos: MemoryPhoto[];
  updatedAt: string;
}
export interface PhotoAsset {
  id: string;
  blob: Blob;
}
export interface MemoryArchive {
  version: 1;
  revision: string;
  entries: MemoryEntry[];
  assets: PhotoAsset[];
}
export const kindNames: Record<MemoryKind, string> = {
  diary: "日记",
  words: "说过的话",
  album: "出游相册",
};
export const voiceNames: Record<Voice, string> = {
  me: "我想对她说",
  her: "她对我说",
  us: "我们一起记下",
};
export const MAX_PHOTOS = 20;
export const MAX_ENTRIES = 1000;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_LIBRARY_BYTES = 60 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 90 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function emptyArchive(): MemoryArchive {
  return { version: 1, revision: "empty", entries: [], assets: [] };
}

function boundedText(value: unknown, name: string, limit: number): string {
  if (typeof value !== "string" || value.length > limit)
    throw new Error(`${name}格式不正确或过长`);
  return value;
}

function identifier(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value))
    throw new Error("内容编号格式不正确");
  return value;
}

/** Validate at the repository boundary as well as in the editor: backups are untrusted input. */
export function validateEntry(value: unknown): MemoryEntry {
  if (!value || typeof value !== "object") throw new Error("内容格式不正确");
  const entry = value as Record<string, unknown>;
  if (
    !["diary", "words", "album"].includes(String(entry.kind)) ||
    !["draft", "published"].includes(String(entry.status)) ||
    !["me", "her", "us"].includes(String(entry.voice))
  )
    throw new Error("内容类型、状态或表达方不正确");
  const title = boundedText(entry.title, "标题", 80).trim();
  const date = boundedText(entry.date, "日期", 10);
  if (!title) throw new Error("请填写标题");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  )
    throw new Error("请填写有效日期");
  if (!Array.isArray(entry.photos) || entry.photos.length > MAX_PHOTOS)
    throw new Error(`每本相册最多 ${MAX_PHOTOS} 张照片`);
  const photos = entry.photos.map((photo: unknown) => {
    if (!photo || typeof photo !== "object") throw new Error("照片信息不正确");
    const item = photo as Record<string, unknown>;
    return {
      id: identifier(item.id),
      caption: boundedText(item.caption, "照片说明", 500),
    };
  });
  if (new Set(photos.map((photo) => photo.id)).size !== photos.length)
    throw new Error("照片编号重复");
  if (entry.kind !== "album" && photos.length)
    throw new Error("日记与话语不能附带相册照片");
  const body = boundedText(entry.body, "正文", 20000);
  if (
    entry.status === "published" &&
    (entry.kind === "album" ? !photos.length : !body.trim())
  )
    throw new Error(
      entry.kind === "album"
        ? "发布相册前请至少添加一张照片"
        : "发布前请填写正文",
    );
  const updatedAt = boundedText(entry.updatedAt, "修改时间", 40);
  if (!Number.isFinite(Date.parse(updatedAt)))
    throw new Error("修改时间不正确");
  return {
    id: identifier(entry.id),
    revision: identifier(entry.revision),
    kind: entry.kind as MemoryKind,
    status: entry.status as MemoryEntry["status"],
    voice: entry.voice as Voice,
    title,
    date,
    body,
    place: boundedText(entry.place, "地点", 120),
    photos,
    updatedAt,
  };
}

export function validateArchive(value: MemoryArchive): MemoryArchive {
  if (
    value.version !== 1 ||
    !Array.isArray(value.entries) ||
    !Array.isArray(value.assets)
  )
    throw new Error("不支持的内容格式版本");
  if (
    value.entries.length > MAX_ENTRIES ||
    value.assets.length > MAX_ENTRIES * MAX_PHOTOS
  )
    throw new Error("内容数量超出上限");
  const entries = value.entries.map(validateEntry);
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
    throw new Error("内容编号重复");
  const assets = new Map<string, PhotoAsset>();
  let totalBytes = 0;
  for (const asset of value.assets) {
    const id = identifier(asset.id);
    if (assets.has(id)) throw new Error("图片附件编号重复");
    if (
      !(asset.blob instanceof Blob) ||
      !IMAGE_TYPES.includes(asset.blob.type) ||
      asset.blob.size > MAX_IMAGE_BYTES ||
      !asset.blob.size
    )
      throw new Error("图片附件格式或大小不正确");
    totalBytes += asset.blob.size;
    assets.set(id, { id, blob: asset.blob });
  }
  if (totalBytes > MAX_LIBRARY_BYTES)
    throw new Error("当前版本图片总量最多 60 MiB，请分批保留备份");
  // Every accepted library must fit into a backup that this version can import again.
  const backupEstimate =
    new Blob([JSON.stringify(entries)]).size +
    Math.ceil((totalBytes * 4) / 3) +
    assets.size * 256 +
    1024;
  if (backupEstimate > MAX_BACKUP_BYTES)
    throw new Error("内容已接近单份备份上限，请减少正文或照片后保存");
  const referenced = new Set(
    entries.flatMap((entry) => entry.photos.map((photo) => photo.id)),
  );
  for (const id of referenced)
    if (!assets.has(id)) throw new Error("内容引用了缺失的图片附件");
  return {
    version: 1,
    revision: identifier(value.revision),
    entries,
    assets: [...assets.values()].filter((asset) => referenced.has(asset.id)),
  };
}
