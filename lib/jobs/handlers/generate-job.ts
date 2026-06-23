import { getAiProvider } from "@/lib/ai/registry";
import { loadPromptFile } from "@/lib/ai/prompts";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import { saveGeneratedArticle } from "@/lib/db/queries";

export async function runGenerateJob(payload: Record<string, unknown>) {
  const provider = getAiProvider(String(payload.aiProvider));
  if (!provider) {
    throw new Error(`Unknown AI provider: ${String(payload.aiProvider)}`);
  }

  const promptTemplate = await loadPromptFile("article-generation.md");
  const prompt = `${promptTemplate}\n\nTOPIC: ${String(payload.topic)}\nLANGUAGE: ${String(payload.language)}`;
  const article = await provider.generateArticle(prompt, { model: String(payload.aiModelId) });
  const formatted = formatGeneratedArticle(article);

  await saveGeneratedArticle({
    articleProjectId: String(payload.articleProjectId),
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
}
