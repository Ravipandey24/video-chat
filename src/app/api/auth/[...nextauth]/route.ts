import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth route handler for authentication
 * This provides the API endpoints for sign in, sign out, etc.
 * Usage: /api/auth/signin, /api/auth/signout, etc.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };