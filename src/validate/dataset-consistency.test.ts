import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { validate } from "./index.js";
import type { Invoice } from "../types.js";

/**
 * Prueba que el dataset generado (data/ground_truth.json) y validate()
 * estan de acuerdo: las facturas con un problema de negocio inyectado
 * deben fallar, y las sanas deben pasar.
 *
 * Se salta si el dataset no fue generado (corre `npm run gen:dataset`).
 */
const gtPath = path.resolve("data/ground_truth.json");
const hasDataset = existsSync(gtPath);

interface GtEntry {
  file: string;
  invoice: Invoice;
  meta: { designIndex: number; degraded: boolean; issue: string | null };
}

describe.skipIf(!hasDataset)("validate() contra el dataset generado", () => {
  // skipIf solo salta los it() de abajo; vitest igual ejecuta el cuerpo del describe durante la
  // coleccion de tests, asi que leer el archivo sin el guard de hasDataset revienta con ENOENT
  // en un clon limpio que aun no corrio `npm run gen:dataset`.
  const entries: GtEntry[] = hasDataset ? JSON.parse(readFileSync(gtPath, "utf-8")) : [];

  it("tiene 40 facturas", () => {
    expect(entries).toHaveLength(40);
  });

  it("las facturas sin problema inyectado pasan validate()", () => {
    const sanas = entries.filter((e) => e.meta.issue === null);
    const fallidas = sanas.filter((e) => !validate(e.invoice).ok);
    expect(fallidas.map((e) => e.file)).toEqual([]);
  });

  it("las facturas con NIT invalido son detectadas", () => {
    const conNitMalo = entries.filter((e) => e.meta.issue === "nit_invalido");
    expect(conNitMalo.length).toBeGreaterThan(0);
    for (const e of conNitMalo) {
      const result = validate(e.invoice);
      expect(result.ok).toBe(false);
      expect(result.errors.some((err) => err.toLowerCase().includes("nit"))).toBe(true);
    }
  });

  it("las facturas con descuadre grande son detectadas", () => {
    const conDescuadre = entries.filter((e) => e.meta.issue === "descuadre_grande");
    expect(conDescuadre.length).toBeGreaterThan(0);
    for (const e of conDescuadre) {
      expect(validate(e.invoice).ok).toBe(false);
    }
  });

  it("un descuadre menor (<=$2) no se marca como error", () => {
    const conDescuadreMenor = entries.filter((e) => e.meta.issue === "descuadre_menor");
    for (const e of conDescuadreMenor) {
      expect(validate(e.invoice).ok).toBe(true);
    }
  });
});
