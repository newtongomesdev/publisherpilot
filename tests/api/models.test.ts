import { describe, expect, it } from "vitest";
import { normalizeOpenRouterModel } from "@/lib/ai/providers/openrouter";

describe("normalizeOpenRouterModel", () => {
  it("keeps id and name for UI use", () => {
    const model = normalizeOpenRouterModel({ id: "openai/gpt-4o-mini", name: "GPT-4o Mini" });

    expect(model.modelId).toBe("openai/gpt-4o-mini");
    expect(model.name).toBe("GPT-4o Mini");
  });
});
