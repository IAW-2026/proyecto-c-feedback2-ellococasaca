import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { normalizeRoles } from "@/lib/clerk-roles";
import {
  FEEDBACK_WINDOW_CONTENT,
  getAccessibleFeedbackWindows,
  getPrimaryFeedbackRole,
} from "@/lib/feedback-permissions";

function getRolesFromUser(userMetadata: unknown) {
  return normalizeRoles(userMetadata);
}

export default async function FeedbackLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const roles = getRolesFromUser(user?.publicMetadata);
  const accessibleWindows = getAccessibleFeedbackWindows(roles);
  const primaryRole = getPrimaryFeedbackRole(roles);

  if (!primaryRole && roles.length === 0) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-6 sm:px-10 lg:px-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
                Feedback App
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {primaryRole ? FEEDBACK_WINDOW_CONTENT[primaryRole].title : "Ventanas de feedback"}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                Plataforma de reseñas, calificaciones y moderación del marketplace.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                href="/"
              >
                Inicio
              </Link>
              <Link
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                href="/feedback"
              >
                Hub de feedback
              </Link>
              {accessibleWindows.map((role) => (
                <Link
                  key={role}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  href={FEEDBACK_WINDOW_CONTENT[role].route}
                >
                  {role}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
              Rol activo
            </p>
            <div className="mt-4 space-y-3">
              {accessibleWindows.length > 0 ? (
                accessibleWindows.map((role) => (
                  <Link
                    key={role}
                    href={FEEDBACK_WINDOW_CONTENT[role].route}
                    className="block rounded-3xl border border-white/10 bg-slate-900 px-4 py-4 transition hover:border-amber-300/40 hover:bg-slate-800"
                  >
                    <p className="text-sm font-semibold text-white">{FEEDBACK_WINDOW_CONTENT[role].title}</p>
                    <p className="mt-1 text-sm text-slate-300">{FEEDBACK_WINDOW_CONTENT[role].subtitle}</p>
                  </Link>
                ))
              ) : (
                <p className="rounded-3xl border border-dashed border-white/15 bg-slate-900 px-4 py-4 text-sm text-slate-300">
                  No tenés roles asignados en Clerk todavía.
                </p>
              )}
            </div>
          </aside>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}