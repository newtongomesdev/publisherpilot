import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENROUTER_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { prompt, currentConfig } = body;

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "O parâmetro 'prompt' é obrigatório." },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um gerador especialista em configurações do Chart.js (versão 2) para a API do QuickChart.io.
Sua tarefa é retornar APENAS um objeto JSON válido correspondente à configuração do gráfico solicitado pelo usuário.
Não inclua nenhuma formatação Markdown (como \`\`\`json ou explicações de texto). Retorne estritamente o objeto JSON principal.

O JSON gerado deve possuir a estrutura padrão:
{
  "type": "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea",
  "data": {
    "labels": ["Rótulo A", "Rótulo B", ...],
    "datasets": [
      {
        "label": "Nome do Dataset",
        "data": [10, 20, ...],
        "backgroundColor": "rgba(...) ou hexadecimal ou array de cores",
        "borderColor": "rgba(...) ou hexadecimal",
        "borderWidth": 1
      }
    ]
  },
  "options": {
    "title": {
      "display": true,
      "text": "Título do Gráfico"
    }
  }
}

${
  currentConfig
    ? `A configuração atual do gráfico é fornecida a seguir. O usuário pode estar solicitando modificações, melhorias ou alterações sobre ela:\n${JSON.stringify(
        currentConfig
      )}\nModifique ou aprimore esta configuração com base nas instruções do usuário.`
    : "Gere um gráfico totalmente novo e moderno que atenda aos requisitos do usuário."
}

Use cores modernas e harmoniosas (por exemplo, tons pastéis elegantes, cores Tailwind como esmeralda #10b981, azul #3b82f6, âmbar #f59e0b, rosa #f43f5e, violeta #8b5cf6, etc.). Evite cores primárias brutas como verde puro, vermelho puro ou azul puro. Se for um gráfico de pizza, rosca ou polar, forneça um array de cores de fundo correspondente aos itens.`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Atlas Forge AI",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[charts-generate] OpenRouter Error:", resp.status, errText);
      return NextResponse.json(
        { ok: false, error: `Erro na API do OpenRouter: ${resp.status}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() ?? "{}";

    try {
      const parsedConfig = JSON.parse(rawContent);

      // Index generated chart config
      try {
        const { indexChart } = await import("@/lib/ai/chromadb");
        const labels = parsedConfig.data?.labels || [];
        const datasets = (parsedConfig.data?.datasets || []).map((ds: any) => ds.label || "").filter(Boolean);
        await indexChart({
          id: `chart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          content: [prompt, parsedConfig.type, labels.join(", "), datasets.join(", "), rawContent.slice(0, 3000)].join("\n"),
          metadata: {
            chartType: parsedConfig.type || "",
            labels: labels.join(", "),
            createdAt: new Date().toISOString(),
          },
        });
      } catch {}

      return NextResponse.json({ ok: true, config: parsedConfig });
    } catch {
      console.error("[charts-generate] Failed to parse JSON from AI response:", rawContent);
      return NextResponse.json(
        { ok: false, error: "A resposta da IA não pôde ser convertida em um JSON válido." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[charts-generate] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
