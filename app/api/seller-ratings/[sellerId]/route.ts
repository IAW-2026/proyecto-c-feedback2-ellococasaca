import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!isInterServiceRequest(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { sellerId } = await params;

  const cache = await prisma.ratingsCache.findUnique({
    where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
  });

  if (cache) {
    return Response.json({
      sellerId,
      averageRating: Math.round(cache.averageRating * 10) / 10,
      totalReviews: cache.totalReviews,
    });
  }

  // Fallback: compute seller rating as average of per-product averages
  const productGroups = await prisma.review.groupBy({
    by: ["productId"],
    where: { sellerId, status: { not: "DELETED" } },
    _avg: { ratingProduct: true },
    _count: { id: true },
  });

  const averageRating =
    productGroups.length > 0
      ? productGroups.reduce((sum, g) => sum + (g._avg.ratingProduct ?? 0), 0) / productGroups.length
      : 0;
  const totalReviews = productGroups.reduce((sum, g) => sum + g._count.id, 0);

  return Response.json({
    sellerId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  });
}
