'use client';

import { useState, useEffect } from 'react';
import { useVideoStudioStore } from '@/lib/video/store';
import { ChevronDown, Key, DollarSign } from 'lucide-react';

interface ProviderModels {
  id: string;
  name: string;
  models: {
    id: string;
    name: string;
    capabilities: string[];
    maxDuration: number;
    resolutions: string[];
    price: { perVideo: number; perSecond: number; currency: string };
  }[];
}

export function SettingsPanel() {
  const {
    selectedProvider,
    selectedModel,
    apiKeys,
    duration,
    resolution,
    setProvider,
    setModel,
    setApiKey,
    setDuration,
    setResolution,
  } = useVideoStudioStore();

  const [providers, setProviders] = useState<ProviderModels[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetch('/api/video/models')
      .then((r) => r.json())
      .then((data) => setProviders(data.providers || []))
      .catch(console.error);
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Provider</label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => {
              setProvider(e.target.value);
              const p = providers.find((pr) => pr.id === e.target.value);
              if (p?.models.length) setModel(p.models[0].id);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Modelo</label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            {currentProvider?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {currentModel && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <DollarSign className="h-3 w-3" />
            Custo por video
          </div>
          <p className="text-lg font-semibold text-emerald-400">
            ~${(currentModel.price.perSecond * duration).toFixed(3)}
          </p>
          <p className="text-xs text-zinc-600">
            {duration}s @ {resolution}
          </p>
          <p className="text-xs text-zinc-600 mt-1">${currentModel.price.perSecond}/s</p>
        </div>
      )}

      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Duracao</label>
        <div className="relative">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            <option value={4}>4s</option>
            <option value={6}>6s</option>
            <option value={8}>8s</option>
            <option value={10}>10s</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Resolucao</label>
        <div className="grid grid-cols-2 gap-2">
          {(['720p', '1080p'] as const).map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                resolution === res
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Key className="h-3 w-3" />
          API Key
        </button>
        {showApiKey && (
          <div className="mt-2">
            <input
              type="password"
              value={apiKeys[selectedProvider] || ''}
              onChange={(e) => setApiKey(selectedProvider, e.target.value)}
              placeholder={`Insira a API key do ${currentProvider?.name || 'provider'}`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Chave salva apenas nesta sessao</p>
          </div>
        )}
      </div>
    </div>
  );
}
