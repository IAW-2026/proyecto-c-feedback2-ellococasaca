import {
  FEEDBACK_WINDOW_CONTENT,
  getRolePermissionSummary,
} from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

export default async function SellerFeedbackPage() {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("seller") && !roles.includes("admin")) {
    redirect("/feedback");
  }

  const sellerId = roles.includes("seller") ? user?.id : undefined;

  const reviews = sellerId
    ? await prisma.review.findMany({
        where: {
          sellerId,
          status: {
            not: "DELETED",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  const permissions = getRolePermissionSummary(roles.includes("seller") ? "seller" : "admin");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          {FEEDBACK_WINDOW_CONTENT.seller.title}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Feedback recibido en tus productos
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          El vendedor solo mira reseñas relacionadas con los productos que vendió. No borra feedback desde esta ventana.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Crear" value={permissions.canCreate ? "Permitido" : "No permitido"} tone={permissions.canCreate ? "green" : "slate"} />
        <Card label="Mirar" value={permissions.canView ? "Permitido" : "No permitido"} tone="green" />
        <Card label="Eliminar" value={permissions.canDelete ? "Permitido" : "No permitido"} tone={permissions.canDelete ? "green" : "slate"} />
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
        Esta vista debería filtrar reseñas por productos vendidos por el vendedor actual.
      </div>

      <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Reseñas recibidas
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Feedbacks de tus ventas
          </h3>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Producto {review.productId}</p>
                    <p className="text-xs text-slate-400">
                      Buyer {review.buyerId} · Order {review.orderId} · {review.createdAt.toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                    {review.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-white/15 bg-slate-900 px-4 py-6 text-sm text-slate-300">
            No hay reseñas para este seller todavía.
          </p>
        )}
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "slate";
}) {
  return (
    <div className={`rounded-[1.75rem] border p-5 ${tone === "green" ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-slate-950"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}