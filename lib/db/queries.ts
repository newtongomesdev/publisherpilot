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
