"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModelSelector } from "@/components/model-selector";
import { ArticleProgress, getStepsForPhase, getPercentForPhase } from "@/components/article-progress";
import { IMAGE_PROVIDER_LABELS, type ImageProviderKey } from "@/lib/images/providers";

const fieldClassName = "w-full rounded-2xl border border-zinc-800/60 bg-zinc-950/50 p-4 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all";
const labelClassName = "space-y-2 text-sm font-medium";

const languageOptions = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const toneOptions = [
  { value: "Especialista claro e convincente", label: "Especialista claro e convincente" },
  { value: "Didatico e acessivel", label: "Didático e acessível" },
  { value: "Jornalistico e objetivo", label: "Jornalístico e objetivo" },
  { value: "Premium e estrategico", label: "Premium e estratégico" },
];

const lengthOptions = [
  { value: "800-1200 palavras (~6.000 caracteres)", label: "Curto: ~6.000 caracteres" },
  { value: "1200-1600 palavras (~10.000 caracteres)", label: "Medio: ~10.000 caracteres" },
  { value: "1600-2400 palavras (~15.000 caracteres)", label: "Longo: ~15.000 caracteres" },
  { value: "2400-4000 palavras (~25.000 caracteres)", label: "Profundo: ~25.000 caracteres" },
  { value: "4000-7000 palavras (~45.000 caracteres)", label: "Extenso: ~45.000 caracteres" },
  { value: "7000-10000 palavras (~50.000 caracteres)", label: "Mega: ~50.000 caracteres" },
];

const articleTypeOptions = [
  { value: "blog-post", label: "Post de blog" },
  { value: "guia-completo", label: "Guia completo" },
  { value: "comparativo", label: "Comparativo" },
  { value: "tutorial", label: "Tutorial passo a passo" },
  { value: "landing-seo", label: "Página SEO" },
];

const sourceCountOptions = [
  { value: "3", label: "3 fontes" },
  { value: "5", label: "5 fontes" },
  { value: "8", label: "8 fontes" },
  { value: "10", label: "10 fontes" },
];

const searchProviderOptions = [
  { value: "both", label: "Busca combinada" },
  { value: "duckduckgo", label: "DuckDuckGo" },
  { value: "searxng", label: "SearXNG" },
];

const aiProviderOptions = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
];

type BriefingTemplate = {
  id: string;
  name: string;
  topicHint?: string | null;
  niche: string;
  subtitle?: string | null;
  keywords?: string[];
  structureNotes?: string | null;
  language: string;
  editorialTone: string;
  desiredLength: string;
  articleType: string;
  sourceCount: number;
  searchProvider: string;
  aiProvider: string;
  aiModelId: string;
};

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={labelClassName}>
      <span className="text-zinc-200">{label}</span>
      {hint ? <p className="text-xs text-zinc-500 font-normal">{hint}</p> : null}
      {children}
    </label>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`relative space-y-6 rounded-[2rem] border border-zinc-800/60 bg-zinc-950/40 p-8 backdrop-blur-xl shadow-xl shadow-black/20 overflow-visible ${className}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
      {children}
    </section>
  );
}

export function ArticleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState("");
  const [templates, setTemplates] = useState<BriefingTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [progressPhase, setProgressPhase] = useState<"creating" | "searching" | "generating" | "ready" | "error">("creating");
  const [progressError, setProgressError] = useState<string | null>(null);
  const [, setProgressDetail] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    topic: "",
    subtitle: "",
    niche: "",
    keywords: "",
    structureNotes: "",
    language: "pt-BR",
    editorialTone: "Especialista claro e convincente",
    desiredLength: "1200-1600 palavras",
    articleType: "blog-post",
    sourceCount: "5",
    searchProvider: "both",
    aiProvider: "openrouter",
    aiModelId: "openai/gpt-4o-mini",
    imageProviders: ["searxng"] as ImageProviderKey[],
    falImageModel: "fal-ai/flux/schnell",
    audioSourceUrl: "",
  });
  const router = useRouter();

  interface FalModelInfo {
    modelId: string;
    name: string;
    cost: string;
    description: string;
  }
  const [falModels, setFalModels] = useState<FalModelInfo[]>([]);

  useEffect(() => {
    fetch("/api/images/fal/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.models) {
          setFalModels(data.models);
        }
      })
      .catch((err) => console.error("Erro ao buscar modelos Fal.ai:", err));
  }, []);


  useEffect(() => {
    void (async () => {
      try {
        const [settingsResponse, templatesResponse] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/briefing-templates", { cache: "no-store" }),
        ]);

        if (settingsResponse.ok) {
          const payload = await settingsResponse.json();
          setFormState((current) => ({
            ...current,
            language: payload.settings?.defaultLanguage ?? current.language,
            editorialTone: payload.settings?.defaultTone ?? current.editorialTone,
            articleType: payload.settings?.defaultArticleType ?? current.articleType,
            searchProvider: payload.settings?.preferredSearchProvider ?? current.searchProvider,
            aiProvider: payload.settings?.preferredAiProvider ?? current.aiProvider,
            aiModelId: payload.settings?.preferredModelId || current.aiModelId,
          }));
        }

        if (templatesResponse.ok) {
          const payload = await templatesResponse.json();
          setTemplates(payload.templates ?? []);
        }
      } catch {
        return;
      }
    })();
  }, []);

  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  async function generateSuggestions() {
    const topic = formState.topic.trim();
    if (!topic || topic.length < 3) {
      setSuggestionNote("Digite um tema com pelo menos 3 caracteres.");
      return;
    }

    setIsGeneratingSuggestions(true);
    setSuggestionNote("Gerando sugestões com IA...");

    try {
      const response = await fetch("/api/generate/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          aiProvider: formState.aiProvider,
          aiModelId: formState.aiModelId,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setSuggestionNote(payload.error || "Erro ao gerar sugestões. Verifique a chave de API nas configurações.");
        return;
      }

      if (!payload.suggestions) {
        setSuggestionNote("A IA não retornou sugestões. Tente novamente.");
        return;
      }

      const s = payload.suggestions;
      setFormState((current) => ({
        ...current,
        niche: s.niche ?? current.niche,
        subtitle: s.subtitle ?? current.subtitle,
        keywords: Array.isArray(s.keywords) ? s.keywords.join(", ") : (s.keywords ?? current.keywords),
        structureNotes: s.structureNotes ?? current.structureNotes,
        editorialTone: s.editorialTone ?? current.editorialTone,
        articleType: s.articleType ?? current.articleType,
        desiredLength: s.desiredLength ?? current.desiredLength,
      }));
      setSuggestionNote("Sugestões geradas pela IA. Você pode editar qualquer campo.");
    } catch {
      setSuggestionNote("Erro de conexão. Tente novamente.");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setFormState((current) => ({
      ...current,
      topic: template.topicHint ?? current.topic,
      subtitle: template.subtitle ?? "",
      niche: template.niche,
      keywords: (template.keywords ?? []).join(", "),
      structureNotes: template.structureNotes ?? "",
      language: template.language,
      editorialTone: template.editorialTone,
      desiredLength: template.desiredLength,
      articleType: template.articleType,
      sourceCount: String(template.sourceCount),
      searchProvider: template.searchProvider,
      aiProvider: template.aiProvider,
      aiModelId: template.aiModelId,
    }));
    setSuggestionNote(`Template "${template.name}" aplicado.`);
  }

  async function saveCurrentAsTemplate() {
    if (!templateName.trim()) {
      return;
    }

    const response = await fetch("/api/briefing-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName.trim(),
        topicHint: formState.topic,
        niche: formState.niche,
        subtitle: formState.subtitle,
        keywords: formState.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        structureNotes: formState.structureNotes,
        language: formState.language,
        editorialTone: formState.editorialTone,
        desiredLength: formState.desiredLength,
        articleType: formState.articleType,
        sourceCount: Number(formState.sourceCount),
        searchProvider: formState.searchProvider,
        aiProvider: formState.aiProvider,
        aiModelId: formState.aiModelId,
        imageProviders: formState.imageProviders,
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setTemplates((current) => [payload.template, ...current]);
    setTemplateName("");
    setSuggestionNote("Template salvo neste workspace.");
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setProgressPhase("creating");
    setProgressError(null);
    setProgressDetail(null);

    const payload = {
      topic: formState.topic,
      subtitle: formState.subtitle,
      niche: formState.niche,
      keywords: formState.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      structureNotes: formState.structureNotes,
      language: formState.language,
      editorialTone: formState.editorialTone,
      desiredLength: formState.desiredLength,
      articleType: formState.articleType,
      sourceCount: Number(formState.sourceCount) || 5,
      searchProvider: formState.searchProvider,
      aiProvider: formState.aiProvider,
      aiModelId: formState.aiModelId,
      imageProviders: formState.imageProviders,
      falImageModel: formState.falImageModel,
    };


    try {
      // Step 1: Create project (also creates search job in queue)
      setProgressDetail("Enviando dados do artigo para o servidor...");
      const createResponse = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorBody.error || `Erro HTTP ${createResponse.status}`);
      }

      const createResult = (await createResponse.json()) as { project: { id: string } };

      // Step 2: Trigger first job processing
      setProgressPhase("searching");
      setProgressDetail(`Projeto criado! Iniciando pesquisa de fontes...`);

      // Fire-and-forget: trigger job processing
      fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});

      // Step 3: Redirect to project page (poller will handle progress + further job triggers)
      setProgressDetail("Redirecionando para acompanhar o progresso...");
      await new Promise((r) => setTimeout(r, 800));
      router.push(`/articles/${createResult.project.id}`);
    } catch (error) {
      console.error(error);
      setProgressPhase("error");
      setProgressError(error instanceof Error ? error.message : "Erro desconhecido durante a geração");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <Section>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Brief do conteúdo</h2>
          <p className="text-sm text-zinc-400 max-w-2xl">Defina o assunto e clique em &quot;Gerar sugestões&quot; para a IA preencher os campos automaticamente. Todos os campos podem ser editados manualmente.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <FieldLabel label="Tema do artigo">
            <div className="flex gap-2">
              <input
                name="topic"
                className={fieldClassName}
                placeholder="Ex: A historia do rock alternativo"
                value={formState.topic}
                onChange={(event) => setFormState((current) => ({ ...current, topic: event.target.value }))}
              />
              <button
                type="button"
                onClick={generateSuggestions}
                disabled={isGeneratingSuggestions}
                className="shrink-0 rounded-2xl bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isGeneratingSuggestions ? "..." : "Gerar"}
              </button>
            </div>
          </FieldLabel>
          <FieldLabel label="Nicho">
            <input
              name="niche"
              className={fieldClassName}
              placeholder="Ex: tecnologia"
              value={formState.niche}
              onChange={(event) => setFormState((current) => ({ ...current, niche: event.target.value }))}
            />
          </FieldLabel>
          <FieldLabel label="Subtítulo sugerido" hint="Linha de apoio para deixar a proposta do artigo mais clara.">
            <input
              name="subtitle"
              className={fieldClassName}
              placeholder="Resumo curto da promessa editorial"
              value={formState.subtitle}
              onChange={(event) => setFormState((current) => ({ ...current, subtitle: event.target.value }))}
            />
          </FieldLabel>
          <FieldLabel label="Palavras-chave" hint="Separe por vírgula.">
            <input
              name="keywords"
              className={fieldClassName}
              placeholder="SEO, IA, automação, produtividade"
              value={formState.keywords}
              onChange={(event) => setFormState((current) => ({ ...current, keywords: event.target.value }))}
            />
          </FieldLabel>
          <FieldLabel label="Fonte de áudio (opcional)" hint="URL de um podcast ou vídeo para transcrever e usar como fonte.">
            <input
              name="audioSourceUrl"
              className={fieldClassName}
              placeholder="https://exemplo.com/podcast-episodio.mp3"
              value={formState.audioSourceUrl}
              onChange={(event) => setFormState((current) => ({ ...current, audioSourceUrl: event.target.value }))}
            />
          </FieldLabel>
        </div>
        <FieldLabel label="Estrutura sugerida" hint="Use esse campo para orientar a construção do artigo.">
          <textarea
            name="structureNotes"
            className={`${fieldClassName} min-h-32 resize-y`}
            placeholder="Ex: introdução, contexto, análise, exemplos, checklist e FAQ."
            value={formState.structureNotes}
            onChange={(event) => setFormState((current) => ({ ...current, structureNotes: event.target.value }))}
          />
        </FieldLabel>
        {suggestionNote ? <p className="text-sm font-medium text-emerald-400">{suggestionNote}</p> : null}
      </Section>

      <Section>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Templates do workspace</h2>
          <p className="text-sm text-zinc-400">Salve formatos recorrentes para clientes, marcas ou linhas editoriais.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            className={fieldClassName}
            placeholder="Nome do template"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
          />
          <button
            type="button"
            onClick={saveCurrentAsTemplate}
            className="rounded-full border border-zinc-700/60 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all hover:scale-[1.02] active:scale-95 backdrop-blur-sm"
          >
            Salvar template
          </button>
        </div>
        {templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-5 text-left transition-all hover:bg-zinc-900/60 hover:border-zinc-700 overflow-hidden"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <strong className="block text-base font-medium text-zinc-100">{template.name}</strong>
                <span className="mt-2 block text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {template.niche} · {template.articleType} · {template.editorialTone}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 mt-2">Nenhum template salvo neste workspace ainda.</p>
        )}
      </Section>

      <div className="space-y-3 py-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="rounded-full border border-zinc-700/60 bg-zinc-900/50 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all backdrop-blur-sm"
        >
          {showAdvanced ? "Ocultar configurações avançadas" : "Configurações avançadas"}
        </button>
        <p className="text-sm text-zinc-500 ml-2">Pesquisa, qualidade e IA ficam recolhidas quando você só quiser montar o briefing principal.</p>
      </div>

      {showAdvanced ? (
        <div className="space-y-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <Section>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Pesquisa e qualidade</h2>
              <p className="text-sm text-zinc-400">Defina como o sistema deve buscar fontes para sustentar o artigo.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FieldLabel label="Idioma">
                <select
                  name="language"
                  className={fieldClassName}
                  value={formState.language}
                  onChange={(event) => setFormState((current) => ({ ...current, language: event.target.value }))}
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Quantidade de fontes">
                <select
                  name="sourceCount"
                  className={fieldClassName}
                  value={formState.sourceCount}
                  onChange={(event) => setFormState((current) => ({ ...current, sourceCount: event.target.value }))}
                >
                  {sourceCountOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Motor de busca">
                <select
                  name="searchProvider"
                  className={fieldClassName}
                  value={formState.searchProvider}
                  onChange={(event) => setFormState((current) => ({ ...current, searchProvider: event.target.value }))}
                >
                  {searchProviderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormState((c) => ({
                      ...c,
                      imageProviders: c.imageProviders.length > 0 ? [] : ["searxng"],
                    }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formState.imageProviders.length > 0 ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formState.imageProviders.length > 0 ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Incluir imagens</p>
                    <p className="text-xs text-zinc-500">Busca imagens relevantes para ilustrar o artigo</p>
                  </div>
                </div>
                {formState.imageProviders.length > 0 && (
                  <div className="ml-14 space-y-3 mt-4">
                    <p className="text-xs text-zinc-500 mb-3">Selecione os motores de busca de imagem:</p>
                    {(Object.entries(IMAGE_PROVIDER_LABELS) as [ImageProviderKey, string][]).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formState.imageProviders.includes(key)}
                            onChange={() => setFormState((c) => ({
                              ...c,
                              imageProviders: c.imageProviders.includes(key)
                                ? c.imageProviders.filter((p) => p !== key)
                                : [...c.imageProviders, key],
                            }))}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 transition-colors"
                          />
                          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
                        </label>
                        {key === "fal" && formState.imageProviders.includes("fal") && (
                          <div className="ml-7 pl-1 space-y-2 py-1 max-w-md animate-in slide-in-from-top-2 duration-200">
                            <p className="text-[11px] font-medium text-zinc-500">Modelo de geração:</p>
                            <select
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              value={formState.falImageModel}
                              onChange={(e) => setFormState((c) => ({ ...c, falImageModel: e.target.value }))}
                            >
                              {falModels.length > 0 ? (
                                falModels.map((m) => (
                                  <option key={m.modelId} value={m.modelId}>
                                    {m.name} ({m.cost})
                                  </option>
                                ))
                              ) : (
                                <option value="fal-ai/flux/schnell">Flux Schnell ($0.003 / megapixel)</option>
                              )}
                            </select>
                            {falModels.find((m) => m.modelId === formState.falImageModel) && (
                              <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                                {falModels.find((m) => m.modelId === formState.falImageModel)?.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FieldLabel label="Tamanho do artigo">
                <select
                  name="desiredLength"
                  className={fieldClassName}
                  value={formState.desiredLength}
                  onChange={(event) => setFormState((current) => ({ ...current, desiredLength: event.target.value }))}
                >
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
            </div>
          </Section>

          <Section>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Estilo e IA</h2>
              <p className="text-sm text-zinc-400">Escolha o tipo de conteúdo, o tom e a IA que vai escrever.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FieldLabel label="Tom do texto">
                <select
                  name="editorialTone"
                  className={fieldClassName}
                  value={formState.editorialTone}
                  onChange={(event) => setFormState((current) => ({ ...current, editorialTone: event.target.value }))}
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Formato do conteúdo">
                <select
                  name="articleType"
                  className={fieldClassName}
                  value={formState.articleType}
                  onChange={(event) => setFormState((current) => ({ ...current, articleType: event.target.value }))}
                >
                  {articleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Plataforma de IA">
                <select
                  name="aiProvider"
                  className={fieldClassName}
                  value={formState.aiProvider}
                  onChange={(event) => setFormState((current) => ({ ...current, aiProvider: event.target.value }))}
                >
                  {aiProviderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Modelo de IA" hint="Selecione ou digite o ID do modelo">
                <ModelSelector
                  provider={formState.aiProvider}
                  value={formState.aiModelId}
                  onChange={(modelId) => setFormState((current) => ({ ...current, aiModelId: modelId }))}
                  className={fieldClassName}
                />
              </FieldLabel>
            </div>
          </Section>
        </div>
      ) : null}

      <div className="pt-4">
        {isSubmitting ? (
          <ArticleProgress
            steps={getStepsForPhase(progressPhase)}
            currentPercent={getPercentForPhase(progressPhase)}
            error={progressError}
          />
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Gerar artigo completo
          </button>
        )}
      </div>
    </div>
  );
}
