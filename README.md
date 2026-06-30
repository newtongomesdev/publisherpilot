# Atlas Forge AI

Plataforma editorial completa para gerar, editar e publicar artigos com IA.

## Funcionalidades

- **Geração de Artigos** — IA via OpenRouter com busca de fontes automática
- **Editor WYSIWYG** — TipTap com sugestões semânticas em tempo real
- **Editor de Slides** — Canvas com layers, timeline e render PNG via Puppeteer
- **Geração de Imagens** — Fal.ai e OpenRouter com busca semântica
- **Busca Web** — SearXNG com 15 engines (Google, Bing, DuckDuckGo, Pexels, Pixabay)
- **TTS** — Deepgram, OpenRouter e Google Text-to-Speech
- **Transcrição** — Deepgram com indexação automática
- **Carrossel** — Geração de carrossel para redes sociais com IA
- **Gráficos** — QuickCharts com 12 tipos de gráficos
- **Publicação** — WordPress e exportação HTML/Markdown/PDF
- **ChromaDB** — 8 collections para busca semântica

## Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, SQLite (Turso)
- **IA:** OpenRouter, Fal.ai, Deepgram
- **Docker:** ChromaDB, SearXNG, Renderer (Puppeteer)

## Instalação

```bash
# Clonar
git clone https://github.com/SEU_USER/atlas-forge-ai.git
cd atlas-forge-ai

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves de API

# Iniciar Docker (ChromaDB + SearXNG + Renderer)
docker compose up -d

# Iniciar desenvolvimento
npm run dev
```

## Variáveis de Ambiente

```
DATABASE_URL=file:./data.db
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=fal-...
DEEPGRAM_API_KEY=...
SEARXNG_URL=http://localhost:8080
CHROMADB_URL=http://localhost:8100
RENDERER_URL=http://localhost:3003
```

## Docker

```bash
docker compose up -d          # Sobe ChromaDB, SearXNG, Renderer
docker compose ps              # Verifica status
docker compose down            # Para tudo
```

## Estrutura

```
app/
  api/                    # 48 API routes
    articles/             # CRUD artigos
    auth/                 # Login/logout
    carousel/             # Carrossel IA
    charts/               # QuickCharts
    generate/             # Geração de artigos
    images/               # Imagens Fal.ai/OpenRouter
    publish/              # Publicação WordPress
    search/               # SearXNG + ChromaDB
    tts/                  # Text-to-speech
  dashboard/              # Páginas do painel
    editor/               # Editor de slides
    images/               # Geração de imagens
    search/               # Busca web + semântica
    quickchart/           # Gráficos
components/               # Componentes React
lib/
  ai/                     # ChromaDB + providers IA
  db/                     # Queries SQLite
  jobs/                   # Workers em background
  images/                 # Providers de imagem
  publishers/             # WordPress
searxng/                  # Configuração SearXNG
scripts/renderer/         # Puppeteer Docker
```

## ChromaDB

8 collections para busca semântica:

| Collection | Uso |
|---|---|
| `articles` | Artigos gerados |
| `images` | Imagens geradas |
| `slides` | Slides de carrossel |
| `searches` | Histórico de buscas |
| `competitors` | Conteúdo de concorrentes |
| `exports` | Artigos exportados |
| `transcriptions` | Transcrições de áudio |
| `charts` | Gráficos QuickCharts |

## Deploy

### Coolify + VPS

Use `docker-compose.yaml` como source of truth no `Coolify`.

O stack do compose inclui:

- `app` - aplicacao Next.js
- `chromadb` - banco vetorial para busca semantica
- `renderer` - servico Puppeteer para renderizar slides
- `searxng` - metasearch para busca web e de imagens

As URLs internas ja ficam definidas no proprio compose para o ambiente do `Coolify`:

- `DATABASE_URL=file:/app/data/data.db`
- `CHROMADB_URL=http://chromadb:8000`
- `RENDERER_URL=http://renderer:3003`
- `SEARXNG_URL=http://searxng:8080`

No painel do `Coolify`, configure apenas secrets externos e credenciais de provider, como:

- `AUTH_SECRET`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `FAL_KEY`
- credenciais opcionais de publicacao

### Local Docker support

```bash
docker compose up -d
docker compose ps
docker compose down
```

## Licença

MIT
