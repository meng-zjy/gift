import {
  MAX_BACKUP_BYTES,
  MAX_LIBRARY_BYTES,
  MAX_IMAGE_BYTES,
  MAX_ENTRIES,
  MAX_PHOTOS,
  validateArchive,
  type MemoryArchive,
  type PhotoAsset,
} from "./model";
import { decodePhoto } from "./images";

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("备份图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

/** A portable archive contains content and image bytes, never the recipient's reading cursor. */
export async function exportBackup(archive: MemoryArchive): Promise<Blob> {
  const checked = validateArchive(archive);
  const assets = await Promise.all(
    checked.assets.map(async (asset) => ({
      id: asset.id,
      data: await blobToDataURL(asset.blob),
    })),
  );
  return new Blob(
    [
      JSON.stringify({
        format: "our-little-world-memories",
        version: 2,
        exportedAt: new Date().toISOString(),
        entries: checked.entries,
        assets,
      }),
    ],
    { type: "application/json" },
  );
}

export async function importBackup(file: File): Promise<MemoryArchive> {
  if (file.size > MAX_BACKUP_BYTES)
    throw new Error("备份文件过大，当前最多支持 90 MiB");
  let source;
  try {
    source = JSON.parse(await file.text());
  } catch {
    throw new Error("无法解析备份，请选择导出的完整 JSON 文件");
  }
  if (
    !source ||
    source.format !== "our-little-world-memories" ||
    ![1, 2].includes(source.version) ||
    !Array.isArray(source.entries) ||
    !Array.isArray(source.assets)
  )
    throw new Error("这不是支持的小屋内容备份，或备份版本不受支持");
  if (
    source.entries.length > MAX_ENTRIES ||
    source.assets.length > MAX_ENTRIES * MAX_PHOTOS
  )
    throw new Error("备份中的内容数量过多");
  const assets: PhotoAsset[] = [];
  let totalBytes = 0;
  for (const asset of source.assets) {
    if (
      !asset ||
      typeof asset.id !== "string" ||
      typeof asset.data !== "string"
    )
      throw new Error("备份中的图片信息不完整");
    const match =
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(
        asset.data,
      );
    if (!match || match[2].length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4)
      throw new Error("备份中的图片格式或大小不正确");
    let decoded;
    try {
      decoded = atob(match[2]);
    } catch {
      throw new Error("备份图片编码已损坏");
    }
    const bytes = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0),
    );
    totalBytes += bytes.length;
    if (totalBytes > MAX_LIBRARY_BYTES)
      throw new Error("备份图片总量超过 60 MiB");
    const blob = new Blob([bytes], { type: match[1] });
    await decodePhoto(blob);
    assets.push({ id: asset.id, blob });
  }
  return validateArchive({
    version: 1,
    revision: "import",
    entries: source.entries,
    assets,
  });
}
