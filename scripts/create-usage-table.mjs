import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

// Load .env.local manually
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS api_usage_log (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    operation TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd TEXT DEFAULT '0',
    article_project_id TEXT,
    user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

console.log("Table api_usage_log created successfully");
