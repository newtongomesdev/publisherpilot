import { resolveProviderConfig, resolvePublishTargetConfig } from "@/lib/integrations/provider-config";
import type { GeneratedArticle } from "@/lib/article/types";
import type { PublisherConnector, PublisherResult } from "@/lib/publishers/types";

export const wordpressPublisher: PublisherConnector = {
  name: "wordpress",
  label: "WordPress",
  async validateConfig(userId?: string) {
    const provider = await resolveProviderConfig("wordpress", userId);
    const target = await resolvePublishTargetConfig("wordpress", userId);
    const username = String(provider.metadata?.username ?? "");
    const appPassword = String(provider.metadata?.appPassword ?? provider.apiKey ?? "");
    const siteUrl = String(target?.config?.siteUrl ?? provider.baseUrl ?? "");

    if (!siteUrl || !username || !appPassword) {
      return { ok: false, reason: "Credenciais do WordPress ausentes." };
    }

    if (!target) {
      return { ok: false, reason: "Destino de publicacao do WordPress ausente." };
    }

    return { ok: true };
  },
  async publish(article: GeneratedArticle, userId?: string): Promise<PublisherResult> {
    const provider = await resolveProviderConfig("wordpress", userId);
    const target = await resolvePublishTargetConfig("wordpress", userId);
    const username = String(provider.metadata?.username ?? "");
    const appPassword = String(provider.metadata?.appPassword ?? provider.apiKey ?? "");
    const siteUrl = String(target?.config?.siteUrl ?? provider.baseUrl ?? "");
    const publishStatus = String(target?.config?.status ?? "draft");

    if (!siteUrl || !username || !appPassword) {
      throw new Error("Credenciais do WordPress ausentes.");
    }

    if (!target) {
      throw new Error("Destino de publicacao do WordPress ausente.");
    }

    const endpoint = `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`;
    const content = [
      `<p>${article.intro}</p>`,
      ...article.sections.map((section) => `<h2>${section.heading}</h2><p>${section.body}</p>`),
      article.faq.length
        ? `<h2>Perguntas frequentes</h2>${article.faq
            .map((item) => `<h3>${item.question}</h3><p>${item.answer}</p>`)
            .join("")}`
        : "",
      `<p>${article.conclusion}</p>`,
    ]
      .filter(Boolean)
      .join("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`,
      },
      body: JSON.stringify({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content,
        status: publishStatus,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao publicar no WordPress: ${errorText}`);
    }

    const payload = (await response.json()) as {
      id: number | string;
      status: string;
      link?: string;
      permalink_template?: string;
    };

    return {
      id: payload.id,
      status: payload.status,
      url: payload.link,
      editUrl: payload.permalink_template,
      provider: this.name,
    };
  },
};
