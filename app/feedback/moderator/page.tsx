import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { moderateReviewAction, resolveReportAction } from "@/feedback-management";

const PAGE_SIZE = 10;

export default async function ModeratorFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("moderator") && !roles.includes("admin")) {
    redirect("/feedback");
  }

  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const query = q?.trim() || undefined;

  const reviewFilter = query
    ? {
        OR: [
          { buyerId: { contains: query, mode: "insensitive" as const } },
          { sellerId: { contains: query, mode: "insensitive" as const } },
          { productId: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const where = { status: "OPEN" as const, review: reviewFilter };

  const [reports, total] = await Promise.all([
    prisma.reviewReport.findMany({
      where,
      include: { review: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.reviewReport.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/feedback/moderator${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Moderador
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Cola de reportes
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Revisá cada reseña reportada y decidí si ocultarla, publicarla o cerrar el reporte.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-right">
          <p className={`text-2xl font-semibold ${total > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {total}
          </p>
          <p className="text-xs text-slate-400">
            {total === 1 ? "reporte abierto" : "reportes abiertos"}
          </p>
        </div>
      </div>

      <form method="get" action="/feedback/moderator" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Filtrar por buyer ID, seller ID o product ID..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
        />
        <button
          type="submit"
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Buscar
        </button>
        {query ? (
          <Link
            href="/feedback/moderator"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      {query ? (
        <p className="text-xs text-slate-500">
          Mostrando resultados para{" "}
          <span className="font-mono text-slate-300">{query}</span>
          {" · "}{total} {total === 1 ? "reporte" : "reportes"}
        </p>
      ) : null}

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-12 text-center">
          {query ? (
            <>
              <p className="text-sm font-medium text-slate-300">Sin resultados</p>
              <p className="mt-1 text-sm text-slate-500">
                No hay reportes abiertos para{" "}
                <span className="font-mono text-slate-400">{query}</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-emerald-400">Todo en orden</p>
              <p className="mt-1 text-sm text-slate-500">
                No hay reportes abiertos en este momento.
              </p>
            </>
          )}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-sm text-slate-400">
            Página {page} de {totalPages} · {total} reportes
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl(page - 1)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
              >
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={buildUrl(page + 1)}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Siguiente
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportCard({
  report,
}: {
  report: {
    id: string;
    reason: string;
    reporterId: string;
    createdAt: Date;
    review: {
      id: string;
      buyerId: string;
      sellerId: string;
      productId: string;
      orderId: string;
      ratingProduct: number;
      comment: string;
      status: string;
      isModerated: boolean;
      moderationReason: string | null;
      createdAt: Date;
    };
  };
}) {
  const { review } = report;

  const hideReview = moderateReviewAction.bind(null, review.id, "HIDDEN");
  const publishReview = moderateReviewAction.bind(null, review.id, "PUBLISHED");
  const resolveReport = resolveReportAction.bind(null, report.id, "RESOLVED");
  const dismissReport = resolveReportAction.bind(null, report.id, "DISMISSED");

  return (
    <article className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">
            Reporte abierto
          </p>
          <p className="mt-1.5 text-sm font-semibold text-white">{report.reason}</p>
          <p className="mt-1 text-xs text-slate-500">
            Reportado por{" "}
            <span className="font-mono text-slate-400">{report.reporterId}</span>
            {" · "}
            {report.createdAt.toLocaleDateString("es-AR")}
          </p>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-800 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Reseña reportada
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <IdChip label="Buyer" value={review.buyerId} />
          <IdChip label="Seller" value={review.sellerId} />
          <IdChip label="Producto" value={review.productId} />
          <IdChip label="Orden" value={review.orderId} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5">
            <p className="text-xs text-slate-500">Rating</p>
            <p className="text-sm font-semibold text-white">{review.ratingProduct}/5</p>
          </div>
          <p className="text-xs text-slate-500">
            {review.createdAt.toLocaleDateString("es-AR")}
            {review.isModerated ? (
              <span className="ml-2 text-amber-400">· Previamente moderada</span>
            ) : null}
          </p>
        </div>

        <p className="text-sm leading-6 text-slate-300">{review.comment}</p>

        {review.moderationReason ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Razón de moderación previa
            </p>
            <p className="mt-1 text-xs text-slate-300">{review.moderationReason}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Acción sobre la reseña
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <form action={hideReview}>
              <button
                type="submit"
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
              >
                Ocultar reseña
              </button>
            </form>
            <form action={publishReview}>
              <button
                type="submit"
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Publicar reseña
              </button>
            </form>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Acción sobre el reporte
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <form action={resolveReport}>
              <button
                type="submit"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Marcar resuelto
              </button>
            </form>
            <form action={dismissReport}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              >
                Desestimar
              </button>
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}

function IdChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs text-slate-300">{value}</p>
    </div>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    HIDDEN: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    PUBLISHED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    PENDING: "border-blue-400/30 bg-blue-500/10 text-blue-300",
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
