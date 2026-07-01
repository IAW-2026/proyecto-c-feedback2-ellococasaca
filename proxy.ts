import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeRoles } from "@/lib/clerk-roles";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  // All API routes handle their own auth (INTER_SERVICE_SECRET or Clerk)
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const { userId, sessionClaims } = await auth();

  if (userId && request.nextUrl.pathname === "/feedback") {
    const roles = normalizeRoles(sessionClaims?.metadata);

    if (roles.includes("admin")) {
      return NextResponse.redirect(new URL("/feedback/admin", request.url));
    }
    if (roles.includes("moderator")) {
      return NextResponse.redirect(new URL("/feedback/moderator", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
