// scripts/migrate.mjs
// Runs SQL migrations ONCE before the Next.js server starts.
// This avoids SQLITE_BUSY from multiple workers trying to migrate in parallel.
import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("[migrate] DATABASE_URL not set, skipping.");
  process.exit(0);
}

const client = createClient({ url, authToken });

// Create migrations tracking table
await client.execute(`
  CREATE TABLE IF NOT EXISTS _migrations (
    file_name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )
`);

// Enable WAL mode and optimize synchronous writes for better concurrency/speed
try {
  await client.execute("PRAGMA journal_mode=WAL");
  await client.execute("PRAGMA synchronous=NORMAL");
} catch {
  // WAL/PRAGMAs may not work on all backends, that's ok
}

const migrationsDir = join(process.cwd(), "lib", "db", "migrations");
let files;
try {
  files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
} catch {
  console.log("[migrate] No migrations directory found, skipping.");
  process.exit(0);
}

// Check which migrations already ran
const { rows: applied } = await client.execute("SELECT file_name FROM _migrations");
const appliedSet = new Set(applied.map((r) => r.file_name));

let count = 0;
for (const file of files) {
  if (appliedSet.has(file)) continue;

  const raw = await readFile(join(migrationsDir, file), "utf-8");

  // Split by --> statement-breakpoint (drizzle format) or by semicolons
  const statements = raw
    .split(/--> statement-breakpoint/)
    .flatMap((block) => block.split(";"))
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);

  let allOk = true;
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      // Tolerate "already exists" errors for idempotency
      if (e.message?.includes("already exists")) continue;
      // Tolerate "no such table" for ALTER TABLE on missing tables
      if (e.message?.includes("no such table")) continue;
      console.error(`[migrate] Error in ${file}: ${e.message}`);
      allOk = false;
    }
  }

  if (allOk) {
    await client.execute({
      sql: "INSERT INTO _migrations (file_name) VALUES (?)",
      args: [file],
    });
    count++;
    console.log(`[migrate] Applied ${file}`);
  }
}

if (count > 0) {
  console.log(`[migrate] Done: ${count} new migration(s) applied.`);
} else {
  console.log("[migrate] All migrations already applied.");
}

client.close();
