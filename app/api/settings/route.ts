import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

const providerCredentialSchema = z.object({
  id: z.string().optional(),
  providerKey: z.string().min(1),
  displayName: z.string().min(1),
  capability: z.enum(["ai", "search", "publish", "custom", "image"]).default("custom"),
  apiKey: z.string().default(""),
  hasStoredKey: z.boolean().default(false),
  baseUrl: z.string().nullable().optional(),
  isEnabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const publishTargetSchema = z.object({
  id: z.string().optional(),
  targetType: z.string().min(1),
  name: z.string().min(1),
  isEnabled: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()).default({}),
  notes: z.string().default(""),
});

const settingsSchema = z.object({
  defaultLanguage: z.string().nullable().optional(),
  defaultTone: z.string().nullable().optional(),
  defaultArticleType: z.string().nullable().optional(),
  blockedDomains: z.array(z.string().min(1)).default([]),
  preferredSearchProvider: z.string().nullable().optional(),
  preferredAiProvider: z.string().nullable().optional(),
  preferredModelId: z.string().nullable().optional(),
  providerCredentials: z.array(providerCredentialSchema).default([]),
  publishTargets: z.array(publishTargetSchema).default([]),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    let workspace;
    try {
      workspace = await requireCurrentWorkspace();
    } catch {}
    if (!workspace) {
      const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
      workspace = await getDefaultWorkspaceByUser(user.id);
    }
    if (!workspace) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }

    const { getWorkspaceSettings, listApiProvidersByWorkspace, listPublishTargetsByWorkspace } = await import("@/lib/db/queries");
    const settings = await getWorkspaceSettings(workspace.id);
    const providers = await listApiProvidersByWorkspace(user.id, workspace.id);
    const publishTargets = await listPublishTargetsByWorkspace(user.id, workspace.id);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      settings: {
        defaultLanguage: settings?.defaultLanguage ?? "pt-BR",
        defaultTone: settings?.defaultTone ?? "Especialista claro e convincente",
        defaultArticleType: settings?.defaultArticleType ?? "blog-post",
        blockedDomains: settings?.blockedDomainsJson ? JSON.parse(settings.blockedDomainsJson) : [],
        preferredSearchProvider: settings?.preferredSearchProvider ?? "both",
        preferredAiProvider: settings?.preferredAiProvider ?? "openrouter",
        preferredModelId: settings?.preferredModelId ?? "",
      },
      providerCredentials: providers.map((provider) => ({
        id: provider.id,
        providerKey: provider.providerKey,
        displayName: provider.displayName,
        capability: String((provider.metadataJson ? JSON.parse(provider.metadataJson).capability : "custom") ?? "custom"),
        apiKey: "",
        hasStoredKey: Boolean(provider.apiKeyEncrypted),
        baseUrl: provider.baseUrl ?? "",
        isEnabled: provider.isEnabled,
        sourceType: provider.sourceType,
        metadata: provider.metadataJson ? JSON.parse(provider.metadataJson) : {},
      })),
      publishTargets: publishTargets.map((target) => ({
        id: target.id,
        targetType: target.targetType,
        name: target.name,
        isEnabled: target.isEnabled,
        config: target.configJson ? JSON.parse(decryptSecret(target.configJson)) : {},
        notes: target.notes ?? "",
      })),
    });
  } catch (error) {
    console.error("[settings] GET error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    let workspace;
    try {
      workspace = await requireCurrentWorkspace();
    } catch {}
    if (!workspace) {
      const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
      workspace = await getDefaultWorkspaceByUser(user.id);
    }
    if (!workspace) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = settingsSchema.parse(body);
    const { listApiProvidersByWorkspace, upsertWorkspaceSettings } = await import("@/lib/db/queries");
    const { db } = await import("@/lib/db/client");
    const { apiProviders, publishTargets } = await import("@/lib/db/schema");
    const { and, eq } = await import("drizzle-orm");

    // 1. Save workspace settings
    let settings;
    try {
      settings = await upsertWorkspaceSettings({
        id: workspace.id,
        defaultLanguage: parsed.defaultLanguage ?? null,
        defaultTone: parsed.defaultTone ?? null,
        defaultArticleType: parsed.defaultArticleType ?? null,
        blockedDomainsJson: JSON.stringify(parsed.blockedDomains),
        preferredSearchProvider: parsed.preferredSearchProvider ?? null,
        preferredAiProvider: parsed.preferredAiProvider ?? null,
        preferredModelId: parsed.preferredModelId ?? null,
      });
    } catch (e) {
      console.error("[settings] Failed to save settings:", e);
      settings = null;
    }

    // 2. Save API providers
    const providerCredentials: unknown[] = [];
    try {
      // Get existing providers
      const existingProviders = await listApiProvidersByWorkspace(user.id, workspace.id);
      const existingMap = new Map(existingProviders.map((p) => [p.providerKey, p]));

      // Delete all existing providers for this workspace
      await db
        .delete(apiProviders)
        .where(and(eq(apiProviders.userId, user.id), eq(apiProviders.workspaceId, workspace.id)));

      // Re-insert all providers
      for (const provider of parsed.providerCredentials) {
        const existing = existingMap.get(provider.providerKey);
        const apiKeyEncrypted =
          provider.apiKey
            ? encryptSecret(provider.apiKey)
            : existing?.apiKeyEncrypted ?? "";

        const [inserted] = await db
          .insert(apiProviders)
          .values({
            id: crypto.randomUUID(),
            userId: user.id,
            workspaceId: workspace.id,
            providerKey: provider.providerKey,
            displayName: provider.displayName,
            baseUrl: provider.baseUrl ?? null,
            apiKeyEncrypted,
            sourceType: provider.apiKey || provider.hasStoredKey ? "user" : "empty",
            isEnabled: provider.isEnabled,
            metadataJson: JSON.stringify(provider.metadata),
          })
          .returning();

        providerCredentials.push(inserted);
      }
    } catch (e) {
      console.error("[settings] Failed to save providers:", e);
    }

    // 3. Save publish targets
    const savedTargets: unknown[] = [];
    try {
      const { publishTargets: publishTargetsTable } = await import("@/lib/db/schema");

      // Delete all existing targets for this workspace
      await db
        .delete(publishTargetsTable)
        .where(and(eq(publishTargetsTable.userId, user.id), eq(publishTargetsTable.workspaceId, workspace.id)));

      // Re-insert all targets
      for (const target of parsed.publishTargets) {
        let configJson = "";
        try {
          configJson = encryptSecret(JSON.stringify(target.config));
        } catch {
          configJson = encryptSecret("{}");
        }

        const [inserted] = await db
          .insert(publishTargetsTable)
          .values({
            id: crypto.randomUUID(),
            userId: user.id,
            workspaceId: workspace.id,
            targetType: target.targetType,
            name: target.name,
            isEnabled: target.isEnabled,
            configJson,
            notes: target.notes,
          })
          .returning();

        savedTargets.push(inserted);
      }
    } catch (e) {
      console.error("[settings] Failed to save publish targets:", e);
    }

    return NextResponse.json({
      ok: true,
      settings,
      providerCredentials,
      publishTargets,
    });
  } catch (error) {
    console.error("[settings] POST error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
