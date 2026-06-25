import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/clerk-roles";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 50);
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0"), 0);
  const q = searchParams.get("q")?.trim() ?? "";

  const where = {
    status: { not: "DELETED" as const },
    ...(q && {
      OR: [
        { orderId: { contains: q, mode: "insensitive" as const } },
        { buyerId: { contains: q, mode: "insensitive" as const } },
        { sellerId: { contains: q, mode: "insensitive" as const } },
        { productId: { contains: q, mode: "insensitive" as const } },
        { comment: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        productId: true,
        orderId: true,
        ratingProduct: true,
        comment: true,
        status: true,
        isModerated: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({ reviews, total, skip, take: limit });
}
