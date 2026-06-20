import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";
import { refreshRatingsCache } from "@/lib/ratings-cache";
import { buildModerationReportReason, moderateComment } from "@/lib/moderation";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("buyer")) {
    return Response.json({ error: "Only buyers can create reviews." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId, productId, sellerId, productRating, sellerRating, comment } =
    body as {
      orderId?: string;
      productId?: string;
      sellerId?: string;
      productRating?: number;
      sellerRating?: number;
      comment?: string;
    };

  if (!orderId || !productId || !sellerId || !comment?.trim()) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (
    !Number.isInteger(productRating) ||
    (productRating as number) < 1 ||
    (productRating as number) > 5 ||
    !Number.isInteger(sellerRating) ||
    (sellerRating as number) < 1 ||
    (sellerRating as number) > 5
  ) {
    return Response.json(
      { error: "Ratings must be integers between 1 and 5." },
      { status: 400 }
    );
  }

  const eligibility = await prisma.reviewEligibility.findUnique({
    where: { orderId },
  });

  if (!eligibility || eligibility.buyerId !== user.id || !eligibility.enabled) {
    return Response.json({ error: "Order not eligible for review." }, { status: 403 });
  }

  if (!eligibility.productIds.includes(productId)) {
    return Response.json(
      { error: "Product does not belong to this order." },
      { status: 403 }
    );
  }

  if (eligibility.sellerId !== sellerId) {
    return Response.json(
      { error: "Seller does not belong to this order." },
      { status: 403 }
    );
  }

  const trimmedComment = comment.trim();
  const moderation = await moderateComment(trimmedComment, { productId, orderId });

  const reviewStatus =
    moderation.outcome === "APPROVED"
      ? "PUBLISHED"
      : moderation.outcome === "REJECTED"
        ? "HIDDEN"
        : "PENDING";

  const reviewIsModerated =
    moderation.method === "claude" || moderation.outcome !== "APPROVED";

  try {
    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          orderId,
          buyerId: user.id,
          sellerId: eligibility.sellerId,
          productId,
          ratingProduct: productRating as number,
          ratingSeller: sellerRating as number,
          comment: trimmedComment,
          status: reviewStatus,
          isModerated: reviewIsModerated,
        },
      });

      if (moderation.outcome !== "APPROVED") {
        await tx.reviewReport.create({
          data: {
            reviewId: createdReview.id,
            reporterId: "system:auto-moderation",
            reason: buildModerationReportReason(moderation),
            status: "OPEN",
          },
        });
      }

      return createdReview;
    });

    if (moderation.outcome === "APPROVED") {
      await refreshRatingsCache(productId, eligibility.sellerId);
    }

    return Response.json(
      {
        reviewId: review.id,
        status: review.status,
        createdAt: review.createdAt,
        moderation: {
          outcome: moderation.outcome,
          method: moderation.method,
          score: moderation.score,
          matchedLabels: moderation.matchedLabels,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return Response.json(
        { error: "A review for this order already exists." },
        { status: 409 }
      );
    }
    return Response.json({ error: "Failed to create review." }, { status: 500 });
  }
}
