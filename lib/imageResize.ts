/**
 * Client-side image downscaling before upload.
 *
 * Phone photos are often 3-8 MB; we resize to at most `maxDimension` px on the
 * longest side and re-encode as JPEG. Drawing to a canvas also applies the
 * EXIF orientation (modern browsers) and drops EXIF metadata such as GPS.
 */
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

export async function resizeImage(
  file: File,
  { maxDimension = 1280, quality = 0.8 }: { maxDimension?: number; quality?: number } = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo (JPG, PNG, WEBP or HEIC).");
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error("That photo is too large. Please choose one under 15 MB.");

  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this photo.");
  // White background so transparent PNGs don't turn black as JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap.source, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Your browser couldn't process this photo.");
  return blob;
}

async function loadImage(
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // fall back to <img> (e.g. formats createImageBitmap can't decode)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This photo format isn't supported by your browser. Please try a JPG or PNG."));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    // Revoke after the image has decoded
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
