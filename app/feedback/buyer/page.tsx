import { FEEDBACK_WINDOW_CONTENT } from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRoles } from "@/lib/clerk-roles";
import { prisma } from "@/lib/prisma";
import { BuyerReviewForm } from "./buyer-review-form";

export default async function BuyerFeedbackPage() {
  const user = await currentUser();
  const roles = normalizeRoles(user?.publicMetadata);

  if (!roles.includes("buyer")) {
    redirect("/feedback");
  }

  const buyerId = user?.id;

  const reviews = buyerId
    ? await prisma.review.findMany({
        where: {
          buyerId,
          status: {
            not: "DELETED",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          {FEEDBACK_WINDOW_CONTENT.buyer.title}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Feedback de productos comprados
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Acá el comprador puede crear una reseña solo sobre un producto que compró y recibió; no puede borrar feedback.
        </p>
      </div>

      <BuyerReviewForm />

      <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Mis reseñas
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Feedbacks creados por este buyer
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Solo se muestran las reseñas asociadas a tu cuenta de Clerk.
          </p>
        </div>

        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Producto {review.productId}
                    </p>
                    <p className="text-xs text-slate-400">
                      Order {review.orderId} · {review.status} · {review.createdAt.toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                    {review.isModerated ? "Moderada" : "Publicada"}
                  </div>
                </div>

                <div className="mt-4">
                  <Info label="Rating producto" value={`${review.ratingProduct}/5`} />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {review.comment}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-white/15 bg-slate-900 px-4 py-6 text-sm text-slate-300">
              Todavía no creaste feedbacks.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}