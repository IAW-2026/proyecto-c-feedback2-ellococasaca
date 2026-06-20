"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { canDeleteFeedback, canSearchAnyFeedback } from "@/lib/feedback-permissions";
import { revalidatePath } from "next/cache";

/**
 * Acción para que un Administrador elimine una reseña.
 */
export async function deleteReviewAction(reviewId: string) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!canDeleteFeedback(roles.includes("admin") ? "admin" : undefined)) {
    throw new Error("No tienes permisos para eliminar reseñas.");
  }

  const deleted = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "DELETED" },
  });

  await prisma.reviewEligibility.updateMany({
    where: { orderId: deleted.orderId },
    data: { enabled: true },
  });

  revalidatePath("/feedback/admin");
  revalidatePath("/feedback/seller");
}

/**
 * Acción para moderar una reseña (Moderador o Admin).
 */
export async function moderateReviewAction(reviewId: string, newStatus: "HIDDEN" | "PUBLISHED") {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);
  
  // Verificamos si es moderador o admin usando la lógica de búsqueda global como proxy de permiso
  const canModerate = roles.includes("moderator") || roles.includes("admin");

  if (!canModerate) {
    throw new Error("No tienes permisos de moderación.");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: newStatus },
  });

  revalidatePath("/feedback/moderator");
}

/**
 * Acción para que un Moderador o Admin resuelva o descarte un reporte.
 */
export async function resolveReportAction(
  reportId: string,
  resolution: "RESOLVED" | "DISMISSED",
) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  const canModerate = roles.includes("moderator") || roles.includes("admin");
  if (!canModerate) {
    throw new Error("No tienes permisos de moderación.");
  }

  await prisma.reviewReport.update({
    where: { id: reportId },
    data: { status: resolution },
  });

  revalidatePath("/feedback/moderator");
}

/**
 * Obtener feedback con filtros (Búsqueda global).
 */
export async function getGlobalFeedbackAction(query: string) {
  const { sessionClaims } = await auth();
  const roles = normalizeRoles(sessionClaims?.metadata);

  if (!canSearchAnyFeedback(roles.find(r => r === "admin" || r === "moderator"))) {
    throw new Error("Acceso denegado a la búsqueda global.");
  }

  return await prisma.review.findMany({
    where: {
      comment: { contains: query, mode: "insensitive" },
      status: { not: "DELETED" }
    }
  });
}
