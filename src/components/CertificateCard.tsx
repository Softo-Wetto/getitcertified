import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Certificate } from "../lib/queries";

type Props = {
  certificate: Certificate;
};

export default function CertificateCard({ certificate }: Props) {
  return (
    <Link
      href={`/certificates/${certificate.slug}`}
      className="group cyber-card relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-1 hover:border-cyan-300/35"
    >
      <div className="absolute right-0 top-0 h-24 w-24 border-l border-b border-cyan-300/10 bg-cyan-300/5" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {certificate.vendor}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {certificate.popularity} views
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-50 transition group-hover:text-cyan-200">
          {certificate.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
          {certificate.description || "No description available."}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
            Open vault
          </span>
          <ArrowUpRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}
