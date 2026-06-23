import { ArticleForm } from "@/components/article-form";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewArticlePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Novo artigo</h1>
        <ArticleForm />
      </div>
    </DashboardShell>
  );
}
