import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
const where = vi.fn(() => ({ limit }));
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));

vi.mock("@/lib/db/client", () => ({
  db: {
    select,
  },
}));

describe("getArticleProjectById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a single row instead of an array", async () => {
    const row = { id: "project-1", topic: "Topic" };
    limit.mockResolvedValueOnce([row]);

    const { getArticleProjectById } = await import("@/lib/db/queries");
    const result = await getArticleProjectById("project-1");

    expect(result).toEqual(row);
  });
});
