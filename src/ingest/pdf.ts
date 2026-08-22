import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Determina si el archivo es un formato de imagen soportado directamente por QVAC.
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
 * Prepara un archivo de factura para ser ingerido por el modelo de visión.
 * Si es una imagen (.png/.jpg), retorna su ruta directamente.
 * Si es SVG o formato vectorial, lo renderiza a PNG de alta resolución.
 */
export async function prepareInvoiceForExtraction(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (isDirectImage(filePath)) {
    return filePath;
  }

  if (ext === ".svg") {
    const svgBuffer = await readFile(filePath);
    const outDir = path.resolve("out", "temp_images");
    await mkdir(outDir, { recursive: true });
    const pngPath = path.join(outDir, `${path.basename(filePath, ext)}.png`);
    await sharp(svgBuffer).png({ quality: 90 }).toFile(pngPath);
    return pngPath;
  }

  // Si no es un formato soportado, retorna la ruta para que el extractor lo maneje o reporte error
  return filePath;
}
