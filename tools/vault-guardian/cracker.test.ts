import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

describe("The Vault Guardian Cracker Suite", () => {
  const payloadPath = path.resolve("tools", "vault-guardian", "payloads.json");

  it("ensures payloads.json exists and contains valid injection vectors", () => {
    expect(existsSync(payloadPath)).toBe(true);
    const vectors = JSON.parse(readFileSync(payloadPath, "utf-8"));

    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBeGreaterThanOrEqual(5);

    for (const vector of vectors) {
      expect(vector.id).toMatch(/^J-\d{2}$/);
      expect(vector.name).toBeTruthy();
      expect(vector.category).toBeTruthy();
      expect(vector.payload.length).toBeGreaterThan(20);
    }
  });
});
