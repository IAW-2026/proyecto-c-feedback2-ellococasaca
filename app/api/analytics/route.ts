import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

export async function GET(request: Request) {
  if (!isInterServiceRequest(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("admin")) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [
    reviewsByStatus,
    moderatedCount,
    reviewsLast7Days,
    reviewsLast30Days,
    avgRating,
    ratingDist,
    reportsByStatus,
    reportsLast7Days,
    reportsLast30Days,
    eligibilityCount,
    eligibilityConsumedCount,
    eligibilityPendingCount,
    topSellers,
    topProducts,
  ] = await Promise.all([
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.review.count({ where: { isModerated: true } }),
    prisma.review.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.review.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.review.aggregate({
      _avg: { ratingProduct: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.review.groupBy({
      by: ["ratingProduct"],
      _count: { _all: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.reviewReport.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.reviewReport.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.reviewReport.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.reviewEligibility.count(),
    prisma.reviewEligibility.count({ where: { enabled: false } }),
    prisma.reviewEligibility.count({ where: { enabled: true } }),
    prisma.ratingsCache.findMany({
      where: { targetType: "SELLER" },
      orderBy: { averageRating: "desc" },
      take: 10,
    }),
    prisma.ratingsCache.findMany({
      where: { targetType: "PRODUCT" },
      orderBy: { averageRating: "desc" },
      take: 10,
    }),
  ]);

  const reviewStatusMap: Record<string, number> = {
    PUBLISHED: 0,
    HIDDEN: 0,
    DELETED: 0,
    PENDING: 0,
  };
  for (const row of reviewsByStatus) {
    reviewStatusMap[row.status] = row._count._all;
  }

  const reportStatusMap: Record<string, number> = {
    OPEN: 0,
    RESOLVED: 0,
    DISMISSED: 0,
  };
  for (const row of reportsByStatus) {
    reportStatusMap[row.status] = row._count._all;
  }

  const productDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of ratingDist) productDist[row.ratingProduct] = row._count._all;

  return Response.json({
    reviews: {
      total: Object.values(reviewStatusMap).reduce((a, b) => a + b, 0),
      byStatus: reviewStatusMap,
      moderated: moderatedCount,
      last7Days: reviewsLast7Days,
      last30Days: reviewsLast30Days,
      averageRating: avgRating._avg.ratingProduct ?? 0,
      ratingDistribution: productDist,
    },
    reports: {
      total: Object.values(reportStatusMap).reduce((a, b) => a + b, 0),
      byStatus: reportStatusMap,
      last7Days: reportsLast7Days,
      last30Days: reportsLast30Days,
    },
    eligibilities: {
      total: eligibilityCount,
      consumed: eligibilityConsumedCount,
      pending: eligibilityPendingCount,
    },
    topSellers: topSellers.map((s) => ({
      targetId: s.targetId,
      sellerId: s.targetId,
      averageRating: s.averageRating,
      totalReviews: s.totalReviews,
    })),
    topProducts: topProducts.map((p) => ({
      targetId: p.targetId,
      productId: p.targetId,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
    })),
  });
}
