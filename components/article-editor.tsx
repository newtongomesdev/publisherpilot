"use client";

import { useState } from "react";
import { WysiwygEditor } from "@/components/wysiwyg-editor";
import { ContentSuggestions } from "@/components/content-suggestions";
import { Share2, Video } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  function showFeedback(msg: string, type: "success" | "error" | "info" = "info") {
    setFeedback(msg);
    setFeedbackType(type);
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}/share/${articleProjectId}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => showFeedback("Link de compartilhamento copiado!", "success"),
      () => showFeedback("Falha ao copiar o link.", "error")
    );
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
        {isEditing ? (
          <WysiwygEditor
            initialHtml={htmlContent ?? markdownToHtml(markdown)}
            onSave={handleSaveContent}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div
            className="article-preview min-h-[520px] w-full text-sm leading-relaxed prose prose-invert prose-zinc max-w-none overflow-y-auto max-h-[70vh]"
            dangerouslySetInnerHTML={{ __html: htmlContent ?? markdownToHtml(markdown) }}
          />
        )}
      </div>
      <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Painel editorial</h2>
        <ContentSuggestions text={markdown} />
        <p className="text-sm text-zinc-400">Status: {status}</p>

        {feedback && (
          <p className={`text-sm ${feedbackColors[feedbackType]}`}>{feedback}</p>
        )}

        {/* Edit button */}
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

        {/* Share button */}
        <button
          className="w-full rounded-full border border-zinc-700 bg-zinc-800/40 px-4 py-3 font-medium text-zinc-200 hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar artigo
        </button>

        {/* Video generation button */}
        <button
          className="w-full rounded-full border border-purple-700 bg-purple-950/40 px-4 py-3 font-medium text-purple-200 hover:bg-purple-950/60 transition-colors flex items-center justify-center gap-2"
          onClick={() => {
            const prompt = `Video resumo do artigo: ${title}`;
            router.push(`/dashboard/video-generator?prompt=${encodeURIComponent(prompt)}`);
          }}
        >
          <Video className="h-4 w-4" />
          Gerar Video
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

function markdownToHtml(md: string): string {
  if (!md) return "<p></p>";
  return md
    .split("\n\n")
    .filter((block) => block.trim())
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("## ")) return `<h2>${esc(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${esc(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("# ")) return `<h1>${esc(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split("\n").map((l) => `<li>${esc(l.replace(/^[-*]\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${esc(trimmed)}</p>`;
    })
    .join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
