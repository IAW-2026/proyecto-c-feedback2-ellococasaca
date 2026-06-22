import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("buyer")) {
    return Response.json({ error: "Only buyers can check eligibility." }, { status: 403 });
  }

  const { productId } = await params;

  const eligibilities = await prisma.reviewEligibility.findMany({
    where: {
      buyerId: user.id,
      productIds: { has: productId },
    },
  });

  if (eligibilities.length === 0) {
    return Response.json({
      productId,
      canReview: false,
      reason: "not_purchased",
      orders: [],
    });
  }

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

  const orders = eligibilities.map((eligibility) => {
    const review = reviewByOrderId.get(eligibility.orderId) ?? null;
    const canReview = eligibility.enabled && review === null;

    return {
      orderId: eligibility.orderId,
      sellerId: eligibility.sellerId,
      deliveredAt: eligibility.deliveredAt,
      canReview,
      reason: canReview
        ? "eligible"
        : review !== null
          ? "already_reviewed"
          : "not_enabled",
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
    };
  });

  const canReview = orders.some((o) => o.canReview);

  return Response.json({
    productId,
    canReview,
    reason: canReview
      ? "eligible"
      : orders.every((o) => o.reason === "already_reviewed")
        ? "already_reviewed"
        : "not_enabled",
    orders,
  });
}
