import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layoutPath = path.resolve(__dirname, "../../app/layout.tsx");

describe("root layout font configuration", () => {
  it("does not depend on next/font/google during build", () => {
    const source = fs.readFileSync(layoutPath, "utf8");

    expect(source).not.toContain('from "next/font/google"');
    expect(source).not.toContain("Inter(");
    expect(source).not.toContain("--font-inter");
  });
});
