import { prisma } from "@/lib/prisma";

export async function refreshRatingsCache(productId: string, sellerId: string) {
  // Step 1: recalculate and persist the product cache (only PUBLISHED reviews count)
  const productStats = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { ratingProduct: true },
    _count: { id: true },
  });

  await prisma.ratingsCache.upsert({
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
  });

  // Step 2: find all distinct products this seller has PUBLISHED reviews for
  // (products with no published reviews are excluded from the seller average)
  const sellerProductRows = await prisma.review.findMany({
    where: { sellerId, status: "PUBLISHED" },
    distinct: ["productId"],
    select: { productId: true },
  });
  const productIds = sellerProductRows.map((r) => r.productId);

  // Step 3: read the (now-updated) product caches for those products
  const productCaches = await prisma.ratingsCache.findMany({
    where: { targetId: { in: productIds }, targetType: "PRODUCT" },
  });

  // Step 4: seller rating = average of product averages; total = sum of product review counts
  const sellerAverage =
    productCaches.length > 0
      ? productCaches.reduce((sum, c) => sum + c.averageRating, 0) / productCaches.length
      : 0;
  const totalReviews = productCaches.reduce((sum, c) => sum + c.totalReviews, 0);

  await prisma.ratingsCache.upsert({
    where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
    create: { targetId: sellerId, targetType: "SELLER", averageRating: sellerAverage, totalReviews },
    update: { averageRating: sellerAverage, totalReviews },
  });
}
