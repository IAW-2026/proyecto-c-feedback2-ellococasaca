import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let reporterId: string;
  if (isInterServiceRequest(request)) {
    reporterId = "system:inter-service";
  } else {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    reporterId = userId;
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.status === "DELETED") {
    return Response.json({ error: "Review not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reason } = body as { reason?: string };
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return Response.json({ error: "Reason is required." }, { status: 400 });
  }

  const report = await prisma.reviewReport.create({
    data: {
      reviewId: id,
      reporterId,
      reason: reason.trim(),
      status: "OPEN",
    },
  });

  return Response.json(
    { reportId: report.id, reviewId: id, status: report.status },
    { status: 201 }
  );
}
