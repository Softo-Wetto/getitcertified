import { DatabaseZap, FileText, LockKeyhole, PlayCircle } from "lucide-react";
import CertificateCard from "../components/CertificateCard";
import SearchBar from "../components/SearchBar";
import VendorFilter from "../components/VendorFilter";
import { getFeaturedCertificates } from "../lib/queries";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; vendor?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const vendor = params.vendor || "";
  const certificates = await getFeaturedCertificates(search, vendor);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200">
              <LockKeyhole className="h-4 w-4" />
              IT certification intelligence vault
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-50 md:text-6xl">
              Train for cloud, network, and cyber security exams from one secure hub
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
              Browse focused certification paths, stream video lessons, and download PDF resources built for practical IT study.
            </p>
          </div>

          <div className="cyber-panel rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <HeroMetric icon={<DatabaseZap className="h-5 w-5" />} value={certificates.length} label="certs" />
              <HeroMetric icon={<FileText className="h-5 w-5" />} value="PDF" label="library" />
              <HeroMetric icon={<PlayCircle className="h-5 w-5" />} value="MP4" label="lessons" />
            </div>
          </div>
        </div>

        <div className="mt-10 cyber-panel grid gap-4 rounded-2xl p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <SearchBar />
          <VendorFilter />
        </div>

        {certificates.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
            No certifications match this query.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function HeroMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-5">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
        {icon}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-50">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
    </div>
  );
}
