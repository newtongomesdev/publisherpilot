import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVideoProvider } from '@/lib/video/registry';

const generateVideoSchema = z.object({
  prompt: z.string().optional().default(''),
  negativePrompt: z.string().optional(),
  mode: z.enum(['text-to-video', 'image-to-video', 'extend', 'scene', 'edit']),
  model: z.string().optional().default('kling-2.0'),
  provider: z.string().optional().default('fal'),
  imageUrl: z.string().optional(),
  finalImageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().min(1).max(30).optional().default(4),
  resolution: z.enum(['720p', '1080p']).optional().default('720p'),
  camera: z
    .object({
      type: z.enum(['static', 'pan', 'tilt', 'zoom', 'orbit']),
      direction: z.string().optional(),
      intensity: z.number().optional(),
    })
    .optional(),
  fps: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateVideoSchema.parse(body);

    const videoProvider = getVideoProvider(parsed.provider);
    if (!videoProvider) {
      return NextResponse.json({ error: `Unknown provider: ${parsed.provider}` }, { status: 400 });
    }

    const result = await videoProvider.generateVideo({
      prompt: parsed.prompt,
      negativePrompt: parsed.negativePrompt,
      mode: parsed.mode,
      imageUrl: parsed.imageUrl,
      finalImageUrl: parsed.finalImageUrl,
      videoUrl: parsed.videoUrl,
      duration: parsed.duration,
      resolution: parsed.resolution,
      camera: parsed.camera,
      fps: parsed.fps,
      model: parsed.model,
    });

    return NextResponse.json({ ok: true, video: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to generate video' }, { status: 500 });
  }
}
