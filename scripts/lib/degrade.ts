import sharp from "sharp";
import type { Rng } from "./rng.js";

/**
 * Simula una foto de factura tomada con celular en mal estado:
 * rotacion leve, blur, variacion de brillo y compresion JPEG agresiva
 * (la compresion agresiva es lo que aporta el "ruido"/artefactos de bloque).
 */
export async function degrade(pngBuffer: Buffer, rng: Rng): Promise<Buffer> {
  const angle = rng.float() * 8 - 4; // -4..4 grados
  const blurSigma = 0.5 + rng.float() * 1.3;
  const brightness = 0.85 + rng.float() * 0.3;
  const quality = 30 + Math.floor(rng.float() * 25); // 30-55

  return sharp(pngBuffer)
    .rotate(angle, { background: "#ffffff" })
    .modulate({ brightness })
    .blur(blurSigma)
    .jpeg({ quality, chromaSubsampling: "4:2:0" })
    .toBuffer();
}
