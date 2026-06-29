import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCurrentUser = vi.fn();
const requireCurrentWorkspace = vi.fn();
const getDefaultWorkspaceByUser = vi.fn();
const getArticleProjectById = vi.fn();
const deleteGeneratedArticlesByProjectId = vi.fn();
const updateArticleProjectStatus = vi.fn();
const createJob = vi.fn();
const createJobRecord = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUser,
}));

vi.mock("@/lib/workspaces/session", () => ({
  requireCurrentWorkspace,
}));

vi.mock("@/lib/db/queries", () => ({
  getDefaultWorkspaceByUser,
  getArticleProjectById,
  deleteGeneratedArticlesByProjectId,
  updateArticleProjectStatus,
  createJob,
}));

vi.mock("@/lib/jobs/queue", () => ({
  createJobRecord,
}));

describe("PATCH /api/articles/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));

    requireCurrentUser.mockResolvedValue({ id: "user_1" });
    requireCurrentWorkspace.mockResolvedValue({ id: "workspace_1" });
    getArticleProjectById.mockResolvedValue({
      id: "article_1",
      topic: "The Smiths",
      niche: "musica",
      searchProvider: "duckduckgo",
      sourceCount: 5,
    });
    createJobRecord.mockImplementation((type, payload) => ({ type, payload }));
    createJob.mockResolvedValue({ id: "job_1" });
  });

  it("regenera um artigo existente e cria um novo search job", async () => {
    const { PATCH } = await import("@/app/api/articles/[id]/route");

    const request = new Request("http://localhost/api/articles/article_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "article_1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(deleteGeneratedArticlesByProjectId).toHaveBeenCalledWith("article_1");
    expect(updateArticleProjectStatus).toHaveBeenCalledWith("article_1", "draft", null);
    expect(createJobRecord).toHaveBeenCalledWith(
      "search",
      expect.objectContaining({
        articleProjectId: "article_1",
        imageProviders: expect.arrayContaining(["sources", "wikimedia", "openverse"]),
      }),
    );
    expect(createJob).toHaveBeenCalledTimes(1);
  });
});
