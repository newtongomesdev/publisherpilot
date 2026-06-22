export function isAllowedArticleUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeArticleUrl(value: string) {
  if (isAllowedArticleUrl(value)) {
    return new URL(value).toString();
  }

  return "#";
}
