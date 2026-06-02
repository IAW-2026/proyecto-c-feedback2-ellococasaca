import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await params;

  const [reviews, cache] = await Promise.all([
    prisma.review.findMany({
      where: { sellerId, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerId: true,
        ratingSeller: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
    }),
  ]);

  const totalReviews = reviews.length;
  const averageRating =
    cache?.averageRating ??
    (totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.ratingSeller, 0) / totalReviews
      : 0);

  return Response.json({
    sellerId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    reviews: reviews.map((r) => ({
      reviewId: r.id,
      buyerId: r.buyerId,
      rating: r.ratingSeller,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
