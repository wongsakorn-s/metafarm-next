import { th } from "../i18n/th";

const MAX_SOURCE_BYTES = 10_000_000;
const MAX_UPLOAD_BYTES = 2_000_000;
const MAX_DIMENSION = 1200;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(th.common.imageConvertFailed))),
      "image/jpeg",
      quality,
    );
  });
}

async function decodeImage(file: File): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    };
  } catch (cause) {
    URL.revokeObjectURL(url);
    throw cause;
  }
}

export async function prepareImage(file: File): Promise<File> {
  if (!SUPPORTED_TYPES.includes(file.type) || file.size === 0) {
    throw new Error(th.common.imageTypeInvalid);
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(th.common.imageSourceTooLarge);
  }

  let decoded: Awaited<ReturnType<typeof decodeImage>>;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw new Error(th.common.imageOpenFailed);
  }

  try {
    if (!decoded.width || !decoded.height) throw new Error(th.common.imageInvalid);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error(th.common.imageResizeUnsupported);

    for (const maxDimension of [MAX_DIMENSION, 1000, 800, 600]) {
      const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.7, 0.55]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= MAX_UPLOAD_BYTES) {
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
            type: "image/jpeg",
          });
        }
      }
    }
    throw new Error(th.common.imageUploadTooLarge);
  } finally {
    decoded.dispose();
  }
}
