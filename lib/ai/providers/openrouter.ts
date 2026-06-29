import { env } from "@/lib/env";
import type { AiModelSummary, AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { resolveProviderConfig } from "@/lib/integrations/provider-config";
import { generatedArticleSchema } from "@/lib/article/validator";
import { logApiUsage } from "@/lib/ai/usage-tracker";

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: Record<string, unknown>;
};

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: OpenRouterUsage;
  error?: { message?: string; code?: number };
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

function recordUsage(
  payload: OpenRouterResponse,
  model: string,
  operation: string,
  options: GenerateArticleOptions,
) {
  const usage = payload.usage;
  if (!usage) return;

  logApiUsage({
    provider: "openrouter",
    model,
    operation,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
    costUsd: usage.cost ?? 0,
    userId: options.userId,
  }).catch(() => {});
}

export class OpenRouterProvider implements AiProvider {
  name = "openrouter";

  async listModels(userId?: string) {
    const config = await resolveProviderConfig(this.name, userId);
    const response = await fetch(`${config.baseUrl || env.OPENROUTER_BASE_URL}/models`, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
    });

    const payload = (await response.json()) as { data?: OpenRouterModel[] };
    return (payload.data ?? []).map(normalizeOpenRouterModel);
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const config = await resolveProviderConfig(this.name, options.userId);
    const response = await fetch(`${config.baseUrl || env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey ?? env.OPENROUTER_API_KEY ?? ""}`,
        "HTTP-Referer": String(config.metadata?.siteUrl ?? env.OPENROUTER_SITE_URL),
        "X-Title": String(config.metadata?.appName ?? env.OPENROUTER_APP_NAME),
      },
      body: JSON.stringify({
        model: options.model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature,
        usage: { include: true },
      }),
    });

    const payload = (await response.json()) as OpenRouterResponse;

    if (payload.error) {
      throw new Error(`OpenRouter API error: ${payload.error.message || JSON.stringify(payload.error)}`);
    }

    recordUsage(payload, options.model, "generateArticle", options);

    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    console.log("[openrouter] Raw response length:", raw.length);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[openrouter] Failed to parse JSON response:", raw.slice(0, 500));
      throw new Error(`A IA nao retornou JSON valido. Resposta: ${raw.slice(0, 200)}`);
    }

    const result = generatedArticleSchema.safeParse(parsed);
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
      console.error("[openrouter] Schema validation failed. Missing:", missing);
      throw new Error(`A IA retornou JSON incompleto. Campos faltando: ${missing}`);
    }
    return result.data;
  }

  async generateText(prompt: string, options: GenerateArticleOptions) {
    const config = await resolveProviderConfig(this.name, options.userId);
    const response = await fetch(`${config.baseUrl || env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey ?? env.OPENROUTER_API_KEY ?? ""}`,
        "HTTP-Referer": String(config.metadata?.siteUrl ?? env.OPENROUTER_SITE_URL),
        "X-Title": String(config.metadata?.appName ?? env.OPENROUTER_APP_NAME),
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.7,
        usage: { include: true },
      }),
    });

    const payload = (await response.json()) as OpenRouterResponse;

    if (payload.error) {
      throw new Error(`OpenRouter API error: ${payload.error.message || JSON.stringify(payload.error)}`);
    }

    recordUsage(payload, options.model, "generateText", options);

    return payload.choices?.[0]?.message?.content ?? "";
  }
}
