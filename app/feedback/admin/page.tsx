import { FEEDBACK_WINDOW_CONTENT, getRolePermissionSummary } from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";
import { deleteReviewAction } from "@/feedback-management";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("admin")) {
    redirect("/feedback");
  }

  const { q = "" } = await searchParams;
  const query = q.trim();

  const reviews = await prisma.review.findMany({
    where: {
      status: { not: "DELETED" },
      ...(query
        ? {
            OR: [
              { orderId: { contains: query, mode: "insensitive" } },
              { buyerId: { contains: query, mode: "insensitive" } },
              { sellerId: { contains: query, mode: "insensitive" } },
              { productId: { contains: query, mode: "insensitive" } },
              { comment: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const permissions = getRolePermissionSummary("admin");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          {FEEDBACK_WINDOW_CONTENT.admin.title}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Búsqueda global y moderación total
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          El admin puede buscar cualquier reseña de cualquier usuario y eliminarla si hace falta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Crear" value="No necesario" tone="slate" />
        <Card label="Mirar" value={permissions.canView ? "Permitido" : "No permitido"} tone="green" />
        <Card label="Eliminar" value={permissions.canDelete ? "Permitido" : "No permitido"} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Buscador global
          </p>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]" method="get">
            <input
              name="q"
              defaultValue={query}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Buscar por usuario, producto, orderId o texto del comentario"
            />
            <button
              type="submit"
              className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Buscar
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-white/15 bg-slate-900 px-4 py-6 text-sm text-slate-300">
                No hay reseñas para mostrar con el filtro actual.
              </p>
            )}
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
          Búsqueda transversal sobre todas las reseñas activas. Podés eliminar cualquier reseña desde acá; la acción es irreversible.
        </aside>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
}: {
  review: {
    id: string;
    buyerId: string;
    sellerId: string;
    orderId: string;
    productId: string;
    ratingProduct: number;
    ratingSeller: number;
    comment: string;
    status: string;
    isModerated: boolean;
  };
}) {
  const deleteWithId = deleteReviewAction.bind(null, review.id);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Producto {review.productId}</p>
          <p className="text-xs text-slate-400">
            Buyer: {review.buyerId} · Seller: {review.sellerId}
          </p>
          <p className="text-xs text-slate-400">Order: {review.orderId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              review.status === "HIDDEN"
                ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                : "border-white/10 text-slate-300"
            }`}
          >
            {review.status}
          </span>
          <form action={deleteWithId}>
            <button
              type="submit"
              className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Rating producto: {review.ratingProduct}/5 · Rating vendedor: {review.ratingSeller}/5
        {review.isModerated && " · Moderada"}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{review.comment}</p>
    </article>
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
    <div
      className={`rounded-[1.75rem] border p-5 ${
        tone === "green"
          ? "border-emerald-400/30 bg-emerald-500/10"
          : "border-white/10 bg-slate-950"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}