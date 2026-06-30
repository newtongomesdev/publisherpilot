import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import { schema } from "@/lib/db/schema";
import path from "path";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Run SQL migrations on startup (avoids drizzle-orm/libsql/migrator which needs node:crypto)
(async () => {
  try {
    const fs = await import("fs/promises");
    const migrationsDir = path.join(process.cwd(), "lib", "db", "migrations");
    const files = (await fs.readdir(migrationsDir))
      .filter((f: string) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const raw = await fs.readFile(path.join(migrationsDir, file), "utf-8");
      const statements = raw
        .split(";")
        .map((s: string) => s.replace(/--.*$/gm, "").trim())
        .filter(Boolean);

      for (const stmt of statements) {
        try {
          await client.execute(stmt);
        } catch (e: any) {
          if (!e.message?.includes("already exists")) {
            console.error(`[migrate] Error in ${file}: ${e.message}`);
          }
        }
      }
    }
    if (files.length > 0) {
      console.log(`[migrate] Applied ${files.length} migration files.`);
    }
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      console.error("[migrate]", err);
    }
  }
})();
