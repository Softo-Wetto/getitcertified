import {
  ArrowRight,
  DatabaseZap,
  FileText,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Target,
  TerminalSquare,
  TrendingUp,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CertificateCard from "../components/CertificateCard";
import { getFeaturedCertificates } from "../lib/queries";

export default async function HomePage() {
  const certificates = await getFeaturedCertificates();
  const topCertificates = certificates.slice(0, 4);
  const featured = certificates.filter((certificate) => certificate.featured).length;
  const vendors = Array.from(new Set(certificates.map((certificate) => certificate.vendor))).sort();
  const totalPopularity = certificates.reduce(
    (total, certificate) => total + certificate.popularity,
    0
  );

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <section className="cert-home-hero relative min-h-[34rem] overflow-hidden rounded-3xl border border-cyan-300/15 shadow-[0_32px_100px_rgba(0,0,0,0.38)]">
          <Image
            src="/images/cyber-certification-hero.png"
            alt="Cybersecurity certification operations workspace"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="cert-hero-image object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.99)_0%,rgba(2,6,23,0.90)_43%,rgba(2,6,23,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.96),transparent_68%)]" />
          <div className="relative z-10 flex min-h-[34rem] flex-col justify-end p-6 md:p-10 lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/55 px-3 py-1.5 text-sm font-semibold text-cyan-100 backdrop-blur-md">
              <LockKeyhole className="h-4 w-4" />
              Certification operations overview
            </span>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-50 md:text-6xl lg:text-7xl">
              Your IT, cloud, and cyber security training command center
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Track available certification paths, jump into the highest-priority study vaults, and keep PDFs and video lessons organized by exam target.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Browse all certificates
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bookmarks"
                className="rounded-2xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
              >
                Open bookmarks
              </Link>
            </div>
            <div className="mt-8 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
              <OverviewMetric icon={<DatabaseZap className="h-5 w-5" />} value={certificates.length} label="certificates" />
              <OverviewMetric icon={<ShieldCheck className="h-5 w-5" />} value={featured} label="featured" />
              <OverviewMetric icon={<Radar className="h-5 w-5" />} value={vendors.length} label="vendors" />
              <OverviewMetric icon={<TrendingUp className="h-5 w-5" />} value={totalPopularity} label="views" />
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="cyber-panel rounded-3xl p-6 fade-up">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                  Coverage map
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-50">
                  Vendor focus
                </h2>
              </div>
              <Target className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="mt-5 space-y-3">
              {vendors.map((vendor) => {
                const count = certificates.filter((certificate) => certificate.vendor === vendor).length;
                const width = `${Math.max(14, (count / Math.max(1, certificates.length)) * 100)}%`;

                return (
                  <div key={vendor} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-100">{vendor}</span>
                      <span className="text-slate-500">{count} certs</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="cyber-panel rounded-3xl p-6 fade-up">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                  Priority paths
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-50">
                  High-signal certificates
                </h2>
              </div>
              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition hover:text-cyan-100"
              >
                View catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {topCertificates.map((certificate) => (
                <CertificateCard key={certificate.id} certificate={certificate} />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <SignalCard icon={<TerminalSquare className="h-5 w-5" />} title="Exam vaults" text="Each certificate keeps its PDFs, videos, comments, and bookmarks in one place." />
          <SignalCard icon={<FileText className="h-5 w-5" />} title="PDF library" text="Organize notes, guides, cheat sheets, and practice material per exam." />
          <SignalCard icon={<Video className="h-5 w-5" />} title="Video lessons" text="Stream or download practical walkthroughs and revision sessions." />
        </section>
      </section>
    </main>
  );
}

function OverviewMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/72 px-4 py-4 text-center shadow-[0_14px_34px_rgba(0,0,0,0.2)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-300/35">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
        {icon}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-slate-50">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function SignalCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="cyber-card rounded-3xl p-5 fade-up">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
