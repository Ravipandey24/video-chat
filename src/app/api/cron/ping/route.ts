import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/cron/ping
 * Simple endpoint to ping the database and keep it active
 * This endpoint should be called daily by a cron job
 */
export async function GET(req: NextRequest) {
  try {
    // Simple query to ping the database
    const result = await db.execute(sql`SELECT 1`);
    
    // Get current time for logging
    const timestamp = new Date().toISOString();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database pinged successfully", 
      timestamp 
    });
  } catch (error) {
    console.error("Database ping failed:", error);
    return NextResponse.json(
      { error: "Failed to ping database" }, 
      { status: 500 }
    );
  }
}