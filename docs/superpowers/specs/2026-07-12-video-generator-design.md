# Video Studio — Design Spec

## Visao Geral

Sistema de geracao e edicao de videos por AI integrado ao PublisherPilot, inspirado no Google Flow. Permite gerar videos a partir de texto/imagens, editar, estender, controlar camera, organizar em timeline e collections — tudo via uma interface de 3 colunas com chat AI, preview e configuracoes.

## Funcionalidades

### Modos de Geracao
1. **Text to Video** — Gerar videos a partir de prompts de texto
2. **Image to Video** — Animar imagens estaticas com prompt adicional
3. **Extender Video** — Estender clips existentes com continuacao
4. **Inserir Objeto** — Adicionar elementos a uma cena de video
5. **Remover Objeto** — Remover elementos de uma cena de video
6. **Camera Control** — Direcionar angulo e movimento (pan, tilt, zoom, orbit, estatica)
7. **Scenebuilder** — Compor cenas combinando multiplos elementos
8. **Consistencia de Personagens** — Manter personagens consistentes entre cenas (limitado pelo provider)

### Interface

Layout de 3 colunas:

**Coluna Esquerda — Chat AI:**
- Painel lateral com chat para refinar prompts
- Usa LLM existente (OpenRouter) para sugestoes
- Nao gera videos — apenas ajuda a escrever prompts ideais
- Pode sugerir configuracoes de camera, duracao, etc

**Coluna Central — Preview + Form:**
- Tabs por modo: Text-to-Video | Image-to-Video | Extender | Scenebuilder | Editar Objeto
- Area de preview do video com controles de camera overlay
- Timeline na parte inferior com clips gerados
- Clips sao arrastaveis na timeline

**Coluna Direita — Configuracoes + Collections:**
- Seletor de Provider (FAL, Replicate, OpenAI, etc)
- Seletor de Modelo (dentro do provider escolhido)
- Exibicao de preco por modelo
- Input de API Key por provider
- Galeria de Collections/Assets gerados

**Botao Gerar:**
- Barra inferior com botao "Gerar Video" em destaque

### Fluxo de Uso
1. Usuario configura provider/modelo/preco na sidebar direita
2. Digita prompt (direto no form ou via chat)
3. Seleciona modo, camera, duracao, resolucao
4. Clica "Gerar Video"
5. POST para API -> registry resolve provider -> chamada externa
6. Resposta: video URL, adicionado a timeline e preview
7. Usuario pode arranjar clips na timeline, gerar mais, ou baixar o video final

## Arquitetura

### Estrutura de Diretorios

```
lib/video/
├── providers/
│   ├── fal.ts              # FAL.ai provider
│   ├── replicate.ts        # Replicate provider
│   ├── openai.ts           # OpenAI Sora provider
│   └── unsupported.ts      # Placeholder para providers nao suportados
├── video-provider.ts       # Interface base do provider
├── registry.ts             # Registry de providers
└── types.ts                # Types compartilhados

app/api/video/
├── generate/
│   └── route.ts            # POST — gerar video (text/image -> video)
├── extend/
│   └── route.ts            # POST — estender video existente
├── edit/
│   └── route.ts            # POST — inserir/remover objetos
└── models/
    └── route.ts            # GET — listar modelos + precos por provider

components/video-studio/
├── index.tsx               # Pagina principal (layout 3 colunas)
├── chat-panel.tsx          # Chat AI lateral
├── preview-panel.tsx       # Preview + tabs de modo
├── timeline.tsx            # Timeline de clips
├── settings-panel.tsx      # Provider, modelo, precos, API key
├── collections.tsx         # Galeria de assets
├── camera-controls.tsx     # Controles de camera
└── mode-tabs.tsx           # Tabs por modo de geracao

app/dashboard/video-generator/
└── page.tsx                # Rota da pagina
```

### Tipos

```typescript
// lib/video/types.ts

interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  mode: 'text-to-video' | 'image-to-video' | 'extend' | 'scene' | 'edit';
  imageUrl?: string;        // para image-to-video
  videoUrl?: string;        // para extend/edit
  duration: number;         // 4, 8, etc
  resolution: '720p' | '1080p';
  camera?: CameraConfig;
  fps?: number;
}

interface CameraConfig {
  type: 'static' | 'pan' | 'tilt' | 'zoom' | 'orbit';
  direction?: string;
  intensity?: number;
}

interface VideoGenerationResponse {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  model: string;
  provider: string;
  cost: number;
  status: 'generating' | 'completed' | 'failed';
}

interface VideoProvider {
  id: string;
  name: string;
  generate(req: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  extend(videoUrl: string, prompt: string): Promise<VideoGenerationResponse>;
  edit(videoUrl: string, instruction: string): Promise<VideoGenerationResponse>;
  getModels(): VideoModel[];
  getPrice(modelId: string): ModelPrice;
}

interface VideoModel {
  id: string;
  name: string;
  capabilities: string[];    // ['text-to-video', 'image-to-video', 'extend']
  maxDuration: number;
  resolutions: string[];
}

interface ModelPrice {
  perVideo: number;
  perSecond: number;
  currency: 'USD';
}

interface VideoClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  prompt: string;
  model: string;
  provider: string;
  cost: number;
  createdAt: Date;
}

interface Collection {
  id: string;
  name: string;
  clips: VideoClip[];
  createdAt: Date;
}
```

### Fluxo de Dados

```
Video Studio Page
  ├── Chat AI (OpenRouter LLM) → refinamento de prompt
  ├── Preview/Form → state (zustand store)
  └── Settings → provider/model/apiKey
        │
        ▼
POST /api/video/generate
        │
        ▼
Registry → resolve provider → provider.generate()
        │
        ▼
Response → videoUrl, cost, status
        │
        ▼
Timeline ← clip adicionado
Preview  ← video reproduzido
```

### Estado (Zustand)

```typescript
// components/video-studio/store.ts

interface VideoStudioState {
  // Provider/Model
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;  // provider -> key

  // Generation
  mode: 'text-to-video' | 'image-to-video' | 'extend' | 'scene' | 'edit';
  prompt: string;
  negativePrompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  camera: CameraConfig;
  duration: number;
  resolution: '720p' | '1080p';

  // Timeline
  clips: VideoClip[];

  // Collections
  collections: Collection[];

  // UI
  isGenerating: boolean;
  previewClip: VideoClip | null;

  // Actions
  setProvider: (id: string) => void;
  setModel: (id: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setMode: (mode: string) => void;
  setPrompt: (prompt: string) => void;
  setCamera: (camera: CameraConfig) => void;
  generate: () => Promise<void>;
  addToTimeline: (clip: VideoClip) => void;
  removeFromTimeline: (id: string) => void;
  reorderTimeline: (from: number, to: number) => void;
}
```

## Integracoes

### 1. Pagina Standalone
- Nova rota: `/dashboard/video-generator`
- Item no sidebar: "Video Studio" com icone de video
- Componente `video-studio/index.tsx` monta o layout completo

### 2. Integracao com Artigos
- No editor de artigos (`article-editor.tsx`), botao "Gerar Video"
- Abre o Video Studio com prompt pre-preenchido (resumo do artigo)
- Usa o titulo + resumo do artigo como base do prompt

### 3. Integracao com Carrossel Studio
- No carrossel, opcao "Converter em Video"
- Envia slides como imagens sequenciais para Image-to-Video
- Usa o modo `scene` do provider para compor os slides

### 4. Sem Persistencia no Banco
- Videos ficam apenas na memoria do browser (session state)
- Collections sao salvas no localStorage
- Sem necessidade de migration no banco

## API Keys

- Cada provider tem seu proprio input de API key
- Keys sao salvas no state do componente (nao no banco)
- Na chamada API, a key e passada no header/body para o provider
- Providers sem key configurada mostram mensagem de erro

## Precos

- Cada provider expoe seus modelos e precos via `getModels()` e `getPrice()`
- Na sidebar, exibe: nome do modelo, capacidades, custo por video, custo por segundo
- Usuario escolhe o modelo que melhor se encaixa no seu orcamento

## Limitacoes Conhecidas

- **Duracao maxima por clip**: Depende do provider (tipicamente 4-8s)
- **Consistencia de personagens**: Depende da qualidade do provider
- **Sem audio nativo**: Audio deve ser adicionado separadamente (pode usar o TTS existente)
- **Sem custom audio upload**: Limitacao dos providers de API
- **Resolucao**: Limitada pelo provider (720p-1080p)
- **Custo**: Cada geracao consome credits do provider

## Componentes Existentes Reutilizados

- `lib/ai/providers/openrouter.ts` — para o chat AI
- `lib/images/registry.ts` — padrao de registry para video providers
- `lib/images/providers/*.ts` — padrao de providers
- `components/dashboard-shell.tsx` — sidebar e layout
- `lib/env.ts` — configuracao de environment variables
- Zustand — estado global do studio
