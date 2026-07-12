import { NextRequest, NextResponse } from 'next/server';
import { listVideoProviders } from '@/lib/video/registry';

export async function GET(req: NextRequest) {
  const providerParam = req.nextUrl.searchParams.get('provider');

  const providers = listVideoProviders();
  const result = providers.map((p) => ({
    id: p.id,
    name: p.label,
    models: p.getModels().map((m) => ({
      ...m,
      price: p.getPrice(m.id),
    })),
  }));

  if (providerParam) {
    const filtered = result.filter((r) => r.id === providerParam);
    return NextResponse.json({ providers: filtered });
  }

  return NextResponse.json({ providers: result });
}
