import { ArrowUpRight, BookOpenCheck, Gauge, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import Link from "next/link";
import type { Certificate } from "../lib/queries";

type Props = {
  certificate: Certificate;
};

export default function CertificateCard({ certificate }: Props) {
  const vendorInitial = certificate.vendor.trim().slice(0, 1).toUpperCase() || "C";
  const popularityLevel =
    certificate.popularity >= 100
      ? "High signal"
      : certificate.popularity >= 30
        ? "Active"
        : "New path";
  const domain = getDomain(certificate);

  return (
    <Link
      href={`/certificates/${certificate.slug}`}
      className="group cyber-card relative min-h-[21rem] overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_28px_90px_rgba(8,145,178,0.16)]"
    >
      {certificate.image_url ? (
        <div
          className="absolute inset-x-0 top-0 h-40 bg-cover bg-center opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-40"
          style={{ backgroundImage: `url("${certificate.image_url}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/55 to-slate-950" />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%)] opacity-80 transition group-hover:opacity-100" />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-cyan-300/10 bg-cyan-300/5 transition group-hover:scale-125" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-cyan-300/0 via-cyan-300/35 to-cyan-300/0" />
      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-2xl font-black text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.08)]">
            {vendorInitial}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {certificate.vendor}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-slate-300">
            <TerminalSquare className="h-3.5 w-3.5 text-cyan-300" />
            {domain}
          </span>
          {certificate.featured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-black leading-7 text-slate-50 transition group-hover:text-cyan-200">
          {certificate.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
          {certificate.description || "No description available."}
        </p>

        <div className="mt-auto pt-6">
          <div className="grid grid-cols-2 gap-2">
            <CardMetric icon={<Gauge className="h-3.5 w-3.5" />} label={popularityLevel} value={`${certificate.popularity}`} />
            <CardMetric icon={<BookOpenCheck className="h-3.5 w-3.5" />} label="Vault" value="PDF + video" />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
              Open certificate
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
              <ArrowUpRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

function getDomain(certificate: Certificate) {
  const source = `${certificate.title} ${certificate.vendor}`.toLowerCase();
  if (source.includes("security") || source.includes("cyber") || source.includes("cysa") || source.includes("sec+")) {
    return "Security";
  }
  if (source.includes("cloud") || source.includes("aws") || source.includes("azure")) {
    return "Cloud";
  }
  if (source.includes("network") || source.includes("ccna")) {
    return "Network";
  }
  return "IT Ops";
}
