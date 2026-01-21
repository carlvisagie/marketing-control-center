import { defineConfig } from "drizzle-kit";

// Use JUST_TALK_DATABASE_URL for PostgreSQL connection to Just Talk database
const connectionString = process.env.JUST_TALK_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("JUST_TALK_DATABASE_URL or DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: "require",
  },
});
