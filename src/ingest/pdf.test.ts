import { describe, it, expect } from "vitest";
import { isDirectImage, isPdfFile, prepareInvoiceForExtraction } from "./pdf.js";

describe("ingest/pdf and image preprocessor", () => {
  it("reconoce extensiones de imágenes directas", () => {
    expect(isDirectImage("factura.png")).toBe(true);
    expect(isDirectImage("factura.JPG")).toBe(true);
    expect(isDirectImage("factura.jpeg")).toBe(true);
    expect(isDirectImage("factura.webp")).toBe(true);
    expect(isDirectImage("factura.pdf")).toBe(false);
    expect(isDirectImage("factura.csv")).toBe(false);
  });

  it("reconoce archivos PDF", () => {
    expect(isPdfFile("documento.pdf")).toBe(true);
    expect(isPdfFile("DOCUMENTO.PDF")).toBe(true);
    expect(isPdfFile("documento.png")).toBe(false);
  });

  it("retorna la ruta original si el archivo ya es una imagen directa", async () => {
    const p = "data/facturas/FAC-0001.jpg";
    const res = await prepareInvoiceForExtraction(p);
    expect(res).toBe(p);
  });
});
