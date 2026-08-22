import path from "node:path";
import { readFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Determina si el archivo es un formato de imagen soportado directamente.
 */
export function isDirectImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.has(ext);
}

/**
 * Determina si el archivo es un PDF.
 */
export function isPdfFile(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === ".pdf";
}

/**
 * Prepara y optimiza un archivo de factura para el modelo de visión:
 * 1. Auto-orienta según metadatos EXIF del celular (.rotate()).
 * 2. Normaliza dimensiones para inferencia óptima en VLM (max 1600px).
 * 3. Renderiza SVG/vectoriales a PNG de alta definición.
 */
export async function prepareInvoiceForExtraction(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const outDir = path.resolve("out", "preprocessed_images");
  await mkdir(outDir, { recursive: true });

  const baseName = path.basename(filePath, ext);
  const targetPath = path.join(outDir, `${baseName}_optimized.jpg`);

  try {
    if (isDirectImage(filePath)) {
      // Normalizar orientación EXIF del celular y reescalar si es gigante
      await sharp(filePath)
        .rotate() // Auto-rotate basado en EXIF del celular
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(targetPath);
      return targetPath;
    }

    if (ext === ".svg") {
      const svgBuffer = await readFile(filePath);
      const pngPath = path.join(outDir, `${baseName}.png`);
      await sharp(svgBuffer).png({ quality: 90 }).toFile(pngPath);
      return pngPath;
    }
  } catch (err) {
    console.warn(`[WARN] No se pudo preprocesar imagen con sharp (${filePath}):`, err);
    return filePath;
  }

  return filePath;
}
