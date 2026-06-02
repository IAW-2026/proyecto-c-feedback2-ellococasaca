import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["PUBLISHED", "HIDDEN"] as const;
type ModerationStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("moderator") && !roles.includes("admin")) {
    return Response.json({ error: "Insufficient permissions." }, { status: 403 });
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

  const { status } = body as { status?: string };
  if (!status || !ALLOWED_STATUSES.includes(status as ModerationStatus)) {
    return Response.json(
      { error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { status: status as ModerationStatus, isModerated: true },
  });

  return Response.json({
    reviewId: id,
    status: updated.status,
    isModerated: updated.isModerated,
  });
}
