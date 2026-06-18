import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { APP_ROLES } from "@/lib/clerk-roles";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(244,180,111,0.18),_transparent_32%),linear-gradient(180deg,_#fff8f0_0%,_#fff_48%,_#f8fafc_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
              El Loco Casaca
            </p>
            <p className="text-sm text-slate-600">
              Feedback, reputacion y moderacion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-slate-50">
                  Ingresar
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Crear cuenta
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/feedback"
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Ir a la app
              </Link>
              <UserButton />
            </Show>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="max-w-2xl space-y-8">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
              Etapa 2: autenticacion lista para Feedback App
            </span>

            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Autenticacion con Clerk para proteger reseñas, moderacion y
                reputacion.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Ingresar con Clerk te permite distinguir compradores,
                vendedores y administradores antes de permitir crear o moderar
                feedback dentro del marketplace.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Show when="signed-out">
                <SignInButton>
                  <button className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Iniciar sesion
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
                    Registrarme
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/feedback"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ir a Feedback App →
                </Link>
              </Show>
            </div>
          </div>

          <aside className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-amber-200/40 blur-3xl" />
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="space-y-5">
                <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white">
                  <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                    Control de acceso
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    Login centralizado con Clerk
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Una sola identidad para navegar entre feedback, moderacion y
                    futuras areas privadas.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Sign in
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Acceso rapido para usuarios ya registrados.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Sign up
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Alta de cuenta para comenzar a usar la app.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-4 text-sm leading-6 text-slate-600">
                  La aplicacion ya queda lista para sumar rutas protegidas y
                  validar roles como buyer, seller y admin desde el servidor.
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Roles soportados en Clerk
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {APP_ROLES.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Estos valores viven en <span className="font-medium">publicMetadata.roles</span> y pueden combinarse
                    si un mismo usuario cumple varios perfiles.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
