import { resolveProviderConfig, resolvePublishTargetConfig } from "@/lib/integrations/provider-config";
import type { GeneratedArticle } from "@/lib/article/types";
import type { PublisherConnector, PublisherResult } from "@/lib/publishers/types";
import { callTool, extractText, extractJson, type McpCallOptions } from "@/lib/mcp/client";

/**
 * WordPress publisher using MCP (Model Context Protocol) via Easy MCP AI.
 *
 * Falls back to the standard REST API publisher if MCP is not configured.
 */
export const wordpressMcpPublisher: PublisherConnector = {
  name: "wordpress-mcp",
  label: "WordPress (MCP)",

  async validateConfig(userId?: string) {
    const provider = await resolveProviderConfig("wordpress-mcp", userId);
    const target = await resolvePublishTargetConfig("wordpress-mcp", userId);
    const endpoint = String(provider.baseUrl ?? target?.config?.mcpEndpoint ?? "");
    const token = String(provider.apiKey ?? target?.config?.mcpToken ?? "");

    if (!endpoint || !token) {
      return { ok: false, reason: "Endpoint MCP e token sao obrigatorios para WordPress MCP." };
    }

    return { ok: true };
  },

  async publish(article: GeneratedArticle, userId?: string): Promise<PublisherResult> {
    const provider = await resolveProviderConfig("wordpress-mcp", userId);
    const target = await resolvePublishTargetConfig("wordpress-mcp", userId);
    const endpoint = String(provider.baseUrl ?? target?.config?.mcpEndpoint ?? "");
    const token = String(provider.apiKey ?? target?.config?.mcpToken ?? "");
    const publishStatus = String(target?.config?.status ?? "draft");

    if (!endpoint || !token) {
      throw new Error("Endpoint MCP e token sao obrigatorios para WordPress MCP.");
    }

    const mcp: McpCallOptions = { endpoint, token };

    // Build HTML content
    const content = [
      `<p>${article.intro}</p>`,
      ...article.sections.map((section) => `<h2>${section.heading}</h2><p>${section.body}</p>`),
      article.faq.length
        ? `<h2>Perguntas frequentes</h2>${article.faq
            .map((item) => `<h3>${item.question}</h3><p>${item.answer}</p>`)
            .join("")}`
        : "",
      `<p>${article.conclusion}</p>`,
    ]
      .filter(Boolean)
      .join("");

    // Step 1: Create the post via MCP
    const createResult = await callTool(mcp, "wp_create_post", {
      title: article.title,
      content,
      status: publishStatus,
      slug: article.slug,
      excerpt: article.excerpt,
    });

    if (createResult.isError) {
      throw new Error(`MCP wp_create_post failed: ${extractText(createResult)}`);
    }

    // Try to extract the post data from the result
    const postData = extractJson<{ id?: number; link?: string; status?: string }>(createResult);
    const postId = postData?.id;
    const postUrl = postData?.link;

    // Step 2: If we have tags, try to assign them
    if (article.tags.length > 0 && postId) {
      try {
        // First, list existing tags to find matches
        const tagsResult = await callTool(mcp, "wp_list_tags", { per_page: 100 });
        if (!tagsResult.isError) {
          const tagsText = extractText(tagsResult);
          const existingTags = extractJson<Array<{ id: number; name: string }>>(tagsResult) ?? [];

          const tagIds: number[] = [];
          for (const tagName of article.tags.slice(0, 10)) {
            const found = existingTags.find(
              (t) => t.name?.toLowerCase() === tagName.toLowerCase(),
            );
            if (found?.id) {
              tagIds.push(found.id);
            } else {
              // Create the tag
              try {
                const createTagResult = await callTool(mcp, "wp_create_tag", {
                  name: tagName,
                });
                const newTag = extractJson<{ id?: number }>(createTagResult);
                if (newTag?.id) tagIds.push(newTag.id);
              } catch {}
            }
          }

          if (tagIds.length > 0) {
            await callTool(mcp, "wp_update_post", {
              id: postId,
              tags: tagIds,
            });
          }
        }
      } catch {}
    }

    // Step 3: If we have a niche/category, try to assign it
    if (article.niche && postId) {
      try {
        const categoriesResult = await callTool(mcp, "wp_list_categories", {});
        if (!categoriesResult.isError) {
          const cats = extractJson<Array<{ id: number; name: string }>>(categoriesResult) ?? [];
          const found = cats.find(
            (c) => c.name?.toLowerCase() === article.niche!.toLowerCase(),
          );

          let categoryId = found?.id;
          if (!categoryId) {
            const createCatResult = await callTool(mcp, "wp_create_category", {
              name: article.niche,
            });
            const newCat = extractJson<{ id?: number }>(createCatResult);
            categoryId = newCat?.id;
          }

          if (categoryId) {
            await callTool(mcp, "wp_update_post", {
              id: postId,
              categories: [categoryId],
            });
          }
        }
      } catch {}
    }

    return {
      id: postId ?? "unknown",
      status: publishStatus,
      url: postUrl,
      editUrl: postUrl ? `/wp-admin/post.php?post=${postId}&action=edit` : undefined,
      provider: "wordpress-mcp",
    };
  },
};
