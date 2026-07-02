import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/clerk-roles";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!isInterServiceRequest(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("buyer") && !roles.includes("seller"))
    return Response.json({ error: "Only buyers and sellers can access seller reviews." }, { status: 403 });

  const { sellerId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const take = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10), 0);

  const where = { sellerId, status: { not: "DELETED" as const } };

  const [reviews, total, cache] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        buyerId: true,
        productId: true,
        ratingProduct: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
    }),
  ]);

  // Seller average comes from the cache (average of product averages)
  // Fallback: group by product and average those averages
  let averageRating = cache?.averageRating ?? null;
  if (averageRating === null) {
    const productGroups = await prisma.review.groupBy({
      by: ["productId"],
      where,
      _avg: { ratingProduct: true },
    });
    averageRating =
      productGroups.length > 0
        ? productGroups.reduce((sum, g) => sum + (g._avg.ratingProduct ?? 0), 0) / productGroups.length
        : 0;
  }

  return Response.json({
    sellerId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: total,
    skip,
    take,
    reviews: reviews.map((r) => ({
      reviewId: r.id,
      buyerId: r.buyerId,
      productId: r.productId,
      ratingProduct: r.ratingProduct,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
