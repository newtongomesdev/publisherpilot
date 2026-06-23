import { env } from "@/lib/env";
import type { AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { generatedArticleSchema } from "@/lib/article/validator";

type OpenAIModel = {
  id: string;
};

export class OpenAIProvider implements AiProvider {
  name = "openai";

  async listModels() {
    const response = await fetch(`${env.OPENAI_BASE_URL}/models`, {
      headers: env.OPENAI_API_KEY ? { Authorization: `Bearer ${env.OPENAI_API_KEY}` } : {},
    });

    const payload = (await response.json()) as { data?: OpenAIModel[] };
    return (payload.data ?? []).map((item) => ({
      modelId: item.id,
      name: item.id,
      slug: item.id,
    }));
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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
