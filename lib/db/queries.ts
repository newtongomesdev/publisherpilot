import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articleProjects, articleSources, generatedArticles, jobQueue } from "@/lib/db/schema";

export async function createArticleProject(input: Omit<typeof articleProjects.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(articleProjects).values(record);
  return record;
}

export async function createJob(input: Omit<typeof jobQueue.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(jobQueue).values(record);
  return record;
}

export async function listArticleProjects() {
  return db.select().from(articleProjects).orderBy(desc(articleProjects.createdAt));
}

export async function getArticleProjectById(id: string) {
  const [project] = await db.select().from(articleProjects).where(eq(articleProjects.id, id)).limit(1);
  return project;
}

export async function listGeneratedArticles() {
  return db.select().from(generatedArticles).orderBy(desc(generatedArticles.createdAt));
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
      updatedAt: new Date(),
      ...timestamps,
    })
    .where(eq(jobQueue.id, id));
}
