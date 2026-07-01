import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";
import { refreshRatingsCache } from "@/lib/ratings-cache";
import { isInterServiceRequest } from "@/lib/inter-service-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isInterServiceRequest(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const roles = normalizeRoles(user.publicMetadata);
  if (!roles.includes("admin"))
    return Response.json({ error: "Only admins can delete reviews." }, { status: 403 });

  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    return Response.json({ error: "Review not found." }, { status: 404 });
  }

  await prisma.review.update({ where: { id }, data: { status: "DELETED" } });
  await refreshRatingsCache(review.productId, review.sellerId);

  return Response.json({ reviewId: id, status: "DELETED" });
}
