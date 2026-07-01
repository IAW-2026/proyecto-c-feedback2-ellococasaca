import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeRoles } from "@/lib/clerk-roles";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  // Inter-service endpoints (auth via INTER_SERVICE_SECRET header)
  "/api/reviews/enable",
  // Public read-only data
  "/api/reviews/product/(.*)",
  "/api/reviews/seller/(.*)",
  "/api/product-ratings/(.*)",
  "/api/seller-ratings/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const secret = process.env.INTER_SERVICE_SECRET;
  if (secret && request.headers.get("x-inter-service-secret") === secret) {
    return NextResponse.next();
  }

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
