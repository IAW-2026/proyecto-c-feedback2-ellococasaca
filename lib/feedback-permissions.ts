import type { AppRole } from "@/lib/clerk-roles";

export type FeedbackWindowRole = Extract<AppRole, "buyer" | "seller" | "moderator" | "admin">;

export const FEEDBACK_WINDOW_ROLES: FeedbackWindowRole[] = [
  "buyer",
  "seller",
  "moderator",
  "admin",
];

export const FEEDBACK_WINDOW_CONTENT: Record<
  FeedbackWindowRole,
  {
    title: string;
    subtitle: string;
    route: string;
    create: string;
    view: string;
    remove: string;
    extra: string;
  }
> = {
  buyer: {
    title: "Ventana Buyer",
    subtitle: "Feedback sobre productos que compraste y recibiste.",
    route: "/feedback/buyer",
    create:
      "Puede crear reseñas solo sobre pedidos entregados y productos comprados.",
    view: "Puede ver reseñas asociadas a los productos que compró.",
    remove: "No puede eliminar reseñas.",
    extra: "Se prioriza la experiencia posterior a la compra.",
  },
  seller: {
    title: "Ventana Seller",
    subtitle: "Feedback recibido por los productos que vendiste.",
    route: "/feedback/seller",
    create:
      "No crea reseñas desde esta ventana; la vista está centrada en reputación.",
    view: "Puede ver feedbacks asociados a sus productos vendidos.",
    remove: "No puede eliminar reseñas.",
    extra: "Sirve para monitorear reputación y comentarios recibidos.",
  },
  moderator: {
    title: "Ventana Moderator",
    subtitle: "Moderación: revisar reportes y ocultar contenido inapropiado.",
    route: "/feedback/moderator",
    create: "No crea reseñas; enfocado en revisión y acciones de moderación.",
    view: "Puede ver reseñas y reportes para moderarlas.",
    remove: "No puede eliminar permanentemente (solo admin puede eliminar).", 
    extra: "Puede ocultar/revisar reseñas y resolver reportes.",
  },
  admin: {
    title: "Ventana Admin",
    subtitle: "Búsqueda global, moderación y eliminación de reseñas.",
    route: "/feedback/admin",
    create: "No necesita crear feedback para moderarlo.",
    view: "Puede buscar y ver cualquier reseña de cualquier usuario.",
    remove: "Puede eliminar cualquier reseña o marcarla como moderada.",
    extra: "Es la única ventana con búsqueda global y borrado total.",
  },
};

export function canCreateFeedback(role: AppRole | undefined) {
  return role === "buyer";
}

export function canViewFeedback(role: AppRole | undefined) {
  return role === "buyer" || role === "seller" || role === "admin" || role === "moderator";
}

export function canDeleteFeedback(role: AppRole | undefined) {
  return role === "admin";
}

export function canSearchAnyFeedback(role: AppRole | undefined) {
  return role === "admin" || role === "moderator";
}

export function getPrimaryFeedbackRole(roles: readonly AppRole[]) {
  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("moderator")) {
    return "moderator";
  }

  if (roles.includes("seller")) {
    return "seller";
  }

  return roles.includes("buyer") ? "buyer" : undefined;
}

export function getAccessibleFeedbackWindows(roles: readonly AppRole[]) {
  return FEEDBACK_WINDOW_ROLES.filter((role) => roles.includes(role));
}

export function getRolePermissionSummary(role: AppRole | undefined) {
  return {
    canCreate: canCreateFeedback(role),
    canView: canViewFeedback(role),
    canDelete: canDeleteFeedback(role),
    canSearchAny: canSearchAnyFeedback(role),
  };
}