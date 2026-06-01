import Link from "next/link";
import {
  FEEDBACK_WINDOW_CONTENT,
  FEEDBACK_WINDOW_ROLES,
  getAccessibleFeedbackWindows,
} from "@/lib/feedback-permissions";
import { currentUser } from "@clerk/nextjs/server";
import { normalizeRoles, type AppPublicMetadata } from "@/lib/clerk-roles";

export default async function FeedbackHubPage() {
  const user = await currentUser();
  const roles = normalizeRoles((user?.publicMetadata as AppPublicMetadata | undefined)?.roles);
  const accessibleWindows = getAccessibleFeedbackWindows(roles);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          Hub de feedback
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Elegí tu ventana según tu rol
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Buyer y seller solo ven feedbacks asociados a sus productos; admin puede buscar cualquier reseña y eliminarla.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(accessibleWindows.length > 0 ? accessibleWindows : FEEDBACK_WINDOW_ROLES).map((role) => {
          const content = FEEDBACK_WINDOW_CONTENT[role];

          return (
            <Link
              key={role}
              href={content.route}
              className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-slate-800"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                {role}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{content.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{content.subtitle}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}