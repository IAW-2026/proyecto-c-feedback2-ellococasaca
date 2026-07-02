import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
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

  const generalAdminUrl = process.env.GENERAL_ADMIN_URL ?? "/";

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

            <nav className="flex flex-wrap items-center gap-2">
              <a
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                href={generalAdminUrl}
              >
                Inicio
              </a>
              {accessibleWindows.map((role) => (
                <Link
                  key={role}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  href={FEEDBACK_WINDOW_CONTENT[role].route}
                >
                  {role}
                </Link>
              ))}
              <UserButton />
            </nav>
          </div>
        </header>

        <section className="flex-1">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}