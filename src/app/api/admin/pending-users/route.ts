import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route for getting users pending approval
 * Only accessible to admin users
 */
export async function GET(req: NextRequest) {
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
    
    // Get all users who are not approved
    const pendingUsers = await db.query.users.findMany({
      where: eq(users.isApproved, false),
      columns: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // Do not include password hash or other sensitive data
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    });
    
    return NextResponse.json({ users: pendingUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending users" },
      { status: 500 }
    );
  }
} 