import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 5;

export default async function AdminSellerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ skip?: string }>;
}) {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);
  if (!roles.includes("admin")) redirect("/feedback");

  const { sellerId } = await params;
  const { skip: skipParam } = await searchParams;
  const skip = Math.max(0, parseInt(skipParam ?? "0", 10));

  const [sellerCache, productCaches, reviews, total] = await Promise.all([
    prisma.ratingsCache.findUnique({
      where: { targetId_targetType: { targetId: sellerId, targetType: "SELLER" } },
    }),
    // Products for this seller that have cache entries
    prisma.review.findMany({
      where: { sellerId, status: { not: "DELETED" } },
      distinct: ["productId"],
      select: { productId: true },
    }).then(async (rows) => {
      const ids = rows.map((r) => r.productId);
      return prisma.ratingsCache.findMany({
        where: { targetId: { in: ids }, targetType: "PRODUCT" },
        orderBy: { averageRating: "desc" },
      });
    }),
    // Paginated reviews ordered by productId then date
    prisma.review.findMany({
      where: { sellerId, status: { not: "DELETED" } },
      orderBy: [{ productId: "asc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        productId: true,
        orderId: true,
        buyerId: true,
        ratingProduct: true,
        comment: true,
        status: true,
        isModerated: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where: { sellerId, status: { not: "DELETED" } } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Seller
          </p>
          <h2 className="mt-2 font-mono text-xl font-semibold tracking-tight text-white break-all">
            {sellerId}
          </h2>
        </div>
        <Link
          href="/feedback/admin/sellers"
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          ← Sellers
        </Link>
      </div>

      {/* Seller rating summary */}
      {sellerCache && (
        <div className="rounded-[1.75rem] border border-amber-400/20 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Rating promedio del seller
          </p>
          <p className="mt-2 text-slate-300 text-sm">
            Calculado como promedio de los ratings promedio de sus productos.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3">
              <p className="text-xs text-amber-400">Promedio</p>
              <p className="mt-1 text-2xl font-semibold text-amber-300">
                {sellerCache.averageRating.toFixed(2)}/5
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3">
              <p className="text-xs text-slate-400">Total reseñas</p>
              <p className="mt-1 text-2xl font-semibold text-white">{sellerCache.totalReviews}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3">
              <p className="text-xs text-slate-400">Productos reseñados</p>
              <p className="mt-1 text-2xl font-semibold text-white">{productCaches.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products rating breakdown */}
      {productCaches.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Rating por producto
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productCaches.map((p) => (
              <div
                key={p.targetId}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              >
                <p className="font-mono text-xs text-slate-400">{p.targetId}</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-lg font-semibold text-white">
                    {p.averageRating.toFixed(2)}/5
                  </p>
                  <p className="text-xs text-slate-500">{p.totalReviews} reseñas</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paginated reviews ordered by product */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Reseñas ({total}) — ordenadas por producto
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-slate-500">
              Página {currentPage} de {totalPages}
            </p>
          )}
        </div>

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">
                    Producto{" "}
                    <span className="font-mono text-amber-300">{review.productId}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Orden {review.orderId} · Buyer {review.buyerId} ·{" "}
                    {review.createdAt.toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={review.status} />
                  {review.isModerated && (
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                      Moderada
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-800 px-3 py-2 inline-block">
                <p className="text-xs text-slate-500">Rating producto</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{review.ratingProduct}/5</p>
              </div>
              <p className="text-sm leading-6 text-slate-300">{review.comment}</p>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950 px-4 py-10 text-center">
            <p className="text-sm text-slate-400">No hay reseñas para este seller.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}
            </p>
            <div className="flex gap-2">
              {skip > 0 && (
                <Link
                  href={`?skip=${skip - PAGE_SIZE}`}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  ← Anterior
                </Link>
              )}
              {skip + PAGE_SIZE < total && (
                <Link
                  href={`?skip=${skip + PAGE_SIZE}`}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    HIDDEN: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    PUBLISHED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    PENDING: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? "border-white/10 text-slate-300"}`}>
      {status}
    </span>
  );
}
