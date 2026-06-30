# Coolify Deploy - Design Spec

## Objetivo

Estabilizar o deploy do `Atlas Forge AI` no `Coolify` usando `Docker Compose` em uma VPS unica, garantindo que o app principal suba junto com os servicos auxiliares e receba defaults internos suficientes para funcionar sem depender de configuracao manual excessiva no painel.

## Problema atual

O repositorio ja possui `Dockerfile` e `docker-compose.yaml`, mas o servico `app` no compose atual nao recebe as variaveis minimas de runtime para:

- conectar no `ChromaDB`;
- conectar no `renderer`;
- conectar no `SearXNG`;
- abrir o banco SQLite com persistencia.

Com isso, o build pode concluir, mas o container do app pode falhar ao iniciar no `Coolify` por falta de configuracao ou por usar fallbacks locais incorretos.

## Objetivos

- manter `Docker Compose` como estrategia principal de deploy no `Coolify`;
- subir `app`, `chromadb`, `renderer` e `searxng` no mesmo stack;
- configurar URLs internas por nome de servico no compose;
- persistir o banco SQLite do app via volume;
- reduzir a necessidade de preencher variaveis internas manualmente no painel;
- manter secrets externos, chaves de IA e integracoes de terceiros configuraveis no `Coolify`.

## Fora do escopo

- migrar SQLite para Postgres;
- trocar `Coolify` por `Nixpacks` ou deploy sem Docker;
- redesenhar o fluxo de geracao de artigos;
- alterar a arquitetura de dominio da aplicacao;
- automatizar provisionamento de DNS.

## Abordagem aprovada

### Opcao recomendada: defaults internos no compose

O `docker-compose.yaml` passa a carregar defaults internos entre containers para que o `app` consiga subir no `Coolify` com o minimo de configuracao adicional:

- `DATABASE_URL=file:/app/data/data.db`
- `CHROMADB_URL=http://chromadb:8000`
- `RENDERER_URL=http://renderer:3003`
- `SEARXNG_URL=http://searxng:8080`
- `AUTH_SECRET` continua podendo vir do painel, mas o app mantem fallback local de desenvolvimento quando nao informado

Essa abordagem preserva a configuracao de secrets externos no `Coolify`, mas elimina a dependencia de preencher URLs internas manualmente.

## Mudancas propostas

### 1. `docker-compose.yaml`

O compose deve:

- manter o servico `app` como servico principal do stack;
- definir as envs internas do `app`;
- adicionar um volume persistente para o SQLite em `/app/data`;
- manter `chromadb` com volume proprio;
- manter `renderer` e `searxng` acessiveis pela rede interna do compose;
- continuar compativel com o `Load Compose File` do `Coolify`.

Estrutura esperada para o `app`:

```yaml
app:
  build: .
  restart: unless-stopped
  environment:
    - NODE_ENV=production
    - DATABASE_URL=file:/app/data/data.db
    - CHROMADB_URL=http://chromadb:8000
    - RENDERER_URL=http://renderer:3003
    - SEARXNG_URL=http://searxng:8080
  volumes:
    - app-data:/app/data
  depends_on:
    - searxng
    - chromadb
    - renderer
```

### 2. `.env.example`

O arquivo deve documentar com clareza:

- valores locais para uso fora de containers;
- valores internos para uso no `Coolify`;
- quais variaveis sao obrigatorias para deploy;
- quais variaveis sao opcionais e podem ser habilitadas depois.

O objetivo nao e forcar o compose a depender de `.env`, mas deixar a documentacao de runtime consistente com o stack real.

### 3. Fallbacks de runtime

Hoje existem fallbacks inconsistentes para `SearXNG`, incluindo um caso com `http://localhost:8888`. Esses fallbacks devem ser normalizados para evitar comportamento diferente entre ambiente local e container.

Direcao aprovada:

- quando houver env explicita, ela vence;
- quando nao houver env, o fallback deve usar a mesma porta padrao documentada no projeto;
- nao deve existir fallback divergente para `8888` se o stack e a documentacao usam `8080`.

### 4. Persistencia local do app

O SQLite do app deve ser salvo em volume montado no container principal. Isso evita perder dados a cada recreacao do servico no `Coolify`.

Local aprovado:

- caminho no container: `/app/data/data.db`
- volume no compose: `app-data`

## Fluxo de deploy esperado

1. O `Coolify` carrega `docker-compose.yaml` do repositorio.
2. O build do `app` usa o `Dockerfile` multi-stage ja existente.
3. Os servicos `chromadb`, `renderer` e `searxng` sobem na mesma rede interna.
4. O `app` inicia com as URLs internas ja resolvidas por nome de servico.
5. O usuario configura no painel apenas secrets externos e chaves de integracao, como `OPENROUTER_API_KEY`, `DEEPGRAM_API_KEY`, `FAL_KEY` e credenciais opcionais.

## Tratamento de falhas

- Se `renderer` nao responder, as rotas dependentes devem falhar de forma controlada sem derrubar o boot do app.
- Se `SearXNG` nao responder, as rotas de busca devem retornar erro tratavel sem impedir o restante do painel.
- Se `ChromaDB` nao responder, a busca semantica pode degradar, mas o app nao deve falhar no boot apenas por indisponibilidade temporaria do servico.
- Se `DATABASE_URL` nao existir, isso e erro de configuracao do container e deve ser corrigido no compose, nao mascarado em runtime.

## Verificacao

Antes de considerar a implementacao concluida, a validacao deve cobrir:

- `docker compose -f docker-compose.yaml config`
- consistencia de envs em `.env.example`
- diagnosticos do editor nos arquivos alterados
- verificacao de que nao ha referencia restante a fallback de `SearXNG` em `localhost:8888`

## Resultado esperado

Ao final, o repositorio deve ficar pronto para um deploy em `Coolify` com `Docker Compose`, com menos configuracao manual, menor chance de falha de runtime e comportamento alinhado entre documentacao, compose e codigo.
