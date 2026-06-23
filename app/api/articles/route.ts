import { NextResponse } from "next/server";
import { createArticleProjectSchema } from "@/app/api/articles/schema";
import { createJobRecord } from "@/lib/jobs/queue";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);
  const { createArticleProject, createJob } = await import("@/lib/db/queries");
  const project = await createArticleProject(parsed);
  const searchJob = await createJob(
    createJobRecord("search", {
      articleProjectId: project.id,
      query: `${project.topic} ${project.niche}`,
      provider: project.searchProvider,
      limit: project.sourceCount,
    }),
  );

  return NextResponse.json({ ok: true, project, searchJob }, { status: 201 });
}
