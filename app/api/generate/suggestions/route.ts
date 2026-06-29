import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/security/crypto";
import { loadPromptFile } from "@/lib/ai/prompts";
import { env } from "@/lib/env";

const suggestionsSchema = z.object({
  topic: z.string().min(2),
  aiProvider: z.string().default("openrouter"),
  aiModelId: z.string().default("openai/gpt-4o-mini"),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = suggestionsSchema.parse(body);

    let apiKey = "";
    let baseUrl = "";

    // Try to get from database
    try {
      const { getDefaultWorkspaceByUser, listApiProvidersByWorkspace } = await import("@/lib/db/queries");
      const workspace = await getDefaultWorkspaceByUser(user.id);
      if (workspace) {
        const providers = await listApiProvidersByWorkspace(user.id, workspace.id);
        const provider = providers.find(
          (p) => p.providerKey === parsed.aiProvider && p.isEnabled,
        );
        if (provider?.apiKeyEncrypted) {
          apiKey = decryptSecret(provider.apiKeyEncrypted);
          baseUrl = provider.baseUrl ?? "";
        }
        console.log("[suggestions] DB lookup:", {
          workspaceId: workspace.id,
          providerKey: parsed.aiProvider,
          found: !!provider,
          isEnabled: provider?.isEnabled,
          hasKey: !!provider?.apiKeyEncrypted,
          keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : "none",
        });
      } else {
        console.log("[suggestions] No default workspace for user:", user.id);
      }
    } catch (e) {
      console.error("[suggestions] DB lookup error:", e);
    }

    // Fallback to env vars
    if (!apiKey) {
      if (parsed.aiProvider === "openrouter") {
        apiKey = env.OPENROUTER_API_KEY ?? "";
        baseUrl = baseUrl || env.OPENROUTER_BASE_URL;
      } else if (parsed.aiProvider === "openai") {
        apiKey = env.OPENAI_API_KEY ?? "";
        baseUrl = baseUrl || env.OPENAI_BASE_URL;
      }
      if (apiKey) {
        console.log("[suggestions] Using env fallback key");
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: "Chave de API não configurada. Vá em Configurações > Provedores de IA e adicione sua chave.",
      });
    }

    const finalBaseUrl =
      baseUrl ||
      (parsed.aiProvider === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : "https://api.openai.com/v1");

    console.log("[suggestions] Calling AI:", {
      provider: parsed.aiProvider,
      model: parsed.aiModelId,
      url: `${finalBaseUrl}/chat/completions`,
    });

    const promptTemplate = await loadPromptFile("suggest-briefing.md");
    const prompt = `${promptTemplate}\n\nTOPIC: ${parsed.topic}`;

    const response = await fetch(`${finalBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(parsed.aiProvider === "openrouter"
          ? {
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "PublisherPilot",
            }
          : {}),
      },
      body: JSON.stringify({
        model: parsed.aiModelId,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "sem detalhes");
      console.error("[suggestions] AI API error:", response.status, errorText.slice(0, 500));
      return NextResponse.json({
        ok: false,
        error: `Erro da API de IA (${response.status}): ${errorText.slice(0, 200)}`,
      });
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (payload.error) {
      console.error("[suggestions] API returned error:", payload.error);
      return NextResponse.json({
        ok: false,
        error: `Erro da API: ${payload.error.message || JSON.stringify(payload.error)}`,
      });
    }

    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    console.log("[suggestions] Response length:", raw.length);

    let suggestions: unknown;
    try {
      suggestions = JSON.parse(raw);
    } catch {
      console.error("[suggestions] Invalid JSON from AI:", raw.slice(0, 300));
      return NextResponse.json({
        ok: false,
        error: "A IA não retornou JSON válido. Tente novamente.",
      });
    }

    // Index generated suggestions for future reference
    try {
      const { indexArticle } = await import("@/lib/ai/chromadb");
      const suggestionsText = JSON.stringify(suggestions);
      await indexArticle({
        id: `suggestions_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content: `Topic: ${parsed.topic}\nSuggestions: ${suggestionsText.slice(0, 5000)}`,
        metadata: {
          type: "suggestions",
          title: parsed.topic,
          model: parsed.aiModelId,
          createdAt: new Date().toISOString(),
        },
      });
    } catch {}

    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[suggestions] Unhandled error:", msg);
    return NextResponse.json({ ok: false, error: msg });
  }
}
