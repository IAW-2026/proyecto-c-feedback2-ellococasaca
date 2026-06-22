import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("buyer")) {
    return Response.json({ error: "Only buyers can access purchases." }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const take = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10), 0);

  const where = { buyerId: user.id };

  const [eligibilities, total] = await Promise.all([
    prisma.reviewEligibility.findMany({
      where,
      orderBy: { deliveredAt: "desc" },
      take,
      skip,
    }),
    prisma.reviewEligibility.count({ where }),
  ]);

  const orderIds = eligibilities.map((e) => e.orderId);

  const existingReviews = await prisma.review.findMany({
    where: { orderId: { in: orderIds }, status: { not: "DELETED" } },
    select: {
      orderId: true,
      id: true,
      productId: true,
      ratingProduct: true,
      ratingSeller: true,
      comment: true,
      status: true,
      createdAt: true,
    },
  });

  const reviewByOrderId = new Map(existingReviews.map((r) => [r.orderId, r]));

  const items = eligibilities.flatMap((eligibility) => {
    const review = reviewByOrderId.get(eligibility.orderId) ?? null;

    return eligibility.productIds.map((productId) => ({
      orderId: eligibility.orderId,
      productId,
      sellerId: eligibility.sellerId,
      deliveredAt: eligibility.deliveredAt,
      canReview: eligibility.enabled && review === null,
      review: review
        ? {
            reviewId: review.id,
            reviewedProductId: review.productId,
            ratingProduct: review.ratingProduct,
            ratingSeller: review.ratingSeller,
            comment: review.comment,
            status: review.status,
            createdAt: review.createdAt,
          }
        : null,
    }));
  });

  return Response.json({
    total,
    skip,
    take,
    items,
  });
}
