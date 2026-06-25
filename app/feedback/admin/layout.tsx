export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const generalAdminUrl = process.env.GENERAL_ADMIN_URL;

  return (
    <div className="flex flex-col gap-4">
      {generalAdminUrl && (
        <div>
          <a
            href={generalAdminUrl}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            Volver al inicio
          </a>
        </div>
      )}
      {children}
    </div>
  );
}
