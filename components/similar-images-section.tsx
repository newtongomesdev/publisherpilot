"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Image } from "lucide-react";

type SimilarImage = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export function SimilarImagesSection({ prompt }: { prompt: string }) {
  const [images, setImages] = useState<SimilarImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!prompt || prompt.length < 10) {
      setImages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/images/similar?q=${encodeURIComponent(prompt)}&limit=6`);
        const data = await resp.json();
        if (data.ok) setImages(data.results || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [prompt]);

  if (images.length === 0 && !loading) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Image className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-zinc-300">Imagens Similares Anteriores</h3>
        {loading && <RefreshCw className="h-3 w-3 animate-spin text-zinc-500 ml-2" />}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <a
            key={img.id}
            href={(img.metadata as any)?.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 hover:border-emerald-500/30 transition-colors"
          >
            {(img.metadata as any)?.url ? (
              <img src={(img.metadata as any).url} alt={img.content || "Imagem similar"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-6 w-6 text-zinc-600" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[8px] text-zinc-400 line-clamp-1">{(img.metadata as any)?.model || ""}</p>
              <p className="text-[8px] text-emerald-400">{img.similarity}% similar</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
