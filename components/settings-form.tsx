"use client";

import { useEffect, useState } from "react";
import { ModelSelector } from "@/components/model-selector";

type ProviderCredential = {
  id?: string;
  providerKey: string;
  displayName: string;
  capability: "ai" | "search" | "publish" | "custom" | "image";
  apiKey: string;
  hasStoredKey?: boolean;
  baseUrl: string;
  isEnabled: boolean;
  metadata: Record<string, unknown>;
};

type PublishTarget = {
  id?: string;
  targetType: string;
  name: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  notes: string;
};

type SettingsPayload = {
  defaultLanguage: string;
  defaultTone: string;
  defaultArticleType: string;
  blockedDomains: string[];
  preferredSearchProvider: string;
  preferredAiProvider: string;
  preferredModelId: string;
  providerCredentials: ProviderCredential[];
  publishTargets: PublishTarget[];
};

const STORAGE_KEY = "publisherpilot-settings";

const defaultSettings: SettingsPayload = {
  defaultLanguage: "pt-BR",
  defaultTone: "Especialista claro e convincente",
  defaultArticleType: "blog-post",
  blockedDomains: [],
  preferredSearchProvider: "both",
  preferredAiProvider: "openrouter",
  preferredModelId: "",
  providerCredentials: [
    {
      providerKey: "openrouter",
      displayName: "OpenRouter",
      capability: "ai",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "https://openrouter.ai/api/v1",
      isEnabled: true,
      metadata: { capability: "ai", appName: "PublisherPilot", siteUrl: "http://localhost:3000" },
    },
    {
      providerKey: "openai",
      displayName: "OpenAI",
      capability: "ai",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "https://api.openai.com/v1",
      isEnabled: true,
      metadata: { capability: "ai" },
    },
    {
      providerKey: "openai-images",
      displayName: "OpenAI Images",
      capability: "custom",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "https://api.openai.com/v1",
      isEnabled: false,
      metadata: { capability: "image", output: "hero, thumb, social" },
    },
    {
      providerKey: "fal",
      displayName: "Fal",
      capability: "custom",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "image", output: "creative, lifestyle, product" },
    },
    {
      providerKey: "replicate",
      displayName: "Replicate",
      capability: "custom",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "image", output: "cover, visual variants" },
    },
    {
      providerKey: "searxng",
      displayName: "SearXNG",
      capability: "search",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "search" },
    },
    {
      providerKey: "wordpress",
      displayName: "WordPress",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", username: "", appPassword: "" },
    },
    {
      providerKey: "instagram",
      displayName: "Instagram",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", accountId: "" },
    },
    {
      providerKey: "x",
      displayName: "X / Twitter",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", accountId: "" },
    },
    {
      providerKey: "linkedin",
      displayName: "LinkedIn",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", organizationId: "" },
    },
    {
      providerKey: "webflow",
      displayName: "Webflow",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", collectionId: "" },
    },
    {
      providerKey: "notion",
      displayName: "Notion",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", databaseId: "" },
    },
    {
      providerKey: "shopify-blog",
      displayName: "Shopify Blog",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish", blogId: "" },
    },
    {
      providerKey: "generic-api",
      displayName: "Generic API",
      capability: "publish",
      apiKey: "",
      hasStoredKey: false,
      baseUrl: "",
      isEnabled: false,
      metadata: { capability: "publish" },
    },
  ],
  publishTargets: [
    {
      targetType: "wordpress",
      name: "WordPress principal",
      isEnabled: false,
      config: { siteUrl: "", status: "draft" },
      notes: "",
    },
    {
      targetType: "instagram",
      name: "Instagram principal",
      isEnabled: false,
      config: { mode: "future-shortform" },
      notes: "Canal futuro para derivacoes sociais a partir de artigos.",
    },
    {
      targetType: "x",
      name: "X principal",
      isEnabled: false,
      config: { mode: "future-thread" },
      notes: "Canal futuro para threads e snippets.",
    },
  ],
};

const fieldInput = "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors";
const fieldLabel = "space-y-2 text-sm";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={fieldLabel}>
      <span className="text-zinc-300">{label}</span>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {children}
    </label>
  );
}

function ProviderCard({
  provider,
  onUpdate,
  onRemove,
}: {
  provider: ProviderCredential;
  onUpdate: (patch: Partial<ProviderCredential>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-100">
          {provider.displayName || provider.providerKey || "Novo provedor"}
        </h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={provider.isEnabled}
              onChange={(e) => onUpdate({ isEnabled: e.target.checked })}
              className="rounded"
            />
            Ativo
          </label>
          <button type="button" onClick={onRemove} className="text-xs text-rose-400 hover:text-rose-300">
            Remover
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome exibido">
          <input
            className={fieldInput}
            value={provider.displayName}
            onChange={(e) => onUpdate({ displayName: e.target.value })}
            placeholder="Ex: OpenRouter"
          />
        </Field>
        <Field label="Chave interna" hint="Identificador técnico do provedor">
          <input
            className={fieldInput}
            value={provider.providerKey}
            onChange={(e) => onUpdate({ providerKey: e.target.value })}
            placeholder="Ex: openrouter"
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Categoria">
          <select
            className={fieldInput}
            value={provider.capability}
            onChange={(e) =>
              onUpdate({
                capability: e.target.value as ProviderCredential["capability"],
                metadata: { ...provider.metadata, capability: e.target.value },
              })
            }
          >
            <option value="ai">IA (texto)</option>
            <option value="search">Busca</option>
            <option value="publish">Publicação</option>
            <option value="image">Imagem</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        <Field label="URL base" hint="Endpoint da API">
          <input
            className={fieldInput}
            value={provider.baseUrl}
            onChange={(e) => onUpdate({ baseUrl: e.target.value })}
            placeholder="https://api.exemplo.com/v1"
          />
        </Field>
      </div>

      <Field label="Chave de API" hint={provider.hasStoredKey ? "Chave já salva. Digite apenas para substituir." : "Cole a chave de API ou token de acesso"}>
        <input
          className={fieldInput}
          type="password"
          value={provider.apiKey}
          onChange={(e) => onUpdate({ apiKey: e.target.value })}
          placeholder={provider.hasStoredKey ? "•••••••• (chave salva)" : "sk-... ou token..."}
        />
      </Field>

      <Field label="Metadados extras" hint="JSON adicional (appName, siteUrl, etc.)">
        <textarea
          className="min-h-20 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 outline-none font-mono"
          value={JSON.stringify(provider.metadata, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({ metadata: JSON.parse(e.target.value || "{}") });
            } catch {
              return;
            }
          }}
        />
      </Field>
    </div>
  );
}

function PublishTargetCard({
  target,
  onUpdate,
  onRemove,
}: {
  target: PublishTarget;
  onUpdate: (patch: Partial<PublishTarget>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-100">
          {target.name || target.targetType || "Novo destino"}
        </h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={target.isEnabled}
              onChange={(e) => onUpdate({ isEnabled: e.target.checked })}
              className="rounded"
            />
            Ativo
          </label>
          <button type="button" onClick={onRemove} className="text-xs text-rose-400 hover:text-rose-300">
            Remover
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome do destino">
          <input
            className={fieldInput}
            value={target.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ex: WordPress principal"
          />
        </Field>
        <Field label="Tipo" hint="wordpress, instagram, x, linkedin...">
          <input
            className={fieldInput}
            value={target.targetType}
            onChange={(e) => onUpdate({ targetType: e.target.value })}
            placeholder="wordpress"
          />
        </Field>
      </div>

      <Field label="Configuração" hint="JSON com parâmetros de conexão">
        <textarea
          className="min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 outline-none font-mono"
          value={JSON.stringify(target.config, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({ config: JSON.parse(e.target.value || "{}") });
            } catch {
              return;
            }
          }}
        />
      </Field>

      <Field label="Notas internas">
        <input
          className={fieldInput}
          value={target.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Observações sobre este destino"
        />
      </Field>
    </div>
  );
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsPayload>(defaultSettings);
  const [status, setStatus] = useState("Carregando configurações...");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    defaults: true,
    providers_ai: false,
    providers_search: false,
    providers_publish: false,
    providers_image: false,
    targets: false,
  });

  useEffect(() => {
    const local = window.localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        setSettings(JSON.parse(local) as SettingsPayload);
        setStatus("Configurações locais carregadas.");
      } catch {
        setStatus("Falha ao ler configurações locais.");
      }
    }

    void (async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        const merged: SettingsPayload = {
          ...defaultSettings,
          ...payload.settings,
          providerCredentials: payload.providerCredentials?.length
            ? payload.providerCredentials
            : defaultSettings.providerCredentials,
          publishTargets: payload.publishTargets?.length
            ? payload.publishTargets
            : defaultSettings.publishTargets,
        };

        setSettings(merged);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setStatus("Configurações carregadas do banco.");
      } catch {
        setStatus("Banco indisponível. Usando fallback local.");
      }
    })();
  }, []);

  function updateField<K extends keyof SettingsPayload>(field: K, value: SettingsPayload[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updateProvider(index: number, patch: Partial<ProviderCredential>) {
    setSettings((current) => ({
      ...current,
      providerCredentials: current.providerCredentials.map((p, i) =>
        i === index ? { ...p, ...patch } : p,
      ),
    }));
  }

  function removeProvider(index: number) {
    setSettings((current) => ({
      ...current,
      providerCredentials: current.providerCredentials.filter((_, i) => i !== index),
    }));
  }

  function addProvider(capability?: ProviderCredential["capability"]) {
    setSettings((current) => ({
      ...current,
      providerCredentials: [
        ...current.providerCredentials,
        {
          providerKey: "",
          displayName: "",
          capability: capability ?? "custom",
          apiKey: "",
          hasStoredKey: false,
          baseUrl: "",
          isEnabled: true,
          metadata: { capability: capability ?? "custom" },
        },
      ],
    }));
  }

  function updatePublishTarget(index: number, patch: Partial<PublishTarget>) {
    setSettings((current) => ({
      ...current,
      publishTargets: current.publishTargets.map((t, i) =>
        i === index ? { ...t, ...patch } : t,
      ),
    }));
  }

  function removePublishTarget(index: number) {
    setSettings((current) => ({
      ...current,
      publishTargets: current.publishTargets.filter((_, i) => i !== index),
    }));
  }

  function addPublishTarget() {
    setSettings((current) => ({
      ...current,
      publishTargets: [
        ...current.publishTargets,
        { targetType: "", name: "", isEnabled: false, config: {}, notes: "" },
      ],
    }));
  }

  function toggleSection(key: string) {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  }

  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | "loading"; message: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus({ type: "loading", message: "Salvando configurações..." });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        const errorMsg = payload.error || "Erro desconhecido ao salvar";
        console.error("[settings] Save failed:", errorMsg);
        setSaveStatus({ type: "error", message: `Falha ao salvar: ${errorMsg}` });
        return;
      }

      const providerCount = settings.providerCredentials.filter((p) => p.isEnabled).length;
      const targetCount = settings.publishTargets.filter((t) => t.isEnabled).length;
      const hasKey = settings.providerCredentials.some((p) => p.providerKey === settings.preferredAiProvider && (p.apiKey || p.hasStoredKey));

      const details = [
        `Provedores: ${providerCount} ativos`,
        `Destinos: ${targetCount} ativos`,
        hasKey ? "Chave de API: configurada" : "Chave de API: não configurada",
      ].join(" | ");

      setSaveStatus({
        type: "success",
        message: `Configurações salvas no banco. ${details}`,
      });
    } catch {
      setSaveStatus({
        type: "error",
        message: "Erro de conexão. Configurações salvas apenas localmente.",
      });
    }
  }

  const aiProviders = settings.providerCredentials.filter((p) => p.capability === "ai");
  const searchProviders = settings.providerCredentials.filter((p) => p.capability === "search");
  const publishProviders = settings.providerCredentials.filter((p) => p.capability === "publish");
  const imageProviders = settings.providerCredentials.filter((p) => p.capability === "custom" || p.capability === "image");

  function SectionHeader({
    title,
    subtitle,
    sectionKey,
    count,
  }: {
    title: string;
    subtitle: string;
    sectionKey: string;
    count?: number;
  }) {
    const isOpen = openSections[sectionKey];
    return (
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 transition-colors hover:border-zinc-700"
      >
        <div className="text-left">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
              {count}
            </span>
          )}
          <span className="text-zinc-500 text-sm">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-2 text-sm text-zinc-400">{status}</p>
      </div>

      {/* Defaults */}
      <section className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div>
          <h2 className="text-lg font-semibold">Padrões do artigo</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Valores que são preenchidos automaticamente ao criar um novo artigo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Idioma padrão" hint="Código do idioma (pt-BR, en, es)">
            <input
              className={fieldInput}
              value={settings.defaultLanguage}
              onChange={(e) => updateField("defaultLanguage", e.target.value)}
              placeholder="pt-BR"
            />
          </Field>

          <Field label="Formato padrão" hint="Tipo de artigo gerado por padrão">
            <select
              className={fieldInput}
              value={settings.defaultArticleType}
              onChange={(e) => updateField("defaultArticleType", e.target.value)}
            >
              <option value="blog-post">Post de blog</option>
              <option value="guia-completo">Guia completo</option>
              <option value="comparativo">Comparativo</option>
              <option value="tutorial">Tutorial</option>
              <option value="landing-seo">Página SEO</option>
            </select>
          </Field>
        </div>

        <Field label="Tom editorial padrão" hint="Estilo de escrita dos artigos">
          <select
            className={fieldInput}
            value={settings.defaultTone}
            onChange={(e) => updateField("defaultTone", e.target.value)}
          >
            <option value="Especialista claro e convincente">Especialista claro e convincente</option>
            <option value="Didatico e acessivel">Didático e acessível</option>
            <option value="Jornalistico e objetivo">Jornalístico e objetivo</option>
            <option value="Premium e estrategico">Premium e estratégico</option>
          </select>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Motor de busca padrão" hint="Fonte para pesquisa de fontes">
            <select
              className={fieldInput}
              value={settings.preferredSearchProvider}
              onChange={(e) => updateField("preferredSearchProvider", e.target.value)}
            >
              <option value="both">DuckDuckGo + SearXNG</option>
              {searchProviders.map((p) => (
                <option key={p.id ?? p.providerKey} value={p.providerKey}>
                  {p.displayName || p.providerKey}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Provedor de IA padrão" hint="Serviço que gera os artigos">
            <select
              className={fieldInput}
              value={settings.preferredAiProvider}
              onChange={(e) => updateField("preferredAiProvider", e.target.value)}
            >
              {aiProviders.map((p) => (
                <option key={p.id ?? p.providerKey} value={p.providerKey}>
                  {p.displayName || p.providerKey}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Modelo de IA padrão" hint="Selecione ou digite o ID do modelo">
          <ModelSelector
            provider={settings.preferredAiProvider}
            value={settings.preferredModelId}
            onChange={(modelId) => updateField("preferredModelId", modelId)}
          />
        </Field>

        <Field label="Domínios bloqueados" hint="Um por linha. Fontes desses domínios serão ignoradas.">
          <textarea
            className="min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 outline-none"
            value={settings.blockedDomains.join("\n")}
            onChange={(e) =>
              updateField(
                "blockedDomains",
                e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder="spam.com&#10;concorrente.com"
          />
        </Field>
      </section>

      {/* AI Providers */}
      <section className="space-y-4">
        <SectionHeader
          title="Provedores de IA"
          subtitle="Serviços que geram conteúdo (OpenRouter, OpenAI, etc.)"
          sectionKey="providers_ai"
          count={aiProviders.length}
        />
        {openSections.providers_ai && (
          <div className="space-y-3 pl-1">
            {settings.providerCredentials
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p.capability === "ai")
              .map(({ p, i }) => (
                <ProviderCard
                  key={p.id ?? `${p.providerKey}-${i}`}
                  provider={p}
                  onUpdate={(patch) => updateProvider(i, patch)}
                  onRemove={() => removeProvider(i)}
                />
              ))}
            <button
              type="button"
              onClick={() => addProvider("ai")}
              className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Adicionar provedor de IA
            </button>
          </div>
        )}
      </section>

      {/* Search Providers */}
      <section className="space-y-4">
        <SectionHeader
          title="Provedores de busca"
          subtitle="Motor de pesquisa para encontrar fontes e dados"
          sectionKey="providers_search"
          count={searchProviders.length}
        />
        {openSections.providers_search && (
          <div className="space-y-3 pl-1">
            {settings.providerCredentials
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p.capability === "search")
              .map(({ p, i }) => (
                <ProviderCard
                  key={p.id ?? `${p.providerKey}-${i}`}
                  provider={p}
                  onUpdate={(patch) => updateProvider(i, patch)}
                  onRemove={() => removeProvider(i)}
                />
              ))}
            <button
              type="button"
              onClick={() => addProvider("search")}
              className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Adicionar provedor de busca
            </button>
          </div>
        )}
      </section>

      {/* Image Providers */}
      <section className="space-y-4">
        <SectionHeader
          title="Provedores de imagem"
          subtitle="Geração e busca de imagens (DALL-E, Fal, Replicate)"
          sectionKey="providers_image"
          count={imageProviders.length}
        />
        {openSections.providers_image && (
          <div className="space-y-3 pl-1">
            {settings.providerCredentials
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p.capability === "custom" || p.capability === "image")
              .map(({ p, i }) => (
                <ProviderCard
                  key={p.id ?? `${p.providerKey}-${i}`}
                  provider={p}
                  onUpdate={(patch) => updateProvider(i, patch)}
                  onRemove={() => removeProvider(i)}
                />
              ))}
            <button
              type="button"
              onClick={() => addProvider("custom")}
              className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Adicionar provedor de imagem
            </button>
          </div>
        )}
      </section>

      {/* Publish Providers */}
      <section className="space-y-4">
        <SectionHeader
          title="Provedores de publicação"
          subtitle="Canais para distribuir artigos (WordPress, redes sociais, CMS)"
          sectionKey="providers_publish"
          count={publishProviders.length}
        />
        {openSections.providers_publish && (
          <div className="space-y-3 pl-1">
            {settings.providerCredentials
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p.capability === "publish")
              .map(({ p, i }) => (
                <ProviderCard
                  key={p.id ?? `${p.providerKey}-${i}`}
                  provider={p}
                  onUpdate={(patch) => updateProvider(i, patch)}
                  onRemove={() => removeProvider(i)}
                />
              ))}
            <button
              type="button"
              onClick={() => addProvider("publish")}
              className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Adicionar provedor de publicação
            </button>
          </div>
        )}
      </section>

      {/* Publish Targets */}
      <section className="space-y-4">
        <SectionHeader
          title="Destinos de publicação"
          subtitle="Instâncias configuradas para cada canal de distribuição"
          sectionKey="targets"
          count={settings.publishTargets.length}
        />
        {openSections.targets && (
          <div className="space-y-3 pl-1">
            {settings.publishTargets.map((target, index) => (
              <PublishTargetCard
                key={target.id ?? `${target.targetType}-${index}`}
                target={target}
                onUpdate={(patch) => updatePublishTarget(index, patch)}
                onRemove={() => removePublishTarget(index)}
              />
            ))}
            <button
              type="button"
              onClick={addPublishTarget}
              className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Adicionar destino
            </button>
          </div>
        )}
      </section>

      {/* Save */}
      <div className="sticky bottom-4 space-y-3">
        {saveStatus && (
          <div
            className={`rounded-2xl px-5 py-3 text-sm font-medium ${
              saveStatus.type === "success"
                ? "border border-emerald-800 bg-emerald-950/80 text-emerald-300"
                : saveStatus.type === "error"
                  ? "border border-rose-800 bg-rose-950/80 text-rose-300"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300"
            }`}
          >
            {saveStatus.type === "loading" && (
              <span className="inline-block animate-pulse mr-2">●</span>
            )}
            {saveStatus.type === "success" && (
              <span className="text-emerald-400 mr-2">✓</span>
            )}
            {saveStatus.type === "error" && (
              <span className="text-rose-400 mr-2">✕</span>
            )}
            {saveStatus.message}
          </div>
        )}
        <div className="flex justify-end">
          <button
            className="rounded-full bg-emerald-400 px-8 py-3 font-medium text-zinc-950 shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 disabled:opacity-50 transition-colors"
            type="submit"
            disabled={saveStatus?.type === "loading"}
          >
            {saveStatus?.type === "loading" ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </div>
    </form>
  );
}
