# ArticleForge Studio - Design da V1

## Visao geral

`ArticleForge Studio` sera uma plataforma web editorial para pesquisa, geracao, edicao e exportacao de artigos com IA. A V1 sera entregue como um app `Next.js App Router` com `TypeScript`, `Tailwind CSS`, `shadcn/ui`, `Turso/libSQL` e `Drizzle ORM`, com foco no fluxo principal:

1. criar um projeto de artigo;
2. pesquisar fontes reais na web;
3. escolher provider e modelo de IA;
4. gerar artigo estruturado;
5. editar o resultado;
6. exportar em `Markdown`, `HTML` e `PDF`.

A V1 nao tera autenticacao obrigatoria. Em vez disso, usara configuracoes globais da instancia, mas a modelagem ja nascera preparada para login, multiusuario, publicacao multicanal e automacoes editoriais futuras.

## Objetivos da V1

- entregar um webapp funcional, sem dependencia de terminal como interface principal;
- suportar `OpenRouter` como provider principal de IA;
- suportar `OpenAI` como provider secundario, funcional na mesma arquitetura;
- suportar `DuckDuckGo`, `SearXNG` e modo combinado de pesquisa;
- salvar projetos, fontes, artigos, exportacoes e jobs no `Turso`;
- permitir edicao manual apos a geracao;
- exportar em `Markdown`, `HTML` e `PDF`;
- preparar a base para novos search providers, AI providers, exporters e publishers;
- preparar a arquitetura para publicacao futura e automacoes baseadas em jobs persistidos.

## Fora do escopo da V1

- autenticacao e autorizacao completas;
- publicacao real em WordPress, Ghost, Medium, Webflow, Strapi ou API generica;
- automacoes agendadas completas;
- colaboracao em equipe, comentarios e versionamento editorial multiusuario;
- cobranca, billing ou controle de consumo por usuario.

## Decisoes de produto aprovadas

- V1 sem login, com estrutura preparada para login futuro;
- `OpenRouter` como provider principal da V1;
- `OpenAI` como provider secundario, ja funcional;
- pesquisa com fallback: se um provider falhar, o sistema continua com os demais disponiveis e registra o erro;
- arquitetura preparada desde o inicio para expansao de funcionalidades;
- prioridade estrutural futura em `publicacao multicanal` e `automacoes editoriais`;
- V1 com `jobs persistidos no banco` desde o inicio;
- usuario da instancia podera informar sua propria chave de IA;
- prioridade de resolucao de credenciais:
  1. chave salva pelo usuario da instancia no banco;
  2. fallback local temporario quando necessario;
  3. chave padrao da plataforma via variaveis de ambiente.

## Arquitetura da aplicacao

O sistema sera um monolito modular em `Next.js`, com fronteiras de dominio explicitas. A UI, as integracoes externas e a persistencia nao deverao ficar acopladas diretamente.

### Estrutura proposta

```text
articleforge-studio/
├─ app/
│  ├─ dashboard/
│  ├─ articles/
│  │  ├─ new/
│  │  └─ [id]/
│  ├─ settings/
│  ├─ exports/
│  ├─ api/
│  │  ├─ articles/
│  │  ├─ generate/
│  │  ├─ search/
│  │  ├─ models/
│  │  ├─ export/
│  │  └─ jobs/
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ article-editor.tsx
│  ├─ article-form.tsx
│  ├─ dashboard-shell.tsx
│  ├─ export-buttons.tsx
│  ├─ model-selector.tsx
│  ├─ provider-selector.tsx
│  ├─ source-list.tsx
│  └─ ui/
├─ lib/
│  ├─ db/
│  │  ├─ client.ts
│  │  ├─ schema.ts
│  │  └─ migrations/
│  ├─ jobs/
│  ├─ article/
│  ├─ search/
│  ├─ ai/
│  ├─ export/
│  ├─ publishers/
│  └─ utils.ts
├─ prompts/
├─ public/
├─ drizzle.config.ts
├─ .env.example
└─ README.md
```

### Principios arquiteturais

- a UI dispara acoes e consulta estados, mas nao implementa regras de provider;
- `search`, `generate`, `export` e `publish` sao fluxos separados;
- qualquer integracao externa entra por contrato interno;
- novos providers devem ser adicionados por adapter e registry, sem mexer no fluxo central;
- jobs e estado de workflow vivem no banco, nao apenas em memoria.

## Fluxo principal da V1

1. usuario abre `/articles/new`;
2. preenche briefing editorial;
3. escolhe motores de busca, provider de IA e modelo;
4. o sistema cria um `ArticleProject`;
5. o sistema enfileira `job` de pesquisa;
6. o sistema coleta e normaliza fontes;
7. o sistema enfileira `job` de geracao;
8. o provider de IA gera JSON estruturado;
9. a resposta e validada e persistida em `GeneratedArticle`;
10. o usuario acessa `/articles/[id]` para editar e exportar;
11. exportacoes geram registros em `ExportHistory`.

## Modelo de dados

### `user_settings`

Configuracoes globais da instancia para a V1:

- idioma padrao;
- tamanho padrao;
- tom editorial padrao;
- dominios bloqueados;
- preferencia de pesquisa;
- preferencia de provider de IA;
- preferencia de modelo.

No futuro, essa entidade podera ser migrada para escopo de usuario ou workspace.

### `api_providers`

Configura provider e credenciais por integracao:

- `providerKey` (`openrouter`, `openai`, `duckduckgo`, `searxng`, etc.);
- `displayName`;
- `baseUrl`;
- `isEnabled`;
- `apiKeyEncrypted` ou campo equivalente de armazenamento seguro;
- `sourceType` (`user`, `env`, `local-fallback`);
- `metadataJson`.

Observacao: como a V1 nao tera login, essa configuracao sera por instancia. O contrato deve permitir escopo futuro por usuario ou workspace.

### `ai_models`

Cache local de modelos descobertos:

- provider;
- `modelId`;
- `name`;
- `slug`;
- `contextWindow`;
- `pricingJson`;
- `isFavorite`;
- `isActive`;
- `lastSyncedAt`.

### `article_projects`

Armazena o briefing e estado do trabalho:

- tema;
- nicho livre;
- idioma;
- tom editorial;
- tipo de artigo;
- tamanho desejado;
- quantidade de fontes;
- motores de busca escolhidos;
- provider de IA;
- modelo de IA;
- status do workflow;
- erro atual, se existir.

Status iniciais previstos:

- `draft`
- `queued`
- `researching`
- `generating`
- `ready`
- `exporting`
- `failed`

### `article_sources`

Cada fonte coletada por pesquisa:

- `articleProjectId`;
- `title`;
- `url`;
- `domain`;
- `snippet`;
- `publishedAt` quando disponivel;
- `searchProvider`;
- `relevanceScore`;
- `dedupeHash`.

### `generated_articles`

Conteudo estruturado e derivados:

- `articleProjectId`;
- `title`;
- `slug`;
- `language`;
- `niche`;
- `excerpt`;
- `metaDescription`;
- `tagsJson`;
- `outlineJson`;
- `intro`;
- `sectionsJson`;
- `factsJson`;
- `faqJson`;
- `conclusion`;
- `sourcesJson`;
- `rawJson`;
- `markdownContent`;
- `htmlContent`.

### `export_history`

Historico de exportacoes:

- `articleProjectId`;
- `generatedArticleId`;
- `format` (`markdown`, `html`, `pdf`);
- `status`;
- `fileName`;
- `filePath` ou referencia ao artefato;
- `errorMessage`.

### `publish_targets`

Configuracao de destinos futuros:

- `targetType` (`wordpress`, `ghost`, `medium`, `generic-api`, etc.);
- `name`;
- `isEnabled`;
- `configJson`;
- `lastValidatedAt`;
- `notes`.

Na V1, essa entidade existira sem execucao completa de publicacao.

### `job_queue`

Fila persistida para orquestrar trabalho assincrono:

- `type` (`search`, `generate`, `export`, `publish`);
- `status` (`queued`, `running`, `completed`, `failed`, `retrying`);
- `payloadJson`;
- `attempts`;
- `maxAttempts`;
- `scheduledAt`;
- `startedAt`;
- `finishedAt`;
- `errorMessage`.

## Estrategia de jobs

A V1 ja nascera com processamento por jobs persistidos no banco. Nao sera introduzido `Redis` nem fila externa agora.

### Comportamento

- a UI cria entidades e enfileira jobs;
- um worker interno processa jobs do banco;
- pesquisa, geracao e exportacao rodam em etapas independentes;
- o estado do projeto e atualizado conforme o progresso;
- falhas sao registradas com detalhes suficientes para reenfileirar e depurar.

### Motivacao

Isso prepara o terreno para:

- publicacao futura por destino;
- cadeias de automacao editorial;
- retentativas controladas;
- observabilidade do pipeline;
- expansao para workers separados mais adiante, sem reescrever o dominio.

## Contratos internos

### `SearchProvider`

Interface esperada:

- `name`
- `search(query, options)`

Implementacoes iniciais:

- `DuckDuckGoSearchProvider`
- `SearxngSearchProvider`

Requisitos:

- resposta normalizada;
- suporte a erro padronizado;
- suporte a combinacao de providers;
- deduplicacao por URL/hash/canonicalizacao;
- score de relevancia;
- bloqueio de dominios.

### `AiProvider`

Interface esperada:

- `name`
- `listModels()`
- `generateArticle(prompt, options)`

Implementacoes iniciais:

- `OpenRouterProvider`
- `OpenAIProvider`

Requisitos:

- descoberta de modelos quando possivel;
- fallback de catalogo quando a API de modelos falhar;
- retorno padronizado para a camada de orquestracao;
- suporte a credenciais da plataforma e da instancia.

### `ExportProvider`

Interface esperada:

- `export(article, format)`

Implementacoes iniciais:

- `MarkdownExporter`
- `HtmlExporter`
- `PdfExporter`

### `Publisher`

Contrato futuro:

- `validateConfig`
- `publish`
- `update`
- `unpublish`

Implementacoes placeholder:

- `wordpress.ts`
- `ghost.ts`
- `medium.ts`
- `generic-api.ts`

## Estrategia de extensibilidade

O sistema deve permitir novos providers por registro central, sem alterar a UX principal nem o pipeline base.

### Regras

- novos `SearchProvider` podem ser adicionados por adapter;
- novos `AiProvider` podem ser adicionados por adapter;
- novos `ExportProvider` podem ser adicionados por adapter;
- novos `Publisher` podem ser adicionados por adapter;
- a UI consome metadados do registry, nao condicionais acopladas a cada provider;
- jobs operam sobre `type` e `payload`, nao sobre nomes hardcoded de providers.

Isso deve permitir expansao futura para `Brave Search`, `Serper`, `Tavily`, outros LLMs, destinos de publicacao e automacoes encadeadas.

## Pesquisa web

O usuario podera escolher:

- `DuckDuckGo`
- `SearXNG`
- `Ambos`

### Regras de funcionamento

- se ambos forem escolhidos, os resultados serao mesclados;
- fontes duplicadas serao removidas;
- os resultados receberao score de relevancia;
- dominios bloqueados serao ignorados;
- se um provider falhar, o sistema continua com os demais disponiveis;
- a falha parcial fica registrada no job e refletida na UI.

### Estrutura de fonte normalizada

- titulo;
- url;
- dominio;
- snippet;
- data, quando disponivel;
- provider de busca;
- score de relevancia.

## IA e geracao de artigo

### Providers

- `OpenRouter` sera o principal da V1;
- `OpenAI` sera secundario, mas funcional;
- o usuario escolhe provider e modelo antes da geracao.

### Catalogo de modelos

#### OpenRouter

- buscar modelos via endpoint oficial;
- exibir `name`, `id`, `contexto` e `preco` quando disponiveis;
- permitir pesquisa no dropdown;
- permitir favoritar modelos.

#### OpenAI

- buscar modelos via API quando possivel;
- usar fallback manual se necessario.

### Prompt de geracao

O prompt principal ficara em `prompts/article-generation.md` e instruira a IA a:

- escrever no idioma escolhido;
- respeitar nicho e tom editorial;
- usar fontes apenas como referencia;
- nao copiar conteudo literalmente;
- nao inventar fontes;
- citar apenas URLs realmente coletadas;
- produzir texto original e bem estruturado;
- incluir FAQ, `meta description` e tags;
- retornar apenas JSON valido;
- nao retornar Markdown fora do JSON.

### Formato de saida esperado

```json
{
  "title": "",
  "slug": "",
  "language": "",
  "niche": "",
  "excerpt": "",
  "metaDescription": "",
  "tags": [],
  "outline": [],
  "intro": "",
  "sections": [
    {
      "heading": "",
      "body": "",
      "sourceUrls": []
    }
  ],
  "facts": [],
  "faq": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "conclusion": "",
  "sources": [
    {
      "title": "",
      "url": "",
      "domain": ""
    }
  ]
}
```

Toda resposta da IA deve passar por validacao `Zod` antes de persistencia.

## Credenciais e configuracao de providers

### Comportamento da V1

O app suportara:

- chave padrao da plataforma por variavel de ambiente;
- chave informada pelo usuario da instancia em `/settings`;
- fallback local temporario enquanto a experiencia completa ainda estiver evoluindo.

### Ordem de resolucao

1. chave salva pelo usuario no banco;
2. fallback local temporario;
3. chave da plataforma via env.

### Restricoes

- nenhuma chave sera exposta no client;
- toda chamada a provider ocorrera no servidor;
- a modelagem deve permitir migrar depois para credenciais por usuario ou workspace.

## Interface e UX

### Direcao visual

O visual sera de um SaaS editorial moderno:

- limpo;
- profissional;
- responsivo;
- com foco em legibilidade;
- com modo escuro opcional;
- sem parecer ferramenta de terminal ou playground tecnico.

### Paginas

#### `/`

Landing curta do produto com CTA para entrar no fluxo principal.

#### `/dashboard`

Lista de projetos, status e acoes principais.

#### `/articles/new`

Formulario por etapas:

1. `Brief`
2. `Research`
3. `AI`
4. `Review`

Campos obrigatorios:

- tema;
- nicho;
- idioma;
- tom editorial;
- tamanho desejado;
- tipo de artigo;
- quantidade de fontes;
- motor de busca;
- provider de IA;
- modelo.

Idiomas iniciais:

- Portugues do Brasil
- Ingles
- Espanhol
- Frances
- Italiano
- Alemao

Tipos de artigo:

- Artigo informativo
- Guia completo
- Lista
- Review
- Comparativo
- Noticia comentada
- Tutorial
- Artigo SEO
- Artigo evergreen
- Roteiro para video

Tons editoriais:

- Profissional
- Jornalistico
- Casual
- Opinativo
- Tecnico
- Didatico
- Provocativo
- Elegante
- Espiritual
- Comercial

#### `/articles/[id]`

Tela principal de trabalho:

- titulo;
- resumo;
- editor Markdown;
- preview renderizado;
- visualizacao HTML;
- lista de fontes usadas;
- tags;
- `meta description`;
- historico de jobs;
- acoes para regenerar, melhorar, mudar tom, expandir, resumir e exportar.

#### `/settings`

Configuracoes da instancia:

- providers;
- chaves;
- endpoints;
- modelos favoritos;
- preferencias;
- bloqueio de dominios;
- diagnostico basico de integracoes.

#### `/exports`

Historico de exportacoes, status e download dos arquivos gerados.

## Edicao e transformacao do artigo

Depois da geracao, o sistema deve abrir uma experiencia de edicao real.

### Requisitos

- edicao manual do conteudo;
- representacao em Markdown;
- preview HTML;
- persistencia do artigo editado;
- acoes de refinamento por IA:
  - regenerar;
  - melhorar texto;
  - mudar tom;
  - expandir;
  - resumir.

Essas acoes podem virar novos jobs da fila, preservando rastreabilidade.

## Exportacao

### `Markdown`

- gerar `.md` limpo;
- incluir titulo, estrutura e fontes.

### `HTML`

- gerar documento HTML completo;
- incluir CSS basico inline ou template simples;
- deixar pronto para colar em CMS.

### `PDF`

- gerar PDF com layout limpo;
- incluir titulo, secoes e fontes;
- usar biblioteca compativel com `Next.js`.

Cada exportacao deve registrar seu proprio item em `export_history`.

## Publicacao futura

WordPress e demais destinos nao serao implementados de ponta a ponta na V1, mas a estrutura precisa existir desde agora.

### Pasta esperada

```text
lib/publishers/
├─ wordpress.ts
├─ ghost.ts
├─ medium.ts
└─ generic-api.ts
```

### WordPress

Deve existir como placeholder documentado, com TODOs claros e previsao de:

- `WORDPRESS_URL`
- `WORDPRESS_USER`
- `WORDPRESS_APP_PASSWORD`

## API e validacao

### Regras tecnicas

- usar `API Routes` ou `Route Handlers` para integracoes e mutacoes;
- usar `Zod` para validacao de inputs e outputs;
- tratar erros externos com formato padrao;
- nunca expor segredos ao client;
- salvar artigos, fontes, jobs e exportacoes no banco;
- criar migrations do `Drizzle`;
- manter codigo modular.

## Variaveis de ambiente

`.env.example` deve incluir:

```env
DATABASE_URL=

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=ArticleForge Studio
OPENROUTER_SITE_URL=http://localhost:3000

SEARXNG_URL=
SEARXNG_API_KEY=

WORDPRESS_URL=
WORDPRESS_USER=
WORDPRESS_APP_PASSWORD=
```

## Tratamento de erros e observabilidade

### Tratamento de erros

- falhas de provider devem ser normalizadas;
- jobs falhos devem guardar erro explicito;
- a UI deve mostrar estados reais de erro e progresso;
- falhas parciais de pesquisa nao devem impedir geracao se houver fontes suficientes.

### Observabilidade da V1

- status por projeto;
- status por job;
- historico de exportacoes;
- diagnostico basico de providers;
- mensagens de erro legiveis na UI.

## Criterios de aceite da V1

A primeira versao funcional sera considerada pronta quando permitir:

1. criar um projeto de artigo pela interface web;
2. escolher idioma, nicho, tom, tipo, busca, provider de IA e modelo;
3. pesquisar com `DuckDuckGo`, `SearXNG` ou ambos;
4. gerar artigo real com `OpenRouter` como principal;
5. usar `OpenAI` no mesmo fluxo como opcao secundaria;
6. salvar projeto, fontes, artigo e jobs no `Turso`;
7. editar o conteudo gerado;
8. exportar em `Markdown`, `HTML` e `PDF`;
9. consultar o historico de exportacoes;
10. manter a base pronta para novos providers e publishers.

## Riscos conhecidos e mitigacoes

### Descoberta de modelos

Nem todos os providers oferecem descoberta estavel de modelos. Mitigacao: cache local com sincronizacao e fallback manual.

### Pesquisa instavel

Motores de busca podem falhar ou limitar resposta. Mitigacao: fallback parcial, dedupe e logs por job.

### Chaves sem login

Sem autenticacao na V1, as configuracoes sao da instancia. Mitigacao: modelagem preparada para evolucao por usuario/workspace.

### Jobs no proprio banco

Fila em `libSQL` atende a V1, mas pode exigir evolucao futura para maior escala. Mitigacao: separar contrato de job runner desde o inicio.

## Evolucao planejada apos a V1

- login e multiusuario;
- credenciais por usuario ou workspace;
- publicacao real em WordPress e outros canais;
- automacoes editoriais encadeadas;
- calendarios e agendamento;
- briefing de SEO, clusters e planejamento;
- colaboracao e historico de versoes;
- novos providers de busca, IA, exportacao e publicacao.
