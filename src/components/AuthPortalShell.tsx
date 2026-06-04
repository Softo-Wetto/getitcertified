import Link from "next/link";
import {
  BookMarked,
  Cpu,
  FileText,
  ShieldCheck,
  TerminalSquare,
  Video,
} from "lucide-react";
import GetItCertifiedLogo from "@/components/GetItCertifiedLogo";

type AuthPortalShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
};

const signals = [
  { icon: ShieldCheck, label: "Secure vault", value: "Role-aware access" },
  { icon: FileText, label: "PDF library", value: "Exam notes ready" },
  { icon: Video, label: "Video lessons", value: "Training streams" },
  { icon: BookMarked, label: "Bookmarks", value: "Saved progress" },
];

export default function AuthPortalShell({
  children,
  eyebrow,
  title,
  text,
}: AuthPortalShellProps) {
  return (
    <main className="auth-portal relative overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="auth-pulse auth-pulse-one" />
      <div className="auth-pulse auth-pulse-two" />

      <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="hidden min-h-[620px] rounded-3xl border border-cyan-300/12 bg-slate-950/66 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
            <div className="auth-ring auth-ring-one" />
            <div className="auth-ring auth-ring-two" />

            <GetItCertifiedLogo markClassName="h-14 w-14" />

            <div className="mt-16 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight text-slate-50">
                {title}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
                {text}
              </p>
            </div>

            <div className="auth-terminal mt-12 rounded-3xl border border-cyan-300/12 bg-slate-950/90 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-300/70">
                  <Cpu className="h-3.5 w-3.5" />
                  Training node online
                </span>
              </div>

              {signals.map((signal, index) => {
                const Icon = signal.icon;

                return (
                  <div
                    key={signal.label}
                    className="auth-terminal-row"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/8 text-cyan-200 ring-1 ring-cyan-300/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-100">
                        {signal.label}
                      </span>
                      <span className="block text-xs text-slate-500">{signal.value}</span>
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.75)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="auth-access-card fade-up relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-cyan-300/14 bg-slate-950/90 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="mb-7">
            <GetItCertifiedLogo markClassName="h-14 w-14" textClassName="text-left" />
          </div>

          {children}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <TerminalSquare className="h-3.5 w-3.5 text-cyan-300/60" />
            Self-hosted PocketBase access layer
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            <Link href="/" className="font-semibold text-cyan-300 transition hover:text-cyan-100">
              Return to certificate vault
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
