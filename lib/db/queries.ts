import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  apiProviders,
  authSessions,
  articleProjects,
  articleSources,
  briefingTemplates,
  exportHistory,
  generatedArticles,
  jobQueue,
  publishTargets,
  users,
  workspaces,
  workspaceSettings,
} from "@/lib/db/schema";

export async function createArticleProject(input: Omit<typeof articleProjects.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(articleProjects).values(record);
  return record;
}

export async function listBriefingTemplatesByWorkspace(workspaceId: string) {
  return db
    .select()
    .from(briefingTemplates)
    .where(eq(briefingTemplates.workspaceId, workspaceId))
    .orderBy(desc(briefingTemplates.updatedAt));
}

export async function createBriefingTemplate(input: Omit<typeof briefingTemplates.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(briefingTemplates).values(record);
  return record;
}

export async function createJob(input: Omit<typeof jobQueue.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(jobQueue).values(record);
  return record;
}

export async function listArticleProjects(userId?: string, workspaceId?: string) {
  const query = db.select().from(articleProjects);
  const filters = [
    userId ? eq(articleProjects.userId, userId) : undefined,
    workspaceId ? eq(articleProjects.workspaceId, workspaceId) : undefined,
  ].filter(Boolean);

  return filters.length > 0
    ? query.where(and(...(filters as ReturnType<typeof eq>[]))).orderBy(desc(articleProjects.createdAt))
    : query.orderBy(desc(articleProjects.createdAt));
}

export async function getArticleProjectById(id: string, userId?: string, workspaceId?: string) {
  const filters = [
    eq(articleProjects.id, id),
    userId ? eq(articleProjects.userId, userId) : undefined,
    workspaceId ? eq(articleProjects.workspaceId, workspaceId) : undefined,
  ].filter(Boolean);
  const [project] = await db
    .select()
    .from(articleProjects)
    .where(and(...(filters as ReturnType<typeof eq>[])))
    .limit(1);
  return project;
}

export async function listGeneratedArticles() {
  return db.select().from(generatedArticles).orderBy(desc(generatedArticles.createdAt));
}

export async function getGeneratedArticleByProjectId(articleProjectId: string) {
  const [article] = await db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.articleProjectId, articleProjectId))
    .orderBy(desc(generatedArticles.createdAt))
    .limit(1);

  return article;
}

export async function listQueuedJobs() {
  return db.select().from(jobQueue).orderBy(desc(jobQueue.createdAt));
}

export async function getQueuedJob() {
  const [job] = await db
    .select()
    .from(jobQueue)
    .where(eq(jobQueue.status, "queued"))
    .orderBy(desc(jobQueue.createdAt))
    .limit(1);

  return job;
}

export async function replaceProjectSources(
  articleProjectId: string,
  rows: Array<Omit<typeof articleSources.$inferInsert, "id">>,
) {
  await db.delete(articleSources).where(eq(articleSources.articleProjectId, articleProjectId));

  if (rows.length > 0) {
    await db.insert(articleSources).values(rows.map((row) => ({ id: randomUUID(), ...row })));
  }
}

export async function saveGeneratedArticle(input: Omit<typeof generatedArticles.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(generatedArticles).values(record);
  return record;
}

export async function listProjectSources(articleProjectId: string) {
  return db.select().from(articleSources).where(eq(articleSources.articleProjectId, articleProjectId));
}

export async function deleteGeneratedArticlesByProjectId(articleProjectId: string) {
  await db.delete(generatedArticles).where(eq(generatedArticles.articleProjectId, articleProjectId));
}

export async function updateArticleProjectStatus(id: string, status: string, currentError?: string | null) {
  await db
    .update(articleProjects)
    .set({
      status,
      currentError: currentError ?? null,
      updatedAt: new Date(),
    })
    .where(eq(articleProjects.id, id));
}

export async function updateJobStatus(id: string, status: string, errorMessage?: string | null) {
  const timestamps =
    status === "running"
      ? { startedAt: new Date() }
      : status === "completed" || status === "failed"
        ? { finishedAt: new Date() }
        : {};

  await db
    .update(jobQueue)
    .set({
      status,
      errorMessage: errorMessage ?? null,
      attempts: status === "running" ? 1 : undefined,
      updatedAt: new Date(),
      ...timestamps,
    })
    .where(eq(jobQueue.id, id));
}

export async function createExportHistory(input: Omit<typeof exportHistory.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(exportHistory).values(record);
  return record;
}

export async function listExportHistory(userId?: string, workspaceId?: string) {
  if (!userId && !workspaceId) {
    return db.select().from(exportHistory).orderBy(desc(exportHistory.createdAt));
  }

  const rows = await db
    .select({
      id: exportHistory.id,
      articleProjectId: exportHistory.articleProjectId,
      generatedArticleId: exportHistory.generatedArticleId,
      format: exportHistory.format,
      status: exportHistory.status,
      fileName: exportHistory.fileName,
      filePath: exportHistory.filePath,
      errorMessage: exportHistory.errorMessage,
      createdAt: exportHistory.createdAt,
      updatedAt: exportHistory.updatedAt,
    })
    .from(exportHistory)
    .innerJoin(articleProjects, eq(exportHistory.articleProjectId, articleProjects.id))
    .where(
      and(
        userId ? eq(articleProjects.userId, userId) : undefined,
        workspaceId ? eq(articleProjects.workspaceId, workspaceId) : undefined,
      ) as ReturnType<typeof eq>,
    )
    .orderBy(desc(exportHistory.createdAt));

  return rows;
}

export async function getWorkspaceSettings(id: string) {
  const [settings] = await db.select().from(workspaceSettings).where(eq(workspaceSettings.id, id)).limit(1);
  return settings;
}

export async function upsertWorkspaceSettings(
  input: Omit<typeof workspaceSettings.$inferInsert, "createdAt" | "updatedAt">,
) {
  const id = input.id;
  const record = { ...input, id, updatedAt: new Date() };

  await db
    .insert(workspaceSettings)
    .values({ ...record, createdAt: new Date() })
    .onConflictDoUpdate({
      target: workspaceSettings.id,
      set: record,
    });

  return getWorkspaceSettings(id);
}

export async function listApiProviders() {
  return db.select().from(apiProviders).orderBy(desc(apiProviders.updatedAt));
}

export async function listApiProvidersByWorkspace(userId: string, workspaceId: string) {
  return db
    .select()
    .from(apiProviders)
    .where(and(eq(apiProviders.userId, userId), eq(apiProviders.workspaceId, workspaceId)))
    .orderBy(desc(apiProviders.updatedAt));
}

export async function listApiProvidersByUser(userId: string) {
  return db
    .select()
    .from(apiProviders)
    .where(eq(apiProviders.userId, userId))
    .orderBy(desc(apiProviders.updatedAt));
}

export async function upsertApiProvider(
  input: Omit<typeof apiProviders.$inferInsert, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const id = input.id ?? `${input.providerKey}-default`;
  const record = { ...input, id, updatedAt: new Date() };

  await db
    .insert(apiProviders)
    .values({ ...record, createdAt: new Date() })
    .onConflictDoUpdate({
      target: apiProviders.id,
      set: record,
    });

  const [provider] = await db.select().from(apiProviders).where(eq(apiProviders.id, id)).limit(1);
  return provider;
}

export async function replaceUserApiProviders(
  userId: string,
  workspaceId: string,
  rows: Array<Omit<typeof apiProviders.$inferInsert, "id" | "createdAt" | "updatedAt"> & { id?: string }>,
) {
  await db.delete(apiProviders).where(and(eq(apiProviders.userId, userId), eq(apiProviders.workspaceId, workspaceId)));

  if (rows.length === 0) {
    return [];
  }

  const records = rows.map((row) => ({
    id: row.id ?? randomUUID(),
    ...row,
    userId,
    workspaceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(apiProviders).values(records);
  return listApiProvidersByWorkspace(userId, workspaceId);
}

export async function listPublishTargetsByWorkspace(userId: string, workspaceId: string) {
  return db
    .select()
    .from(publishTargets)
    .where(and(eq(publishTargets.userId, userId), eq(publishTargets.workspaceId, workspaceId)))
    .orderBy(desc(publishTargets.updatedAt));
}

export async function replaceUserPublishTargets(
  userId: string,
  workspaceId: string,
  rows: Array<Omit<typeof publishTargets.$inferInsert, "id" | "createdAt" | "updatedAt"> & { id?: string }>,
) {
  await db.delete(publishTargets).where(and(eq(publishTargets.userId, userId), eq(publishTargets.workspaceId, workspaceId)));

  if (rows.length === 0) {
    return [];
  }

  const records = rows.map((row) => ({
    id: row.id ?? randomUUID(),
    ...row,
    userId,
    workspaceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(publishTargets).values(records);
  return listPublishTargetsByWorkspace(userId, workspaceId);
}

export async function createUser(input: Omit<typeof users.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(users).values(record);
  return record;
}

export async function createWorkspace(input: Omit<typeof workspaces.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(workspaces).values(record);
  return record;
}

export async function listWorkspacesByUser(userId: string) {
  return db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).orderBy(desc(workspaces.createdAt));
}

export async function getWorkspaceById(id: string, userId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.ownerUserId, userId)))
    .limit(1);
  return workspace;
}

export async function getDefaultWorkspaceByUser(userId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.ownerUserId, userId), eq(workspaces.isDefault, true)))
    .limit(1);
  return workspace;
}

export async function setDefaultWorkspaceIfMissing(userId: string, fallbackName: string) {
  const existing = await getDefaultWorkspaceByUser(userId);
  if (existing) {
    return existing;
  }

  const created = await createWorkspace({
    ownerUserId: userId,
    name: "Workspace principal",
    slug: `workspace-${fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "default"}`,
    description: "Espaco inicial do usuario.",
    isDefault: true,
  });

  await upsertWorkspaceSettings({
    id: created.id,
    defaultLanguage: "pt-BR",
    defaultTone: "Especialista claro e convincente",
    defaultArticleType: "blog-post",
    blockedDomainsJson: JSON.stringify([]),
    preferredSearchProvider: "both",
    preferredAiProvider: "openrouter",
    preferredModelId: "",
  });

  return getWorkspaceById(created.id, userId);
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function createAuthSession(input: typeof authSessions.$inferInsert) {
  await db.insert(authSessions).values(input);
  return input;
}

export async function getAuthSessionById(id: string) {
  const [session] = await db.select().from(authSessions).where(eq(authSessions.id, id)).limit(1);
  return session;
}

export async function deleteAuthSession(id: string) {
  await db.delete(authSessions).where(eq(authSessions.id, id));
}

export async function deleteArticleProjectById(id: string) {
  await db.delete(articleProjects).where(eq(articleProjects.id, id));
}

export async function deleteArticleProjectsByIds(ids: string[]) {
  if (ids.length === 0) return;
  await db.delete(articleProjects).where(inArray(articleProjects.id, ids));
}

export async function updateWorkspaceName(id: string, name: string) {
  await db.update(workspaces).set({ name }).where(eq(workspaces.id, id));
}
