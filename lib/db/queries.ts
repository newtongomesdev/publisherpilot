import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articleProjects, generatedArticles, jobQueue } from "@/lib/db/schema";

export async function listArticleProjects() {
  return db.select().from(articleProjects).orderBy(desc(articleProjects.createdAt));
}

export async function getArticleProjectById(id: string) {
  return db.select().from(articleProjects).where(eq(articleProjects.id, id)).limit(1);
}

export async function listGeneratedArticles() {
  return db.select().from(generatedArticles).orderBy(desc(generatedArticles.createdAt));
}

export async function listQueuedJobs() {
  return db.select().from(jobQueue).orderBy(desc(jobQueue.createdAt));
}
