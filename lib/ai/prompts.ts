import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPromptFile(fileName: string) {
  const filePath = path.join(process.cwd(), "prompts", fileName);
  return readFile(filePath, "utf8");
}
