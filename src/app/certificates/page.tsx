import { Filter, Search } from "lucide-react";
import Link from "next/link";
import CertificateCard from "@/components/CertificateCard";
import SearchBar from "@/components/SearchBar";
import VendorFilter from "@/components/VendorFilter";
import { getFeaturedCertificates } from "@/lib/queries";

export default async function CertificatesPage({
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
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200">
            <Search className="h-4 w-4" />
            Certificate catalog
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl">
            Browse all certification vaults
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">
            Search by certification title, vendor, or domain, then filter down to the exact path you need.
          </p>
        </div>

        <div className="mt-8 cyber-panel grid gap-4 rounded-2xl p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <SearchBar actionPath="/certificates" />
          <VendorFilter actionPath="/certificates" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">
            <Filter className="h-4 w-4 text-cyan-300" />
            {certificates.length} result{certificates.length === 1 ? "" : "s"}
          </div>
          {(search || vendor) && (
            <Link href="/certificates" className="font-semibold text-cyan-300 transition hover:text-cyan-100">
              Clear filters
            </Link>
          )}
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
