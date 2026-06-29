import type { ArticleSection } from "@/lib/article/types";
import type { ArticleImage } from "@/lib/images/providers";

export function buildImageSearchQueries(topic: string, niche?: string) {
  // Extract short, image-friendly queries from the topic.
  // Remove common Portuguese filler words and keep only meaningful terms.
  const fillerWords = /^(a|o|e|de|do|da|dos|das|no|na|nos|nas|um|uma|uns|umas|por|para|com|sem|sobre|entre|como|que|se|mais|menos|todo|toda|todos|todas|esse|essa|esses|essas|este|esta|estes|estas|aquele|aquela|aqueles|aquelas|isto|isso|aquilo|historia|historico|historica|curiosidade|curiosidades|sobre)$/i;

  // Split topic into words, filter filler words, take meaningful parts
  const words = topic.split(/\s+/).filter((w) => w.length > 1 && !fillerWords.test(w));

  const raw: string[] = [];

  // 1. Use all meaningful words joined (short query)
  if (words.length > 0) {
    raw.push(words.join(" "));
  }

  // 2. Use just the last 2-3 meaningful words (usually the subject)
  if (words.length > 2) {
    raw.push(words.slice(-2).join(" "));
  }

  // 3. Add niche if provided
  if (niche) {
    const nicheWords = niche.split(/\s+/).filter((w) => w.length > 1);
    if (words.length > 0 && nicheWords.length > 0) {
      raw.push(`${words.slice(0, 3).join(" ")} ${nicheWords[0]}`);
    }
  }

  const queries: string[] = [];
  const seen = new Set<string>();

  for (const value of raw) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(normalized);
  }

  return queries;
}

export function assignUniqueImagesToSections(
  sections: ArticleSection[],
  images: ArticleImage[],
) {
  return sections.map((section, index) => ({
    ...section,
    images: images[index] ? [images[index]] : [],
  }));
}
