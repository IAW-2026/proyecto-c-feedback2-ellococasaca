import { prisma } from "@/lib/prisma";

export async function refreshRatingsCache(productId: string, sellerId: string) {
  const [productStats, sellerStats] = await Promise.all([
    prisma.review.aggregate({
      where: { productId, status: { not: "DELETED" } },
      _avg: { ratingProduct: true },
      _count: { id: true },
    }),
    prisma.review.aggregate({
      where: { sellerId, status: { not: "DELETED" } },
      _avg: { ratingSeller: true },
      _count: { id: true },
    }),
  ]);

  await Promise.all([
    prisma.ratingsCache.upsert({
      where: { targetId_targetType: { targetId: productId, targetType: "PRODUCT" } },
      create: {
        targetId: productId,
        targetType: "PRODUCT",
        averageRating: productStats._avg.ratingProduct ?? 0,
        totalReviews: productStats._count.id,
      },
      update: {
        averageRating: productStats._avg.ratingProduct ?? 0,
        totalReviews: productStats._count.id,
      },
    }),
    prisma.ratingsCache.upsert({
      where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
      create: {
        targetId: sellerId,
        targetType: "SELLER",
        averageRating: sellerStats._avg.ratingSeller ?? 0,
        totalReviews: sellerStats._count.id,
      },
      update: {
        averageRating: sellerStats._avg.ratingSeller ?? 0,
        totalReviews: sellerStats._count.id,
      },
    }),
  ]);
}
