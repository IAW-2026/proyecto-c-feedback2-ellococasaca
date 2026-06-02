import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
        Error 404
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
        La página que buscás no existe o fue removida.
      </p>
      <Link
        href="/feedback"
        className="mt-8 inline-flex rounded-2xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
      >
        Volver al inicio
      </Link>
    </div>
  );
}