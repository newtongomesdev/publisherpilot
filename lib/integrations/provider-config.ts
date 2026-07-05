import { env } from "@/lib/env";
import { requireCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/security/crypto";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export type ServiceProviderConfig = {
  apiKey?: string;
  baseUrl?: string;
  metadata?: Record<string, unknown>;
};

const envFallbacks: Record<string, ServiceProviderConfig> = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.OPENAI_BASE_URL,
  },
  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: env.OPENROUTER_BASE_URL,
    metadata: {
      appName: env.OPENROUTER_APP_NAME,
      siteUrl: env.OPENROUTER_SITE_URL,
      capability: "ai",
    },
  },
  searxng: {
    apiKey: env.SEARXNG_API_KEY,
    baseUrl: env.SEARXNG_URL,
    metadata: {
      capability: "search",
    },
  },
  wordpress: {
    baseUrl: env.WORDPRESS_URL,
    metadata: {
      username: env.WORDPRESS_USER,
      appPassword: env.WORDPRESS_APP_PASSWORD,
      capability: "publish",
    },
  },
};

export async function resolveProviderConfig(providerKey: string, userId?: string): Promise<ServiceProviderConfig> {
  const fallback = envFallbacks[providerKey] ?? {};

  try {
    const resolvedUserId = userId ?? (await requireCurrentUser())?.id;
    if (!resolvedUserId) {
      return fallback;
    }

    let workspaceId: string | undefined;
    try {
      workspaceId = (await requireCurrentWorkspace())?.id;
    } catch {
      // cookie not available in this context
    }

    if (!workspaceId) {
      const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
      const workspace = await getDefaultWorkspaceByUser(resolvedUserId);
      workspaceId = workspace?.id;
    }

    if (!workspaceId) {
      return fallback;
    }

    const isUserScoped = providerKey === "wordpress-mcp";

    const { listApiProvidersByWorkspace, listApiProvidersByUser } = await import("@/lib/db/queries");
    const providers = isUserScoped
      ? await listApiProvidersByUser(resolvedUserId)
      : await listApiProvidersByWorkspace(resolvedUserId, workspaceId);
    const stored = providers.find((provider) => provider.providerKey === providerKey && provider.isEnabled);

    if (!stored) {
      return fallback;
    }

    return {
      apiKey: decryptSecret(stored.apiKeyEncrypted) || fallback.apiKey,
      baseUrl: stored.baseUrl ?? fallback.baseUrl,
      metadata: stored.metadataJson ? JSON.parse(stored.metadataJson) : fallback.metadata,
    };
  } catch {
    return fallback;
  }
}

export async function resolvePublishTargetConfig(targetType: string, userId?: string) {
  try {
    const resolvedUserId = userId ?? (await requireCurrentUser())?.id;
    const workspaceId = (await requireCurrentWorkspace())?.id;
    if (!resolvedUserId || !workspaceId) {
      return null;
    }

    const { listPublishTargetsByWorkspace } = await import("@/lib/db/queries");
    const targets = await listPublishTargetsByWorkspace(resolvedUserId, workspaceId);
    const target = targets.find((item) => item.targetType === targetType && item.isEnabled);
    if (!target) {
      return null;
    }

    return {
      ...target,
      config: target.configJson ? JSON.parse(decryptSecret(target.configJson)) : {},
    };
  } catch {
    return null;
  }
}
