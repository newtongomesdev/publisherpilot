import { NextRequest, NextResponse } from 'next/server';
import { getVideoProvider } from '@/lib/video/registry';

async function blobToBase64DataUrl(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mime = blob.type || 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const prompt = formData.get('prompt') as string || '';
    const mode = formData.get('mode') as string || 'text-to-video';
    const model = formData.get('model') as string || 'kling-2.0';
    const provider = formData.get('provider') as string || 'fal';
    const duration = parseInt(formData.get('duration') as string || '4', 10);
    const resolution = (formData.get('resolution') as string) || '720p';
    const cameraRaw = formData.get('camera') as string | null;
    const videoUrl = formData.get('videoUrl') as string | null;

    let camera;
    if (cameraRaw) {
      try { camera = JSON.parse(cameraRaw); } catch {}
    }

    // Handle image URLs or uploaded files
    let imageUrl: string | undefined;
    let finalImageUrl: string | undefined;

    const imageUrlField = formData.get('imageUrl');
    if (imageUrlField instanceof File && imageUrlField.size > 0) {
      imageUrl = await blobToBase64DataUrl(imageUrlField);
    } else if (typeof imageUrlField === 'string' && imageUrlField) {
      imageUrl = imageUrlField;
    }

    const finalImageUrlField = formData.get('finalImageUrl');
    if (finalImageUrlField instanceof File && finalImageUrlField.size > 0) {
      finalImageUrl = await blobToBase64DataUrl(finalImageUrlField);
    } else if (typeof finalImageUrlField === 'string' && finalImageUrlField) {
      finalImageUrl = finalImageUrlField;
    }

    const videoProvider = getVideoProvider(provider);
    if (!videoProvider) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    const result = await videoProvider.generateVideo({
      prompt,
      mode: mode as any,
      imageUrl,
      finalImageUrl,
      videoUrl: videoUrl || undefined,
      duration,
      resolution: resolution as '720p' | '1080p',
      camera,
      model,
    });

    return NextResponse.json({ ok: true, video: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate video' }, { status: 500 });
  }
}
