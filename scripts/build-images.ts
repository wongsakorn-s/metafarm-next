import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const pictureDirectory = path.resolve("public/pictures");
const sources = (await readdir(pictureDirectory)).filter((file) => file.toLowerCase().endsWith(".png"));

for (const source of sources) {
  const input = path.join(pictureDirectory, source);
  const { width } = await sharp(input).metadata();
  if (!width) throw new Error(`อ่านขนาดรูปไม่ได้: ${source}`);
  const name = path.parse(source).name;
  for (const targetWidth of [192, width]) {
    for (const format of ["avif", "webp"] as const) {
      await sharp(input)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .toFormat(format, format === "avif" ? { quality: 55 } : { quality: 75 })
        .toFile(path.join(pictureDirectory, `${name}-${targetWidth}.${format}`));
    }
  }
}

console.log(`Optimized ${sources.length} farm pictures`);
