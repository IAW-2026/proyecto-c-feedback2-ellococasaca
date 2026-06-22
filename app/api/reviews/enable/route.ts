import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const secret = process.env.INTER_SERVICE_SECRET;
  if (secret && request.headers.get("x-inter-service-secret") !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId, shipmentId, buyerId, sellerId, productIds, deliveredAt } =
    body as {
      orderId?: string;
      shipmentId?: string;
      buyerId?: string;
      sellerId?: string;
      productIds?: string[];
      deliveredAt?: string;
    };

  if (
    !orderId ||
    !shipmentId ||
    !buyerId ||
    !sellerId ||
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    !deliveredAt
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await prisma.reviewEligibility.upsert({
      where: { orderId },
      create: {
        orderId,
        shipmentId,
        buyerId,
        sellerId,
        productIds,
        deliveredAt: new Date(deliveredAt),
        enabled: true,
      },
      update: {
        shipmentId,
        buyerId,
        sellerId,
        productIds,
        deliveredAt: new Date(deliveredAt),
        enabled: true,
      },
    });

    return Response.json({
      orderId,
      reviewEnabled: true,
      message: "Review eligibility enabled.",
    });
  } catch {
    return Response.json(
      { error: "Failed to enable review eligibility." },
      { status: 500 }
    );
  }
}
