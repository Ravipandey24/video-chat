import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route for approving user accounts
 * Only accessible to admin users
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
    
    // Update user approval status
    await db
      .update(users)
      .set({
        isApproved: true,
        approvedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return NextResponse.json(
      { message: "User approved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { message: "Failed to approve user" },
      { status: 500 }
    );
  }
} 