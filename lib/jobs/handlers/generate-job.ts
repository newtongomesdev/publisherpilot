import { ensureAiProvidersRegistered } from "@/lib/ai/bootstrap";
import { getAiProvider } from "@/lib/ai/registry";
import { loadPromptFile } from "@/lib/ai/prompts";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import type { GeneratedArticle, ArticleSection } from "@/lib/article/types";
import { assignUniqueImagesToSections, buildImageSearchQueries } from "@/lib/images/assignment";
import { searchImagesFromProviders, type ImageProviderKey, type ArticleImage } from "@/lib/images/providers";
import {
  getArticleProjectById,
  listProjectSources,
  saveGeneratedArticle,
  updateArticleProjectStatus,
} from "@/lib/db/queries";

type ArticleStructure = {
  title: string;
  slug: string;
  language: string;
  niche: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  outline: string[];
  intro: string;
  sources: Array<{ title: string; url: string; domain: string }>;
};

type SectionResult = {
  heading: string;
  body: string;
  sourceUrls: string[];
};

type ClosingResult = {
  conclusion: string;
  facts: string[];
  faq: Array<{ question: string; answer: string }>;
};

async function setProgress(
  projectId: string,
  phase: string,
  detail: string,
  currentSection?: number,
  totalSections?: number,
) {
  const progress = JSON.stringify({
    phase,
    detail,
    currentSection: currentSection ?? 0,
    totalSections: totalSections ?? 0,
  });
  // Store progress metadata in currentError field (will be cleared on completion)
  await updateArticleProjectStatus(projectId, "generating", progress);
}

function parseJsonResponse<T>(raw: string): T {
  // Try to extract JSON from the response (might be wrapped in markdown code blocks)
  let jsonStr = raw.trim();

  // Remove markdown code block wrappers
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Find the first { or [ to start of JSON
  const firstBrace = jsonStr.indexOf("{");
  const firstBracket = jsonStr.indexOf("[");
  let start = -1;
  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket >= 0) {
    start = firstBracket;
  }

  if (start > 0) {
    jsonStr = jsonStr.slice(start);
  }

  return JSON.parse(jsonStr) as T;
}

export async function runGenerateJob(payload: Record<string, unknown>) {
  const articleProjectId = String(payload.articleProjectId ?? "");
  console.log("[generate-job] Starting chunked generation for project:", articleProjectId);

  const project = await getArticleProjectById(articleProjectId);
  if (!project) {
    throw new Error(`Unknown article project: ${articleProjectId}`);
  }

  try {
    ensureAiProvidersRegistered();
    await updateArticleProjectStatus(project.id, "generating");

    const provider = getAiProvider(project.aiProvider);
    if (!provider) {
      throw new Error(`AI provider "${project.aiProvider}" not configured. Configure em Configuracoes > Provedores de IA.`);
    }

    const options = { model: project.aiModelId, userId: project.userId ?? undefined };
    const sources = await listProjectSources(project.id);
    const sourcesJson = JSON.stringify(
      sources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        snippet: s.snippet,
      })),
    );

    console.log("[generate-job] Provider:", project.aiProvider, "Model:", project.aiModelId, "Sources:", sources.length);

    // ═══════════════════════════════════════════════════════════════
    // DUPLICATE CHECK: Verificar se já existe conteúdo similar
    // ═══════════════════════════════════════════════════════════════
    try {
      const { checkDuplicateArticle } = await import("@/lib/ai/chromadb");
      const dup = await checkDuplicateArticle(project.topic, sources.map((s) => s.snippet).join("\n"));
      if (dup.isDuplicate) {
        console.log(`[generate-job] Duplicate detected: "${dup.existingTitle}" (${dup.similarity}% similar)`);
        // Log warning but don't block — proceed with generation
      } else {
        console.log(`[generate-job] No duplicates found (max similarity: ${dup.similarity}%)`);
      }
    } catch (err) {
      console.error("[generate-job] Duplicate check failed (non-critical):", err);
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Generate article structure (outline, title, intro)
    // ═══════════════════════════════════════════════════════════════
    console.log("[generate-job] Phase 1: Generating structure...");
    await setProgress(project.id, "structure", "Criando estrutura do artigo...");

    // Get related articles for recommendations
    let relatedArticlesText = "";
    try {
      const { getRelatedArticles } = await import("@/lib/ai/chromadb");
      const related = await getRelatedArticles(project.topic, 3);
      if (related.length > 0) {
        relatedArticlesText = `\n\nRELATED ARTICLES ALREADY PUBLISHED (use as reference for tone and avoid repetition):\n`
          + related.map((r) => `- "${r.title}" (${r.niche}, ${r.similarity}% similar)`).join("\n");
      }
    } catch {}

    const structurePrompt = (await loadPromptFile("article-structure.md"))
      + `\n\nTOPIC: ${project.topic}`
      + `\nNICHE: ${project.niche}`
      + `\nLANGUAGE: ${project.language}`
      + `\nEDITORIAL_TONE: ${project.editorialTone}`
      + `\nARTICLE_TYPE: ${project.articleType}`
      + `\nDESIRED_LENGTH: ${project.desiredLength}`
      + `\n\nCOLLECTED_SOURCES:\n${sourcesJson}`
      + relatedArticlesText;

    const structureRaw = await provider.generateText(structurePrompt, options);
    console.log("[generate-job] Structure response length:", structureRaw.length);

    const structure = parseJsonResponse<ArticleStructure>(structureRaw);

    if (!structure.title || !structure.outline || structure.outline.length < 3) {
      throw new Error("A IA nao retornou uma estrutura valida. Tente novamente.");
    }

    console.log("[generate-job] Structure:", structure.title, "- ", structure.outline.length, "sections");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Generate each section individually
    // ═══════════════════════════════════════════════════════════════
    console.log("[generate-job] Phase 2: Generating sections...");
    const sectionPrompt = await loadPromptFile("article-section.md");
    const sections: ArticleSection[] = [];

    // Filter outline to only content sections (skip "Introducao" and "Conclusao")
    const contentSections = structure.outline.filter(
      (item) => !item.toLowerCase().startsWith("introdu") && !item.toLowerCase().startsWith("conclus"),
    );

    for (let i = 0; i < contentSections.length; i++) {
      const heading = contentSections[i];
      const sectionNum = i + 1;
      const totalSections = contentSections.length;

      console.log(`[generate-job] Section ${sectionNum}/${totalSections}: ${heading}`);
      await setProgress(
        project.id,
        "sections",
        `Gerando secao ${sectionNum}/${totalSections}: ${heading}`,
        sectionNum,
        totalSections,
      );

      const sectionSourceUrls = sources
        .filter((s) => s.snippet && (s.title + " " + s.snippet).toLowerCase().includes(heading.toLowerCase().split(" ").slice(0, 2).join(" ").toLowerCase()))
        .slice(0, 5);

      const prompt = sectionPrompt
        .replace("ARTICLE_TITLE", structure.title)
        .replace("ARTICLE_NICHE", structure.niche)
        .replace("ARTICLE_TONE", project.editorialTone)
        .replace("ARTICLE_LANGUAGE", project.language)
        .replace("SECTION_HEADING", heading)
        .replace("SECTION_NUMBER", String(sectionNum))
        .replace("TOTAL_SECTIONS", String(totalSections))
        .replace("SECTION_SOURCES", sectionSourceUrls.length > 0
          ? JSON.stringify(sectionSourceUrls.map((s) => ({ title: s.title, url: s.url, snippet: s.snippet })))
          : sourcesJson
        );

      const sectionRaw = await provider.generateText(prompt, options);

      try {
        const sectionResult = parseJsonResponse<SectionResult>(sectionRaw);
        sections.push({
          heading: sectionResult.heading || heading,
          body: sectionResult.body || sectionRaw,
          sourceUrls: sectionResult.sourceUrls || [],
        });
      } catch {
        // If JSON parsing fails, use the raw text as the section body
        console.log(`[generate-job] Section ${sectionNum} - using raw text (JSON parse failed)`);
        sections.push({
          heading,
          body: sectionRaw,
          sourceUrls: [],
        });
      }

      console.log(`[generate-job] Section ${sectionNum} done: ${sections[sections.length - 1].body.length} chars`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Generate closing (conclusion, FAQ, facts)
    // ═══════════════════════════════════════════════════════════════
    console.log("[generate-job] Phase 3: Generating closing...");
    await setProgress(project.id, "closing", "Gerando conclusao, FAQ e fatos...");

    const closingPrompt = (await loadPromptFile("article-closing.md"))
      .replace("ARTICLE_TITLE", structure.title)
      .replace("ARTICLE_NICHE", structure.niche)
      .replace("ARTICLE_TONE", project.editorialTone)
      .replace("ARTICLE_LANGUAGE", project.language)
      .replace("ARTICLE_OUTLINE", structure.outline.join("\n"))
      .replace("ARTICLE_SECTIONS_SUMMARY", sections.map((s) =>
        `## ${s.heading}\n${s.body.slice(0, 1000)}...`
      ).join("\n\n"));

    const closingRaw = await provider.generateText(closingPrompt, options);
    console.log("[generate-job] Closing response length:", closingRaw.length);

    let closing: ClosingResult;
    try {
      closing = parseJsonResponse<ClosingResult>(closingRaw);
    } catch {
      console.log("[generate-job] Closing JSON parse failed, using defaults");
      closing = {
        conclusion: closingRaw || "Artigo gerado com sucesso.",
        facts: [],
        faq: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // ASSEMBLE: Combine all parts into final article
    // ═══════════════════════════════════════════════════════════════
    console.log("[generate-job] Assembling article...");
    await setProgress(project.id, "formatting", "Formatando artigo final...");

    const article: GeneratedArticle = {
      title: structure.title,
      slug: structure.slug,
      language: structure.language,
      niche: structure.niche,
      excerpt: structure.excerpt,
      metaDescription: structure.metaDescription,
      tags: structure.tags,
      outline: structure.outline,
      intro: structure.intro,
      sections,
      facts: closing.facts,
      faq: closing.faq,
      conclusion: closing.conclusion,
      sources: structure.sources,
    };

    // Calculate total characters
    const totalChars = [
      article.intro,
      ...article.sections.map((s) => s.body),
      article.conclusion,
      ...article.facts,
      ...article.faq.map((f) => f.question + f.answer),
    ].join("").length;

    console.log(`[generate-job] Total article length: ${totalChars} chars`);

    // Search for images using broad fallback queries, then assign unique images without repetition.
    const imageProviders = (payload.imageProviders ?? []) as ImageProviderKey[];
    console.log("[generate-job] Image providers from payload:", JSON.stringify(imageProviders), "sections:", sections.length);
    if (imageProviders.length > 0) {
      console.log("[generate-job] Searching for images via:", imageProviders.join(", "));
      const sourcesForImages = sources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        snippet: s.snippet ?? undefined,
      }));

      let allImages: ArticleImage[] = [];
      const queries = buildImageSearchQueries(project.topic, project.niche);

      for (const query of queries) {
        try {
          const result = await searchImagesFromProviders(
            query,
            imageProviders,
            sections.length + 3,
            sourcesForImages,
            { falImageModel: payload.falImageModel as string },
          );

          // Append new unique images to our collection
          for (const img of result) {
            if (!allImages.some((existing) => existing.url === img.url)) {
              allImages.push(img);
            }
          }
          if (allImages.length >= sections.length) {
            break;
          }
        } catch (err) {
          console.error(`[generate-job] Image search failed for query "${query}":`, err);
        }
      }
      console.log("[generate-job] Found", allImages.length, "total images after fallbacks");

      const assignedSections = assignUniqueImagesToSections(sections, allImages);
      sections.splice(0, sections.length, ...assignedSections);

      const totalAssigned = assignedSections.filter((s) => (s.images?.length ?? 0) > 0).length;
      console.log("[generate-job] Assigned images to", totalAssigned, "of", sections.length, "sections");
    } else {
      console.log("[generate-job] Image search skipped (no providers selected)");
    }

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
      rawJson: JSON.stringify({ ...article, totalChars }),
      markdownContent: formatted.markdown,
      htmlContent: formatted.html,
    });

    console.log("[generate-job] Article saved, updating status to ready");
    await updateArticleProjectStatus(project.id, "ready");

    // Index article in ChromaDB for semantic search
    try {
      const { indexArticle } = await import("@/lib/ai/chromadb");
      const articleContent = [
        article.title,
        article.excerpt,
        article.intro,
        ...article.sections.map((s) => `${s.heading}\n${s.body}`),
        article.conclusion,
        ...article.facts,
        ...article.faq.map((f) => `${f.question}\n${f.answer}`),
      ].join("\n\n");

      await indexArticle({
        id: project.id,
        content: articleContent.slice(0, 50000), // ChromaDB limit
        metadata: {
          projectId: project.id,
          workspaceId: project.workspaceId ?? undefined,
          title: article.title,
          niche: article.niche,
          language: article.language,
          createdAt: new Date().toISOString(),
        },
      });
      console.log("[generate-job] Article indexed in ChromaDB");
    } catch (err) {
      console.error("[generate-job] ChromaDB indexing failed (non-critical):", err);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    console.error("[generate-job] Error:", message);
    await updateArticleProjectStatus(project.id, "failed", message);
    throw error;
  }
}
