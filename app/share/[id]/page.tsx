import { db } from "@/lib/db/client";
import { generatedArticles, articleProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Tag, Globe, Library, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch article project
  const [project] = await db
    .select()
    .from(articleProjects)
    .where(eq(articleProjects.id, id))
    .limit(1);

  if (!project) {
    notFound();
  }

  // Fetch generated article content
  const [article] = await db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.articleProjectId, id))
    .limit(1);

  if (!article) {
    notFound();
  }

  // Parse tags and outline if present
  let tags: string[] = [];
  try {
    tags = JSON.parse(article.tagsJson || "[]");
  } catch {}

  let outline: string[] = [];
  try {
    outline = JSON.parse(article.outlineJson || "[]");
  } catch {}

  const formattedDate = new Date(article.createdAt || Date.now()).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] -z-10" />
      <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px] -z-10" />

      {/* Premium Header / Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              PublisherPilot
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              Artigo Compartilhado
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition"
          >
            Entrar no Painel
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        
        {/* Article Body */}
        <article className="space-y-8">
          {/* Metadata Banner */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {project.niche}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight text-white">
              {article.title}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-3xl border border-zinc-900 bg-zinc-900/30 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Publicado</p>
                <p className="text-xs font-medium text-zinc-300">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Idioma</p>
                <p className="text-xs font-medium text-zinc-300 uppercase">{article.language}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Library className="h-5 w-5 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tom de Voz</p>
                <p className="text-xs font-medium text-zinc-300 capitalize">{project.editorialTone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tamanho</p>
                <p className="text-xs font-medium text-zinc-300">{project.desiredLength}</p>
              </div>
            </div>
          </div>

          <hr className="border-zinc-900" />

          {/* Rendered HTML Content */}
          <div 
            className="prose prose-invert prose-zinc max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-6
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-li:text-zinc-300
              prose-a:text-emerald-400 hover:prose-a:text-emerald-300
              prose-figcaption:text-zinc-500 prose-figcaption:text-center prose-figcaption:mt-2"
            dangerouslySetInnerHTML={{ __html: article.htmlContent || "" }}
          />
        </article>

        {/* Sidebar Info & Outline */}
        <aside className="space-y-6">
          {/* Outline Card */}
          {outline.length > 0 && (
            <div className="sticky top-28 rounded-3xl border border-zinc-900 bg-zinc-900/20 p-6 space-y-4 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Estrutura
              </h3>
              <nav className="space-y-2">
                {outline.map((item, index) => (
                  <div 
                    key={index}
                    className="text-xs text-zinc-500 hover:text-zinc-300 py-1 transition flex items-start gap-2"
                  >
                    <span className="text-emerald-500">·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </nav>

              {/* Tags Section inside Sidebar */}
              {tags.length > 0 && (
                <div className="border-t border-zinc-900 pt-4 space-y-3">
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span 
                        key={tag}
                        className="rounded-lg bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

      </main>
    </div>
  );
}
