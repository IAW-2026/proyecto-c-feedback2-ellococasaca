import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isInterServiceRequest } from "@/lib/inter-service-auth";
import { normalizeRoles } from "@/lib/clerk-roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  let isPrivilegedUser = false;

  if (!isInterServiceRequest(request)) {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const roles = normalizeRoles(user.publicMetadata);
    isPrivilegedUser = roles.includes("admin") || roles.includes("moderator");
  }

  const { productId } = await params;

  // Inter-service y usuarios sin privilegios solo ven PUBLISHED.
  // Admin y moderator ven todo excepto DELETED para poder moderar.
  const statusFilter = isPrivilegedUser
    ? { not: "DELETED" as const }
    : ("PUBLISHED" as const);

  const [reviews, cache] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: statusFilter },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerId: true,
        ratingProduct: true,
        comment: true,
        createdAt: true,
        status: true,
      },
    }),
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: productId, targetType: "PRODUCT" } },
    }),
  ]);

  // El average siempre refleja solo reviews PUBLISHED (igual que el caché).
  const publishedReviews = isPrivilegedUser
    ? reviews.filter((r) => r.status === "PUBLISHED")
    : reviews;

  const averageRating =
    cache?.averageRating ??
    (publishedReviews.length > 0
      ? publishedReviews.reduce((sum, r) => sum + r.ratingProduct, 0) /
        publishedReviews.length
      : 0);

  return Response.json({
    productId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    reviews: reviews.map((r) => ({
      reviewId: r.id,
      buyerId: r.buyerId,
      rating: r.ratingProduct,
      comment: r.comment,
      createdAt: r.createdAt,
      ...(isPrivilegedUser && { status: r.status }),
    })),
  });
}
