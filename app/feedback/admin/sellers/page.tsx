import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 5;

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);
  if (!roles.includes("admin")) redirect("/feedback");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [sellers, total] = await Promise.all([
    prisma.ratingsCache.findMany({
      where: { targetType: "SELLER" },
      orderBy: { averageRating: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.ratingsCache.count({ where: { targetType: "SELLER" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Administrador
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Sellers
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Vendedores con al menos una reseña, ordenados por rating promedio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-right">
            <p className="text-2xl font-semibold text-white">{total}</p>
            <p className="text-xs text-slate-400">sellers con reseñas</p>
          </div>
          <Link
            href="/feedback/admin"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Panel
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        {sellers.length > 0 ? (
          sellers.map((seller) => (
            <Link
              key={seller.targetId}
              href={`/feedback/admin/sellers/${seller.targetId}`}
              className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-slate-900 px-5 py-4 transition hover:border-amber-300/30 hover:bg-slate-800"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Seller ID
                </p>
                <p className="mt-1 font-mono text-sm text-white">{seller.targetId}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Reseñas</p>
                  <p className="text-sm font-semibold text-white">{seller.totalReviews}</p>
                </div>
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-right">
                  <p className="text-xs text-amber-400">Rating</p>
                  <p className="text-lg font-semibold text-amber-300">
                    {seller.averageRating.toFixed(1)}/5
                  </p>
                </div>
                <span className="text-slate-500">→</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-10 text-center">
            <p className="text-sm text-slate-400">No hay sellers con reseñas todavía.</p>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
