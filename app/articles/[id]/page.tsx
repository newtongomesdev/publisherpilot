import { ArticleEditor } from "@/components/article-editor";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ArticlePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Editor do artigo</h1>
        <ArticleEditor />
      </div>
    </DashboardShell>
  );
}
