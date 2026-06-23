import { describe, expect, it } from "vitest";
import { jobQueue } from "@/lib/db/schema";
import { createJobPayload } from "@/lib/jobs/queue";

describe("job queue helpers", () => {
  it("exposes the job queue table", () => {
    expect(jobQueue).toBeDefined();
  });

  it("serializes payloads for persistence", () => {
    const payload = createJobPayload({ articleProjectId: "article_1", format: "markdown" });

    expect(payload).toContain("article_1");
    expect(payload).toContain("markdown");
  });
});
