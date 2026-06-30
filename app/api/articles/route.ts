import { NextResponse } from "next/server";
import { createArticleProjectSchema } from "@/app/api/articles/schema";
import { requireCurrentUser } from "@/lib/auth/session";
import { createJobRecord } from "@/lib/jobs/queue";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let workspace;
    try {
      workspace = await requireCurrentWorkspace();
    } catch (e) {
      console.error("[articles] requireCurrentWorkspace failed:", e);
    }

    if (!workspace) {
      // Fallback: get default workspace directly from DB
      try {
        const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
        workspace = await getDefaultWorkspaceByUser(user.id);
      } catch (e) {
        console.error("[articles] Fallback workspace lookup failed:", e);
      }
    }

    if (!workspace) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createArticleProjectSchema.parse(body);
    const { createArticleProject, createJob } = await import("@/lib/db/queries");

    // Ensure the AI model exists in the ai_models table (required by FK)
    try {
      const { db } = await import("@/lib/db/client");
      const { aiModels } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [existing] = await db.select().from(aiModels).where(eq(aiModels.id, parsed.aiModelId)).limit(1);
      if (!existing) {
        await db.insert(aiModels).values({
          id: parsed.aiModelId,
          providerKey: parsed.aiProvider,
          modelId: parsed.aiModelId,
          name: parsed.aiModelId,
        });
      }
    } catch (e) {
      console.error("[articles] Failed to ensure AI model exists:", e);
    }

    // Transcribe audio source if provided
    let audioTranscript = "";
    // Deepgram transcription removed

    // Append transcript to structure notes for the AI
    const finalStructureNotes = [
      parsed.structureNotes ?? "",
      audioTranscript ? `\n\n## Transcrição da fonte de áudio\n\n${audioTranscript}` : "",
    ].filter(Boolean).join("") || null;

    const project = await createArticleProject({
      ...parsed,
      subtitle: parsed.subtitle ?? null,
      keywordsJson: JSON.stringify(parsed.keywords),
      structureNotes: finalStructureNotes,
      userId: user.id,
      workspaceId: workspace.id,
    });
    const searchJob = await createJob(
      createJobRecord("search", {
        articleProjectId: project.id,
        query: `${project.topic} ${project.niche}`,
        provider: project.searchProvider,
        limit: project.sourceCount,
        imageProviders: parsed.imageProviders,
        falImageModel: parsed.falImageModel,
      }),
    );


    return NextResponse.json({ ok: true, project, searchJob }, { status: 201 });
  } catch (error) {
    console.error("[articles] POST error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
