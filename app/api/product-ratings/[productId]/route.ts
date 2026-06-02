import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const [reviews, cache] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerId: true,
        ratingProduct: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: productId, targetType: "PRODUCT" } },
    }),
  ]);

  const totalReviews = reviews.length;
  const averageRating =
    cache?.averageRating ??
    (totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.ratingProduct, 0) / totalReviews
      : 0);

  return Response.json({
    productId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    reviews: reviews.map((r) => ({
      reviewId: r.id,
      buyerId: r.buyerId,
      rating: r.ratingProduct,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
