import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "./model";

/** Decode actual pixels, not just a filename; never accept SVG or executable document formats. */
export async function decodePhoto(blob: Blob): Promise<HTMLImageElement> {
  if (
    !IMAGE_TYPES.includes(blob.type) ||
    !blob.size ||
    blob.size > MAX_IMAGE_BYTES
  )
    throw new Error("请使用不超过 10 MiB 的 JPEG、PNG 或 WebP 图片");
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const signature = String.fromCharCode(...header);
  const matches =
    blob.type === "image/png"
      ? header[0] === 137 && signature.slice(1, 8) === "PNG\r\n\x1a\n"
      : blob.type === "image/jpeg"
        ? header[0] === 255 && header[1] === 216 && header[2] === 255
        : signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP";
  if (!matches) throw new Error("无法读取这张图片：文件内容与图片格式不一致");
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 80_000_000
    )
      throw new Error("图片尺寸过大，请先缩小后再添加");
    return image;
  } catch (error) {
    if (error instanceof Error && error.message.includes("尺寸过大"))
      throw error;
    throw new Error("无法读取这张图片，请确认文件完整且为 JPEG、PNG 或 WebP");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function preparePhoto(blob: Blob): Promise<Blob> {
  const image = await decodePhoto(blob);
  const scale = Math.min(
    1,
    1920 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器暂时无法处理图片，请换一个浏览器重试");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!result) throw new Error("图片处理失败，请重试");
  return result;
}
