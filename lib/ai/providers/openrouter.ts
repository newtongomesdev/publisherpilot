import { env } from "@/lib/env";
import type { AiModelSummary, AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { generatedArticleSchema } from "@/lib/article/validator";

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: Record<string, unknown>;
};

export function normalizeOpenRouterModel(input: OpenRouterModel) {
  return {
    modelId: input.id,
    name: input.name ?? input.id,
    slug: input.id,
    contextWindow: input.context_length,
    pricing: input.pricing,
  } satisfies AiModelSummary;
}

export class OpenRouterProvider implements AiProvider {
  name = "openrouter";

  async listModels() {
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/models`, {
      headers: env.OPENROUTER_API_KEY ? { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` } : {},
    });

    const payload = (await response.json()) as { data?: OpenRouterModel[] };
    return (payload.data ?? []).map(normalizeOpenRouterModel);
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.OPENROUTER_SITE_URL,
        "X-Title": env.OPENROUTER_APP_NAME,
      },
      body: JSON.stringify({
        model: options.model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature,
      }),
    });

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";

    return generatedArticleSchema.parse(JSON.parse(raw));
  }
}
