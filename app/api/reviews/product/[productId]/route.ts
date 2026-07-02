import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/clerk-roles";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!isInterServiceRequest(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("buyer") && !roles.includes("seller"))
    return Response.json({ error: "Only buyers and sellers can access product reviews." }, { status: 403 });

  const { productId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const take = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10), 0);

  const where = { productId, status: "PUBLISHED" as const };

  const [reviews, total, cache] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        buyerId: true,
        ratingProduct: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: productId, targetType: "PRODUCT" } },
    }),
  ]);

  const averageRating =
    cache?.averageRating ??
    (total > 0 ? reviews.reduce((sum, r) => sum + r.ratingProduct, 0) / reviews.length : 0);

  return Response.json({
    productId,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: total,
    skip,
    take,
    reviews: reviews.map((r) => ({
      reviewId: r.id,
      buyerId: r.buyerId,
      rating: r.ratingProduct,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
