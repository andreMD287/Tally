import type { ExtractFn } from "../types.js";
import { mockExtract } from "./mock.js";

/**
 * Punto de entrada estable para el resto del pipeline.
 * A: cuando la extraccion real con QVAC este lista, cambia este export
 * (o el contenido de mockExtract) sin que B tenga que tocar cli.ts.
 */
export const extract: ExtractFn = mockExtract;
