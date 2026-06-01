import {
  FEEDBACK_WINDOW_CONTENT,
  getRolePermissionSummary,
} from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRoles, type AppPublicMetadata } from "@/lib/clerk-roles";

export default async function AdminFeedbackPage() {
  const user = await currentUser();
  const roles = normalizeRoles((user?.publicMetadata as AppPublicMetadata | undefined)?.roles);

  if (!roles.includes("admin")) {
    redirect("/feedback");
  }

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
        <Card label="Crear" value={permissions.canCreate ? "Permitido" : "No necesario"} tone="slate" />
        <Card label="Mirar" value={permissions.canView ? "Permitido" : "No permitido"} tone="green" />
        <Card label="Eliminar" value={permissions.canDelete ? "Permitido" : "No permitido"} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Buscador global
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <input
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Buscar por usuario, producto, orderId o texto del comentario"
            />
            <button className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">
              Buscar
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <MockReview
              author="user_123"
              product="Camiseta retro"
              comment="Excelente estado"
            />
            <MockReview
              author="user_456"
              product="Camiseta titular"
              comment="Llegó con demora"
            />
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
          Desde aquí deberías poder eliminar cualquier reseña y marcarla como moderada. Esta es la única ventana con búsqueda transversal.
        </aside>
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

function MockReview({
  author,
  product,
  comment,
}: {
  author: string;
  product: string;
  comment: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{product}</p>
          <p className="text-xs text-slate-400">Autor: {author}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200">
            Ver
          </button>
          <button className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
            Eliminar
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{comment}</p>
    </article>
  );
}