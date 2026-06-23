# ArticleForge Studio

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Turso/libSQL
- Drizzle ORM
- OpenRouter API
- OpenAI API
- DuckDuckGo
- SearXNG

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill in `DATABASE_URL`
3. Add `OPENROUTER_API_KEY` and optional `OPENAI_API_KEY`
4. Run `npm install`
5. Run `npm run dev`

## Core routes

- `/dashboard`
- `/articles/new`
- `/articles/[id]`
- `/settings`
- `/exports`

## Current scope

- real article generation foundation
- editable article workflow shell
- markdown/html/pdf export providers
- database-backed jobs
- provider registry ready for expansion

## Future scope

- login
- per-user credentials
- real publishing targets
- automation pipelines
