# Editor WYSIWYG - Design Spec

## Objetivo
Substituir o `<textarea>` de markdown bruto no article-editor por um editor visual WYSIWYG baseado em blocos (BlockNote), permitindo que o usuário edite o artigo com formatação visual, imagens e drag-and-drop antes de exportar.

## Escopo
- Edição visual de texto: negrito, itálico, títulos, parágrafos, listas, links, código
- Inserção e remoção de imagens dentro do editor
- Rearranjo de blocos via drag-and-drop
- Salvar alterações de volta ao banco (markdown + HTML)
- Toolbar visual com todas as funcionalidades

## Dependências
- `@blocknote/core` - Core do editor de blocos
- `@blocknote/react` - Bindings React
- `@blocknote/mantine` - UI do toolbar e floating menu

## Arquitetura

### Componente: `WysiwygEditor`
- Localização: `components/wysiwyg-editor.tsx`
- Props: `{ initialHtml: string; onSave: (html: string, markdown: string) => void }`
- Renderiza o BlockNote com toolbar e floating menu
- Converte HTML para blocos ao carregar
- Converte blocos para HTML + markdown ao salvar

### Conversão de dados
- **Carregar:** `htmlContent` do banco → BlockNote carrega blocos diretamente (suporta HTML)
- **Salvar:** BlockNote → extrair HTML via `editor.getHTML()` → converter HTML para Markdown via `turndown` → salvar ambos no banco

### Integração com ArticleEditor
- O `ArticleEditor` recebe `htmlContent` como prop adicional
- Substitui o `<textarea>` pelo `<WysiwygEditor />`
- Botão "Salvar alterações" no painel editorial que chama a API de update

### API de save
- Rota: `PATCH /api/articles/[id]` com `action: "update-content"`
- Aceita `htmlContent` e `markdownContent`
- Atualiza o registro `generatedArticles` correspondente

## O que NÃO muda
- Pipeline de geração de artigos (AI + search)
- Preview (/api/preview)
- Export (HTML, Markdown, PDF)
- Publicação (WordPress)
- Schema do banco (campos `markdownContent` e `htmlContent` já existem)

## Fluxo de uso
1. Artigo é gerado normalmente
2. Usuário abre o artigo no editor
3. Clica em "Editar artigo" → abre o WYSIWYG
4. Edita visualmente (texto, imagens, ordem)
5. Clica em "Salvar" → conteúdo é salvo no banco
6. Pode exportar/publicar o conteúdo editado
