"use server";

// @deprecated La creación de reseñas fue migrada al endpoint POST /api/reviews,
// que es el canal oficial para todas las apps externas. Esta server action queda
// deshabilitada funcionalmente (devuelve error inmediato) pero el código se conserva
// hasta confirmar que no hay dependencias activas.

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/clerk-roles";
import { refreshRatingsCache } from "@/lib/ratings-cache";
import { moderateComment, buildModerationReportReason } from "@/lib/moderation";

export type BuyerReviewActionState = {
  message?: string;
  error?: string;
  fieldErrors?: {
    orderId?: string;
    productId?: string;
    ratingProduct?: string;
    comment?: string;
  };
};

const initialState: BuyerReviewActionState = {};

function toStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInt(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}

export async function createBuyerReview(
  previousState: BuyerReviewActionState = initialState,
  formData: FormData,
): Promise<BuyerReviewActionState> {
  void previousState;
  void formData;

  // @deprecated: usar POST /api/reviews en su lugar.
  return {
    error:
      "Esta vía de creación está deshabilitada. Las reseñas deben crearse a través del endpoint POST /api/reviews.",
  };

  // — Código original conservado debajo. No se ejecuta. —

  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return { error: "Tenés que iniciar sesión para crear una reseña." };
  }

  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("buyer")) {
    return { error: "Solo un buyer puede crear reseñas desde esta ventana." };
  }

  const orderId = toStringValue(formData.get("orderId"));
  const productId = toStringValue(formData.get("productId"));
  const comment = toStringValue(formData.get("comment"));
  const ratingProduct = toPositiveInt(toStringValue(formData.get("ratingProduct")));

  const fieldErrors: NonNullable<BuyerReviewActionState["fieldErrors"]> = {};

  if (!orderId) {
    fieldErrors.orderId = "El orderId es obligatorio.";
  }

  if (!productId) {
    fieldErrors.productId = "El productId es obligatorio.";
  }

  if (ratingProduct === null) {
    fieldErrors.ratingProduct = "La calificación del producto debe estar entre 1 y 5.";
  }

  if (!comment) {
    fieldErrors.comment = "El comentario es obligatorio.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ratingProductValue = ratingProduct as number;

  const eligibility = await prisma.reviewEligibility.findUnique({
    where: {
      orderId,
    },
  });

  if (!eligibility || eligibility!.buyerId !== userId) {
    return {
      error: "No encontramos una orden habilitada para que crees esta reseña.",
    };
  }

  if (!eligibility!.enabled) {
    return {
      error: "La reseña todavía no está habilitada para esta orden.",
    };
  }

  if (!eligibility!.productIds.includes(productId)) {
    return {
      error: "El producto no pertenece a la orden habilitada.",
    };
  }

  const moderation = await moderateComment(comment, { productId, orderId });

  const reviewStatus: "PUBLISHED" | "HIDDEN" | "PENDING" =
    moderation.outcome === "APPROVED"
      ? "PUBLISHED"
      : moderation.outcome === "REJECTED"
        ? "HIDDEN"
        : "PENDING";

  const reviewIsModerated =
    moderation.method === "claude" || moderation.outcome !== "APPROVED";

  const reviewData = {
    buyerId: userId!,
    sellerId: eligibility!.sellerId,
    productId,
    ratingProduct: ratingProductValue,
    comment,
    status: reviewStatus,
    isModerated: reviewIsModerated,
    moderationReason: buildModerationReportReason(moderation),
  };

  try {
    await prisma.$transaction([
      prisma.review.upsert({
        where: { orderId },
        create: { orderId, ...reviewData },
        update: reviewData,
      }),
      prisma.reviewEligibility.update({
        where: { orderId },
        data: { enabled: false },
      }),
    ]);
  } catch (error) {
    console.error("[createBuyerReview] prisma.review.upsert falló:", error);
    return {
      error: "No se pudo guardar la reseña.",
    };
  }

  await refreshRatingsCache(productId, eligibility!.sellerId);
  revalidatePath("/feedback/buyer");

  if (moderation.outcome === "REJECTED") {
    return {
      message:
        "Tu reseña fue registrada pero no pudo publicarse porque contiene contenido inapropiado.",
    };
  }
  if (moderation.outcome === "MANUAL_REVIEW") {
    return {
      message:
        "Tu reseña está siendo revisada por nuestro equipo antes de publicarse.",
    };
  }
  return { message: "La reseña fue creada correctamente." };
}
