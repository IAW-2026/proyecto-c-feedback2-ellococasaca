import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { moderateReviewAction, resolveReportAction } from "@/feedback-management";

export default async function ModeratorFeedbackPage() {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("moderator") && !roles.includes("admin")) {
    redirect("/feedback");
  }

  const reports = await prisma.reviewReport.findMany({
    where: { status: "OPEN" },
    include: { review: true },
    orderBy: { createdAt: "desc" },
  });

  const openCount = reports.length;

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
          <p className={`text-2xl font-semibold ${openCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {openCount}
          </p>
          <p className="text-xs text-slate-400">
            {openCount === 1 ? "reporte abierto" : "reportes abiertos"}
          </p>
        </div>
      </div>

      {openCount > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-12 text-center">
          <p className="text-sm font-medium text-emerald-400">Todo en orden</p>
          <p className="mt-1 text-sm text-slate-500">No hay reportes abiertos en este momento.</p>
        </div>
      )}
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
      ratingSeller: number;
      comment: string;
      status: string;
    };
  };
}) {
  const { review } = report;

  const hideReview = moderateReviewAction.bind(null, review.id, "HIDDEN");
  const publishReview = moderateReviewAction.bind(null, review.id, "PUBLISHED");
  const resolveReport = resolveReportAction.bind(null, report.id, "RESOLVED");
  const dismissReport = resolveReportAction.bind(null, report.id, "DISMISSED");

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">
            Reporte abierto
          </p>
          <p className="mt-1.5 text-sm font-semibold text-white">{report.reason}</p>
          <p className="mt-1 text-xs text-slate-500">
            Reportado por {report.reporterId} · {report.createdAt.toLocaleDateString("es-AR")}
          </p>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Reseña reportada
        </p>
        <p className="text-xs text-slate-500">
          Producto <span className="font-mono text-slate-400">{review.productId}</span>
          {" · "}Orden <span className="font-mono text-slate-400">{review.orderId}</span>
        </p>
        <div className="flex gap-4">
          <RatingChip label="Producto" value={review.ratingProduct} />
          <RatingChip label="Vendedor" value={review.ratingSeller} />
        </div>
        <p className="text-sm leading-6 text-slate-300">{review.comment}</p>
      </div>

      <div className="space-y-3">
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

function ReviewStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    HIDDEN: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    PUBLISHED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? "border-white/10 text-slate-300"}`}
    >
      Reseña: {status}
    </span>
  );
}

function RatingChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}/5</p>
    </div>
  );
}
