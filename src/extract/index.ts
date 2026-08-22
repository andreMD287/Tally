import type { ExtractFn } from "../types.js";
import { mockExtract } from "./mock.js";
import { qvacExtract } from "./qvac.js";

export { mockExtract, qvacExtract };

let currentExtractor: ExtractFn =
  process.env.USE_QVAC === "true" || process.env.EXTRACTOR === "qvac"
    ? qvacExtract
    : mockExtract;

export function setExtractor(fn: ExtractFn) {
  currentExtractor = fn;
}

export const extract: ExtractFn = async (imagePath) => {
  return currentExtractor(imagePath);
};
