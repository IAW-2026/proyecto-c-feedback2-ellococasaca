import {
  FEEDBACK_WINDOW_CONTENT,
  getRolePermissionSummary,
} from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRoles, type AppPublicMetadata } from "@/lib/clerk-roles";

export default async function SellerFeedbackPage() {
  const user = await currentUser();
  const roles = normalizeRoles((user?.publicMetadata as AppPublicMetadata | undefined)?.roles);

  if (!roles.includes("seller") && !roles.includes("admin")) {
    redirect("/feedback");
  }

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