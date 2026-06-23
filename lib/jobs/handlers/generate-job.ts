import { ensureAiProvidersRegistered } from "@/lib/ai/bootstrap";
import { getAiProvider } from "@/lib/ai/registry";
import { loadPromptFile } from "@/lib/ai/prompts";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import {
  getArticleProjectById,
  listProjectSources,
  saveGeneratedArticle,
  updateArticleProjectStatus,
} from "@/lib/db/queries";

export async function runGenerateJob(payload: Record<string, unknown>) {
  const articleProjectId = String(payload.articleProjectId ?? "");
  const project = await getArticleProjectById(articleProjectId);
  if (!project) {
    throw new Error(`Unknown article project: ${articleProjectId}`);
  }

  ensureAiProvidersRegistered();
  await updateArticleProjectStatus(project.id, "generating");

  const provider = getAiProvider(project.aiProvider);
  if (!provider) {
    throw new Error(`Unknown AI provider: ${project.aiProvider}`);
  }

  const promptTemplate = await loadPromptFile("article-generation.md");
  const sources = await listProjectSources(project.id);
  const prompt = [
    promptTemplate,
    `TOPIC: ${project.topic}`,
    `NICHE: ${project.niche}`,
    `LANGUAGE: ${project.language}`,
    `EDITORIAL_TONE: ${project.editorialTone}`,
    `ARTICLE_TYPE: ${project.articleType}`,
    `DESIRED_LENGTH: ${project.desiredLength}`,
    `COLLECTED_SOURCES: ${JSON.stringify(
      sources.map((source) => ({
        title: source.title,
        url: source.url,
        domain: source.domain,
        snippet: source.snippet,
      })),
    )}`,
  ].join("\n\n");
  const article = await provider.generateArticle(prompt, { model: project.aiModelId });
  const formatted = formatGeneratedArticle(article);

  await saveGeneratedArticle({
    articleProjectId: project.id,
    title: article.title,
    slug: article.slug,
    language: article.language,
    niche: article.niche,
    excerpt: article.excerpt,
    metaDescription: article.metaDescription,
    tagsJson: JSON.stringify(article.tags),
    outlineJson: JSON.stringify(article.outline),
    intro: article.intro,
    sectionsJson: JSON.stringify(article.sections),
    factsJson: JSON.stringify(article.facts),
    faqJson: JSON.stringify(article.faq),
    conclusion: article.conclusion,
    sourcesJson: JSON.stringify(article.sources),
    rawJson: JSON.stringify(article),
    markdownContent: formatted.markdown,
    htmlContent: formatted.html,
  });

  await updateArticleProjectStatus(project.id, "ready");
}
