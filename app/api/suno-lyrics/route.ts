import { NextResponse } from "next/server";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      theme,
      genre,
      vocal,
      mood,
      structure = [],
      rimas = "rhyming",
      language = "Portuguese",
      model = DEFAULT_MODEL,
      temperature = 0.7,
      customInstructions = "",
      inspiration, // Música/Artista de inspiração
    } = body;

    if (!theme && !inspiration) {
      return NextResponse.json({ ok: false, error: "O tema ou a música de inspiração é obrigatória" }, { status: 400 });
    }

    const structurePrompt = structure.length > 0
      ? `A letra deve seguir exatamente a seguinte estrutura de blocos do Suno AI: ${structure.map((s: string) => `[${s}]`).join(", ")}.`
      : `Estruture a letra usando blocos padrões do Suno AI como [Intro], [Verse], [Chorus], [Bridge], [Outro].`;

    const systemPrompt = `Você é um compositor profissional de música especializado em criar letras otimizadas para geração de áudio no Suno AI.
O Suno responde incrivelmente bem a metadados estruturais inseridos em colchetes como [Intro], [Verse], [Chorus], [Bridge], [Outro], [Guitar Solo], [Bass Drop], [Beat Drop], [Ad-lib] etc.

Sua tarefa é criar a letra de música com base nas preferências do usuário e também gerar um prompt de estilo musical (Style Prompt) otimizado para o Suno.

Se o usuário fornecer uma 'Música de Inspiração' (Artista + Nome da Música), você deve:
1. Analisar o gênero musical, tipo de voz, clima, andamento (BPM) e instrumentação marcante dessa música de referência.
2. Gerar um 'stylePrompt' otimizado para o Suno (em inglês, máx 120 caracteres) que represente com extrema fidelidade a sonoridade daquela música de referência.
3. CRÍTICO: O 'stylePrompt' gerado NÃO PODE conter nomes de artistas, bandas, cantores ou títulos de músicas específicas (ex: nunca escreva 'Coldplay style', 'Yellow style', 'Queen style' ou 'Bohemian Rhapsody style'). O Suno bloqueia imediatamente prompts contendo nomes registrados de artistas. Descreva a sonoridade usando apenas termos genéricos e técnicos (ex: use 'alternative pop rock, warm acoustic guitar, melodic vocals, emotional atmosphere, 95bpm').
4. Compor uma letra original (no idioma solicitado) que capture a métrica, estilo poético, tom emocional e vibe da música de referência.

Você deve responder APENAS com um objeto JSON válido contendo exatamente três campos:
{
  "title": "Um título criativo e marcante para a música",
  "stylePrompt": "Um prompt de estilo em inglês (máximo 120 caracteres) otimizado para o Suno descrevendo o gênero, vocal, bpm, instrumentos e clima, por exemplo: 'melodic synthwave, emotional female vocals, analog synth, 110bpm, neon atmosphere'",
  "lyrics": "A letra completa da música formatada com as tags estruturais entre colchetes em linhas separadas. Coloque cada bloco claramente demarcado, exemplo:\n\n[Intro]\n(instrumental synth build-up)\n\n[Verse 1]\nLetra aqui...\n\n[Chorus]\nRefrão aqui..."
}`;

    let userPrompt = "";
    if (inspiration) {
      userPrompt = `Gere uma música com base nas seguintes preferências de INSPIRAÇÃO:
- Música/Artista de referência: ${inspiration}
${theme ? `- Tema/Ideia complementar para a letra: ${theme}` : "- Tema da letra: Inspirado na atmosfera poética geral da música de referência"}
- Idioma da letra: ${language}
- Tipo de rimas: ${rimas === "rhyming" ? "Rimas ricas e marcantes" : "Versos livres"}
- ${structurePrompt}
${customInstructions ? `- Instruções personalizadas adicionais: ${customInstructions}` : ""}`;
    } else {
      userPrompt = `Gere uma música com os seguintes parâmetros customizados:
- Tema/Ideia central: ${theme}
- Gênero/Estilo musical: ${genre}
- Tipo de Vocal: ${vocal}
- Humor/Atmosfera: ${mood}
- Idioma: ${language}
- Tipo de rimas: ${rimas === "rhyming" ? "Rimas ricas e marcantes" : "Versos livres (sem obrigatoriedade de rima)"}
- ${structurePrompt}
${customInstructions ? `- Instruções personalizadas adicionais: ${customInstructions}` : ""}`;
    }

    userPrompt += `\n\nLembre-se: Retorne estritamente um JSON no formato especificado. Não adicione markdown \`\`\`json ou texto fora do objeto JSON.`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "PublisherPilot",
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: temperature,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[suno-lyrics] OpenRouter Error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `Erro na API do OpenRouter: ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "{}";
    
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Fallback se não retornou JSON puro mesmo pedindo
      parsed = {
        title: "Música Gerada",
        stylePrompt: `${genre}, ${vocal} vocals, ${mood}`,
        lyrics: rawContent,
      };
    }

    return NextResponse.json({
      ok: true,
      title: parsed.title || "Sem título",
      stylePrompt: parsed.stylePrompt || "",
      lyrics: parsed.lyrics || "",
      model: model,
    });
  } catch (err) {
    console.error("[suno-lyrics] Error:", err);
    return NextResponse.json({ ok: false, error: "Falha ao gerar letra de música" }, { status: 500 });
  }
}
