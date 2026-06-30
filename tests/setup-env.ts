// Force local SQLite for tests, ignoring any remote DATABASE_URL from .env.local
process.env.DATABASE_URL = "file:tests/test.db";
