import { describe, expect, it } from "vitest";
import { jobQueue } from "@/lib/db/schema";

describe("db schema", () => {
  it("exposes the job queue table", () => {
    expect(jobQueue).toBeDefined();
  });
});
