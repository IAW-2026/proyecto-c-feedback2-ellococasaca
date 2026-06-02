"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/clerk-roles";
import { refreshRatingsCache } from "@/lib/ratings-cache";

export type BuyerReviewActionState = {
  message?: string;
  error?: string;
  fieldErrors?: {
    orderId?: string;
    productId?: string;
    ratingProduct?: string;
    ratingSeller?: string;
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
  const ratingSeller = toPositiveInt(toStringValue(formData.get("ratingSeller")));

  const fieldErrors: BuyerReviewActionState["fieldErrors"] = {};

  if (!orderId) {
    fieldErrors.orderId = "El orderId es obligatorio.";
  }

  if (!productId) {
    fieldErrors.productId = "El productId es obligatorio.";
  }

  if (ratingProduct === null) {
    fieldErrors.ratingProduct = "La calificación del producto debe estar entre 1 y 5.";
  }

  if (ratingSeller === null) {
    fieldErrors.ratingSeller = "La calificación del vendedor debe estar entre 1 y 5.";
  }

  if (!comment) {
    fieldErrors.comment = "El comentario es obligatorio.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ratingProductValue = ratingProduct as number;
  const ratingSellerValue = ratingSeller as number;

  const eligibility = await prisma.reviewEligibility.findUnique({
    where: {
      orderId,
    },
  });

  if (!eligibility || eligibility.buyerId !== userId) {
    return {
      error: "No encontramos una orden habilitada para que crees esta reseña.",
    };
  }

  if (!eligibility.enabled) {
    return {
      error: "La reseña todavía no está habilitada para esta orden.",
    };
  }

  if (!eligibility.productIds.includes(productId)) {
    return {
      error: "El producto no pertenece a la orden habilitada.",
    };
  }

  try {
    await prisma.review.create({
      data: {
        orderId,
        buyerId: userId,
        sellerId: eligibility.sellerId,
        productId,
        ratingProduct: ratingProductValue,
        ratingSeller: ratingSellerValue,
        comment,
        status: "PUBLISHED",
        isModerated: false,
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message.includes("Unique constraint")
          ? "Ya existe una reseña para esta orden."
          : "No se pudo guardar la reseña.",
    };
  }

  await refreshRatingsCache(productId, eligibility.sellerId);
  revalidatePath("/feedback/buyer");

  return {
    message: "La reseña fue creada correctamente.",
  };
}