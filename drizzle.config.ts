import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local
dotenv.config();

// Check if database URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts", // Path to your schema file
  out: "./drizzle", // Output directory for migrations
  dialect: "postgresql", // PostgreSQL dialect
  dbCredentials: {
    url: process.env.DATABASE_URL, // Use url instead of connectionString
  },
});
