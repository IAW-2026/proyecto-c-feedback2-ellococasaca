import Link from "next/link";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Administrador
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Panel de control
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Búsqueda transversal sobre todas las reseñas activas. La eliminación es irreversible.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-right">
            <p className="text-2xl font-semibold text-white">{reviews.length}</p>
            <p className="text-xs text-slate-400">
              {query ? `resultado${reviews.length !== 1 ? "s" : ""} para "${query}"` : "reseñas activas"}
            </p>
          </div>
          <Link
            href="/feedback/admin/sellers"
            className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            Ver sellers →
          </Link>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
          Buscador global
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_140px]" method="get">
          <input
            name="q"
            defaultValue={query}
            className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/40"
            placeholder="Buscar por usuario, producto, orden o comentario..."
          />
          <button
            type="submit"
            className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Buscar
          </button>
        </form>
        {query && (
          <form method="get" className="mt-2">
            <button
              type="submit"
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
            >
              Limpiar búsqueda
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-10 text-center">
            <p className="text-sm text-slate-400">
              {query
                ? `No se encontraron reseñas para "${query}".`
                : "No hay reseñas activas en el sistema."}
            </p>
          </div>
        )}
      </section>
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
    comment: string;
    status: string;
    isModerated: boolean;
    moderationReason: string | null;
  };
}) {
  const deleteWithId = deleteReviewAction.bind(null, review.id);

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            Producto <span className="font-mono text-amber-300">{review.productId}</span>
          </p>
          <p className="text-xs text-slate-400">
            Orden <span className="font-mono">{review.orderId}</span>
          </p>
          <p className="text-xs text-slate-500">
            Comprador: {review.buyerId} · Vendedor: {review.sellerId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={review.status} />
          {review.isModerated && (
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              Moderada
            </span>
          )}
          <form action={deleteWithId}>
            <button
              type="submit"
              className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <RatingChip label="Producto" value={review.ratingProduct} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>

      {review.moderationReason && (
        <p className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 px-4 py-2 font-mono text-xs text-violet-300">
          {review.moderationReason}
        </p>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    HIDDEN: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    PUBLISHED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    DELETED: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? "border-white/10 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

function RatingChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}/5</p>
    </div>
  );
}
