"use client";

import { useActionState } from "react";
import {
  createBuyerReview,
  type BuyerReviewActionState,
} from "./actions";

const initialState: BuyerReviewActionState = {};

export function BuyerReviewForm() {
  const [state, action, pending] = useActionState(createBuyerReview, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
          Crear reseña
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Nueva reseña para una compra entregada
        </h3>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {state.message}
        </p>
      ) : null}

      <Field label="Order ID" name="orderId" placeholder="order_123" error={state.fieldErrors?.orderId} />
      <Field label="Product ID" name="productId" placeholder="prod_123" error={state.fieldErrors?.productId} />

      <Field label="Rating producto" name="ratingProduct" placeholder="5" type="number" error={state.fieldErrors?.ratingProduct} />

      <div>
        <label className="text-sm font-medium text-slate-200" htmlFor="comment">
          Comentario
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="Contá tu experiencia con el producto"
        />
        {state.fieldErrors?.comment ? (
          <p className="mt-2 text-sm text-rose-300">{state.fieldErrors.comment}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Crear reseña"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-200" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 5 : undefined}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        placeholder={placeholder}
      />
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}