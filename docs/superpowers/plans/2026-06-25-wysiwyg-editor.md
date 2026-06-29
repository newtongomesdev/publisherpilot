# Editor WYSIWYG - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the textarea in ArticleEditor with a BlockNote WYSIWYG editor that supports rich text formatting, image insertion, and drag-and-drop reordering.

**Architecture:** BlockNote loads the existing `htmlContent` from the database, presents a visual editor with toolbar and floating menu, and saves changes back as both HTML and markdown via a PATCH endpoint.

**Tech Stack:** `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `turndown` (HTML→markdown)

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install BlockNote + turndown**

```bash
npm install @blocknote/core @blocknote/react @blocknote/mantine turndown
```

- [ ] **Step 2: Install turndown types**

```bash
npm install -D @types/turndown
```

- [ ] **Step 3: Verify installation**

```bash
npm ls @blocknote/core @blocknote/react @blocknote/mantine turndown
```

Expected: all packages listed with no errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add blocknote and turndown dependencies"
```

---

### Task 2: Create WysiwygEditor component

**Files:**
- Create: `components/wysiwyg-editor.tsx`

- [ ] **Step 1: Create the WysiwygEditor component**

```tsx
"use client";

import { useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import TurndownService from "turndown";

type WysiwygEditorProps = {
  initialHtml: string;
  onSave: (html: string, markdown: string) => void;
  onCancel: () => void;
};

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Keep bold/italic/lists intact
turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: (content) => `~~${content}~~`,
});

export function WysiwygEditor({ initialHtml, onSave, onCancel }: WysiwygEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Convert initial HTML to BlockNote blocks
  const editor = useCreateBlockNote({
    initialContent: htmlToBlocks(initialHtml),
  });

  function handleSave() {
    setIsSaving(true);
    try {
      const html = editor.document
        .map((block) => blockToHtml(block))
        .join("\n");
      const markdown = turndownService.turndown(html);
      onSave(html, markdown);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <BlockNoteView
        editor={editor}
        theme="dark"
        className="min-h-[500px] rounded-2xl border border-zinc-800 bg-zinc-900"
      />
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-zinc-700 px-6 py-2 font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Simple HTML to BlockNote blocks conversion
function htmlToBlocks(html: string) {
  if (!html || !html.trim()) {
    return [{ type: "paragraph" as const, content: [] }];
  }

  // If it's plain text, wrap in paragraph
  if (!html.includes("<")) {
    return [{ type: "paragraph" as const, content: [{ type: "text" as const, text: html, styles: {} }] }];
  }

  // Use a DOM parser to convert HTML to blocks
  const blocks: Array<Record<string, unknown>> = [];
  const div = document.createElement("div");
  div.innerHTML = html;

  for (const child of Array.from(div.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        blocks.push({
          type: "paragraph",
          content: [{ type: "text", text, styles: {} }],
        });
      }
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
      const level = parseInt(tag[1]);
      blocks.push({
        type: "heading",
        props: { level: Math.min(level, 6) as 1 | 2 | 3 | 4 | 5 | 6 },
        content: [{ type: "text", text: el.textContent ?? "", styles: extractStyles(el) }],
      });
    } else if (tag === "p") {
      blocks.push({
        type: "paragraph",
        content: inlineToContent(el),
      });
    } else if (tag === "ul" || tag === "ol") {
      for (const li of Array.from(el.querySelectorAll("li"))) {
        blocks.push({
          type: tag === "ul" ? "bulletListItem" : "numberedListItem",
          content: inlineToContent(li),
        });
      }
    } else if (tag === "blockquote") {
      blocks.push({
        type: "paragraph",
        props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
        content: [{ type: "text", text: el.textContent ?? "", styles: { italic: true } }],
      });
    } else if (tag === "pre") {
      const code = el.querySelector("code");
      blocks.push({
        type: "codeBlock",
        content: [{ type: "text", text: code?.textContent ?? el.textContent ?? "", styles: {} }],
      });
    } else if (tag === "figure" || tag === "img") {
      const img = tag === "img" ? el : el.querySelector("img");
      if (img) {
        const src = img.getAttribute("src") ?? "";
        const caption = el.querySelector("figcaption")?.textContent ?? "";
        blocks.push({
          type: "image",
          props: {
            url: src,
            caption,
            previewWidth: 768,
          },
        });
      }
    } else if (tag === "hr") {
      blocks.push({ type: "paragraph", content: [] });
    } else {
      // Fallback: treat as paragraph
      blocks.push({
        type: "paragraph",
        content: [{ type: "text", text: el.textContent ?? "", styles: {} }],
      });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph" as const, content: [] }];
}

function inlineToContent(el: HTMLElement): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [];
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) content.push({ type: "text", text, styles: {} });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as HTMLElement;
      const tag = child.tagName.toLowerCase();
      const styles = extractStyles(child);
      if (tag === "a") {
        // BlockNote doesn't have inline links in paragraph content by default,
        // so we treat them as styled text
        content.push({ type: "text", text: child.textContent ?? "", styles });
      } else if (tag === "strong" || tag === "b") {
        content.push({ type: "text", text: child.textContent ?? "", styles: { ...styles, bold: true } });
      } else if (tag === "em" || tag === "i") {
        content.push({ type: "text", text: child.textContent ?? "", styles: { ...styles, italic: true } });
      } else if (tag === "code") {
        content.push({ type: "text", text: child.textContent ?? "", styles: { ...styles, code: true } });
      } else if (tag === "del" || tag === "s") {
        content.push({ type: "text", text: child.textContent ?? "", styles: { ...styles, strike: true } });
      } else {
        content.push({ type: "text", text: child.textContent ?? "", styles });
      }
    }
  }
  return content.length > 0 ? content : [{ type: "text", text: "", styles: {} }];
}

function extractStyles(el: HTMLElement): Record<string, boolean> {
  const styles: Record<string, boolean> = {};
  if (el.tagName === "STRONG" || el.tagName === "B") styles.bold = true;
  if (el.tagName === "EM" || el.tagName === "I") styles.italic = true;
  if (el.tagName === "CODE") styles.code = true;
  if (el.tagName === "DEL" || el.tagName === "S" || el.tagName === "STRIKE") styles.strike = true;
  return styles;
}

function blockToHtml(block: Record<string, unknown>): string {
  const type = block.type as string;
  const content = (block.content as Array<Record<string, unknown>>) ?? [];
  const text = content.map((c) => {
    const t = c.text as string ?? "";
    const styles = (c.styles as Record<string, boolean>) ?? {};
    let html = escapeHtml(t);
    if (styles.bold) html = `<strong>${html}</strong>`;
    if (styles.italic) html = `<em>${html}</em>`;
    if (styles.code) html = `<code>${html}</code>`;
    if (styles.strike) html = `<del>${html}</del>`;
    return html;
  }).join("");

  switch (type) {
    case "heading": {
      const level = ((block.props as Record<string, unknown>)?.level as number) ?? 2;
      return `<h${level}>${text}</h${level}>`;
    }
    case "bulletListItem":
      return `<li>${text}</li>`;
    case "numberedListItem":
      return `<li>${text}</li>`;
    case "codeBlock":
      return `<pre><code>${content.map((c) => c.text as string ?? "").join("")}</code></pre>`;
    case "image": {
      const url = ((block.props as Record<string, unknown>)?.url as string) ?? "";
      const caption = ((block.props as Record<string, unknown>)?.caption as string) ?? "";
      if (!url) return "";
      return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }
    default:
      return `<p>${text}</p>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors related to `wysiwyg-editor.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/wysiwyg-editor.tsx
git commit -m "feat: add WysiwygEditor component with BlockNote"
```

---

### Task 3: Add PATCH endpoint for saving edited content

**Files:**
- Modify: `app/api/articles/[id]/route.ts`

- [ ] **Step 1: Add "update-content" action to the PATCH handler**

Read the current file at `app/api/articles/[id]/route.ts` and add the `update-content` action alongside the existing `regenerate` action.

```typescript
if (body.action === "update-content") {
  const { generatedArticles } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("@/lib/db");

  const htmlContent = body.htmlContent as string | undefined;
  const markdownContent = body.markdownContent as string | undefined;

  if (!htmlContent && !markdownContent) {
    return NextResponse.json({ ok: false, error: "No content provided" }, { status: 400 });
  }

  // Find the latest generated article for this project
  const [article] = await db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.articleProjectId, project.id))
    .orderBy(generatedArticles.createdAt)
    .limit(1);

  if (!article) {
    return NextResponse.json({ ok: false, error: "No generated article found" }, { status: 404 });
  }

  const updates: Record<string, string> = {};
  if (htmlContent) updates.htmlContent = htmlContent;
  if (markdownContent) updates.markdownContent = markdownContent;

  await db
    .update(generatedArticles)
    .set(updates)
    .where(eq(generatedArticles.id, article.id));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3: Commit**

```bash
git add app/api/articles/\[id\]/route.ts
git commit -m "feat: add update-content action to PATCH articles endpoint"
```

---

### Task 4: Integrate WysiwygEditor into ArticleEditor

**Files:**
- Modify: `components/article-editor.tsx`

- [ ] **Step 1: Update ArticleEditor to support WYSIWYG mode**

Replace the `<textarea>` with a conditional render that shows either the WysiwygEditor or the markdown textarea.

```tsx
"use client";

import { useState } from "react";
import { WysiwygEditor } from "@/components/wysiwyg-editor";

type ArticleEditorProps = {
  articleProjectId: string;
  title: string;
  markdown: string;
  htmlContent?: string;
  status: string;
};

export function ArticleEditor({ articleProjectId, title, markdown, htmlContent, status }: ArticleEditorProps) {
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");
  const [isEditing, setIsEditing] = useState(false);

  function showFeedback(msg: string, type: "success" | "error" | "info" = "info") {
    setFeedback(msg);
    setFeedbackType(type);
  }

  function handlePreview() {
    window.open(`/api/preview?id=${articleProjectId}`, "_blank");
  }

  function handlePrintPdf() {
    const previewUrl = `/api/preview?id=${articleProjectId}`;
    const printWindow = window.open(previewUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    }
  }

  async function handleSaveContent(html: string, markdownContent: string) {
    showFeedback("Salvando alterações...", "info");
    try {
      const response = await fetch(`/api/articles/${articleProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-content",
          htmlContent: html,
          markdownContent,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        showFeedback(payload.error ?? "Falha ao salvar.", "error");
        return;
      }
      showFeedback("Alterações salvas!", "success");
      setIsEditing(false);
    } catch {
      showFeedback("Erro ao salvar.", "error");
    }
  }

  async function handleExport(format: "markdown" | "html") {
    showFeedback(`Exportando ${format.toUpperCase()}...`, "info");
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleProjectId, format }),
    });

    if (!response.ok) {
      showFeedback("Falha ao exportar.", "error");
      return;
    }

    const payload = await response.json();
    const artifact = payload.artifact as {
      fileName: string;
      mimeType: string;
      encoding: "utf8" | "base64";
      content: string;
    };

    const href =
      artifact.encoding === "base64"
        ? `data:${artifact.mimeType};base64,${artifact.content}`
        : `data:${artifact.mimeType};charset=utf-8,${encodeURIComponent(artifact.content)}`;

    const link = document.createElement("a");
    link.href = href;
    link.download = artifact.fileName;
    link.click();
    showFeedback(`${artifact.fileName} pronto para download.`, "success");
  }

  async function handleExportHtmlStyled() {
    showFeedback("Gerando HTML estilizado...", "info");
    try {
      const response = await fetch(`/api/preview?id=${articleProjectId}`, {
        headers: { Accept: "text/html" },
      });
      if (!response.ok) {
        showFeedback("Falha ao gerar HTML.", "error");
        return;
      }
      const html = await response.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
      link.click();
      URL.revokeObjectURL(url);
      showFeedback("HTML estilizado baixado.", "success");
    } catch {
      showFeedback("Erro ao gerar HTML.", "error");
    }
  }

  async function handlePublish(targetType: "wordpress") {
    showFeedback("Publicando...", "info");
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleProjectId, targetType }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      publish?: { status?: string; url?: string };
    };

    if (!response.ok || !payload.ok) {
      showFeedback(payload.error ?? "Falha ao publicar.", "error");
      return;
    }

    showFeedback(
      payload.publish?.url
        ? `Publicado no WordPress: ${payload.publish.url}`
        : `Publicado com status ${payload.publish?.status ?? "desconhecido"}.`,
      "success",
    );
  }

  async function handleRegenerate() {
    if (!window.confirm("Tem certeza? O artigo atual sera apagado e um novo sera gerado com as mesmas configuracoes.")) return;
    showFeedback("Regenerando artigo...", "info");
    try {
      const response = await fetch(`/api/articles/${articleProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "regenerate" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        showFeedback(payload.error ?? "Falha ao regenerar.", "error");
        return;
      }
      showFeedback("Artigo regenerado! Redirecionando...", "success");
      window.location.href = "/dashboard/articles";
    } catch {
      showFeedback("Erro ao regenerar.", "error");
    }
  }

  const feedbackColors = {
    success: "text-emerald-400",
    error: "text-rose-400",
    info: "text-zinc-400",
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        {isEditing && htmlContent ? (
          <WysiwygEditor
            initialHtml={htmlContent}
            onSave={handleSaveContent}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <textarea
            className="min-h-[520px] w-full resize-none bg-transparent text-sm outline-none font-mono leading-relaxed"
            defaultValue={markdown}
            readOnly
          />
        )}
      </div>
      <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Painel editorial</h2>
        <p className="text-sm text-zinc-400">Status: {status}</p>

        {feedback && (
          <p className={`text-sm ${feedbackColors[feedbackType]}`}>{feedback}</p>
        )}

        {/* Edit button - prominent */}
        {!isEditing && (
          <button
            className="w-full rounded-full bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            onClick={() => setIsEditing(true)}
          >
            Editar artigo
          </button>
        )}

        {/* Preview button */}
        <button
          className="w-full rounded-full border border-emerald-700 bg-emerald-950/40 px-4 py-3 font-medium text-emerald-200 hover:bg-emerald-950/60 transition-colors"
          onClick={handlePreview}
        >
          Visualizar artigo
        </button>

        {/* PDF via Print */}
        <button
          className="w-full rounded-full border border-zinc-700 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
          onClick={handlePrintPdf}
        >
          Exportar PDF (imprimir)
        </button>

        {/* Download HTML styled */}
        <button
          className="w-full rounded-full border border-zinc-700 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
          onClick={handleExportHtmlStyled}
        >
          Baixar HTML estilizado
        </button>

        {/* Download Markdown */}
        <button
          className="w-full rounded-full border border-zinc-700 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
          onClick={() => handleExport("markdown")}
        >
          Baixar Markdown
        </button>

        <div className="border-t border-zinc-800 pt-4">
          <button
            className="w-full rounded-full border border-emerald-700 bg-emerald-950/40 px-4 py-3 font-medium text-emerald-200 hover:bg-emerald-950/60 transition-colors"
            onClick={() => handlePublish("wordpress")}
          >
            Publicar no WordPress
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <button
            className="w-full rounded-full border border-amber-700 bg-amber-950/40 px-4 py-3 font-medium text-amber-200 hover:bg-amber-950/60 transition-colors"
            onClick={handleRegenerate}
          >
            Regenerar artigo
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update the page that renders ArticleEditor to pass htmlContent**

Find where `<ArticleEditor />` is used and add the `htmlContent` prop. The prop comes from the `generatedArticles.htmlContent` field.

Search for `ArticleEditor` usage:
```bash
grep -rn "ArticleEditor" --include="*.tsx" .
```

Then update the parent component to pass `htmlContent={generatedArticle.htmlContent}`.

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4: Commit**

```bash
git add components/article-editor.tsx components/wysiwyg-editor.tsx
git commit -m "feat: integrate WysiwygEditor into ArticleEditor with save flow"
```

---

### Task 5: Test the full flow

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Generate an article (or use existing)**

Navigate to the dashboard and open an article that has content.

- [ ] **Step 3: Click "Editar artigo"**

Verify the BlockNote editor loads with the article content rendered as visual blocks.

- [ ] **Step 4: Test editing**

- Edit some text (bold, italic, headings)
- Verify toolbar works
- Try dragging a block

- [ ] **Step 5: Click "Salvar alterações"**

Verify the success feedback appears and the content is saved.

- [ ] **Step 6: Open preview**

Verify the saved changes appear in the preview.

- [ ] **Step 7: Export HTML**

Download the HTML and verify the edited content is correct.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete WYSIWYG editor integration"
```
