import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!isInterServiceRequest(request)) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
