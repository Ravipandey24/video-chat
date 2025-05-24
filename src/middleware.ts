import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Configuration for protected routes
const protectedPaths = [
  "/dashboard",
  "/upload",
  "/video"
];

// Auth middleware
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Check if the path is a protected route
  const isProtectedPath = protectedPaths.some(prefix => 
    path === prefix || path.startsWith(`${prefix}/`));
  
  // Allow public API routes and static assets
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.includes(".") ||
    !isProtectedPath
  ) {
    return NextResponse.next();
  }
  
  // Get the session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (path.startsWith("/auth/register")) {
    return NextResponse.next();
  }
  
  // Redirect to login if no token and on a protected path
  if (!token && isProtectedPath) {
    const url = new URL(`/auth/login`, req.url);
    url.searchParams.set("callbackUrl", encodeURI(req.url));
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users to dashboard when they try to access the landing page
  if (path === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Special handling for auth paths - redirect to dashboard if already authenticated
  if ((path.startsWith("/auth/login") || path.startsWith("/auth/register")) && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};