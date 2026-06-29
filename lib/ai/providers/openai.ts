import { env } from "@/lib/env";
import type { AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { resolveProviderConfig } from "@/lib/integrations/provider-config";
import { generatedArticleSchema } from "@/lib/article/validator";

type OpenAIModel = {
  id: string;
};

export class OpenAIProvider implements AiProvider {
  name = "openai";

  async listModels(userId?: string) {
    const config = await resolveProviderConfig(this.name, userId);
    const response = await fetch(`${config.baseUrl || env.OPENAI_BASE_URL}/models`, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
    });

    const payload = (await response.json()) as { data?: OpenAIModel[] };
    return (payload.data ?? []).map((item) => ({
      modelId: item.id,
      name: item.id,
      slug: item.id,
    }));
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const config = await resolveProviderConfig(this.name, options.userId);
    const response = await fetch(`${config.baseUrl || env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey ?? env.OPENAI_API_KEY ?? ""}`,
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

  async generateText(prompt: string, options: GenerateArticleOptions) {
    const config = await resolveProviderConfig(this.name, options.userId);
    const response = await fetch(`${config.baseUrl || env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey ?? env.OPENAI_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.7,
      }),
    });

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content ?? "";
  }
}
