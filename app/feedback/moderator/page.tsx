import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { FEEDBACK_WINDOW_CONTENT, getRolePermissionSummary } from "@/lib/feedback-permissions";
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

  const permissions = getRolePermissionSummary(
    roles.includes("moderator") ? "moderator" : "admin",
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          {FEEDBACK_WINDOW_CONTENT.moderator.title}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Moderación y resolución de reportes
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          El moderador puede revisar reportes, ocultar reseñas y marcar acciones de moderación. No
          elimina permanentemente reseñas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Crear" value="No necesario" tone="slate" />
        <Card label="Mirar" value={permissions.canView ? "Permitido" : "No permitido"} tone="green" />
        <Card label="Eliminar" value={permissions.canDelete ? "Permitido" : "No permitido"} tone="slate" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Reportes abiertos
          </p>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {reports.length} {reports.length === 1 ? "reporte" : "reportes"}
          </span>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-8 text-center text-sm text-slate-400">
            No hay reportes abiertos en este momento.
          </p>
        )}
      </section>
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
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">
            Reporte
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{report.reason}</p>
          <p className="mt-1 text-xs text-slate-400">
            Reportado por: {report.reporterId} ·{" "}
            {report.createdAt.toLocaleDateString("es-AR")}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            review.status === "HIDDEN"
              ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          Reseña: {review.status}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Reseña reportada
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Producto {review.productId} · Buyer {review.buyerId} · Order {review.orderId}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Rating producto: {review.ratingProduct}/5 · Rating vendedor: {review.ratingSeller}/5
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <p className="w-full text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Acción sobre la reseña
        </p>
        <form action={hideReview}>
          <button
            type="submit"
            className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
          >
            Ocultar reseña
          </button>
        </form>
        <form action={publishReview}>
          <button
            type="submit"
            className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Publicar reseña
          </button>
        </form>

        <p className="w-full text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 pt-1">
          Acción sobre el reporte
        </p>
        <form action={resolveReport}>
          <button
            type="submit"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            Marcar resuelto
          </button>
        </form>
        <form action={dismissReport}>
          <button
            type="submit"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5"
          >
            Desestimar
          </button>
        </form>
      </div>
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