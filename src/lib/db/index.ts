import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check for environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create postgres connection with appropriate configuration for Vercel
// Use connection pooling in production, single connection for development/edge functions
const connectionString = process.env.DATABASE_URL;

// For Vercel serverless environment and edge functions
// This ensures connections are properly closed between function invocations
const client = postgres(connectionString, { 
  max: 1,              // Use minimal connections to avoid connection limits
  idle_timeout: 20,    // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout after 10 seconds
});

// Create drizzle database instance with schema
export const db = drizzle(client, { schema });

// For direct queries if needed
export { schema };