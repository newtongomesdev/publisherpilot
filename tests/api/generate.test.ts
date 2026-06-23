import { describe, expect, it } from "vitest";
import { enqueueGenerateSchema } from "@/app/api/generate/schema";

describe("enqueueGenerateSchema", () => {
  it("requires an articleProjectId", () => {
    expect(enqueueGenerateSchema.safeParse({ articleProjectId: "article_1" }).success).toBe(true);
  });
});
