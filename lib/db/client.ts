import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import { schema } from "@/lib/db/schema";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
