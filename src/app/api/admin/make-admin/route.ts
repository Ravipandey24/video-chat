import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route for granting admin privileges to a user
 * Only accessible to existing admin users
 */
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and an admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is an admin
    if (!session.user.isAdmin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Get user ID from request body
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Update user's admin status
    await db
      .update(users)
      .set({
        isAdmin: true,
      })
      .where(eq(users.id, userId));
    
    return NextResponse.json(
      { message: "Admin privileges granted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json(
      { message: "Failed to grant admin privileges" },
      { status: 500 }
    );
  }
} 