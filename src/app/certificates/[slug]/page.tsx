import { BookOpen, FileText, Gauge, Layers, Route, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminCertificateActions from "../../../components/AdminCertificateActions";
import BookmarkCertificateButton from "../../../components/BookmarkCertificateButton";
import CertificateComments from "../../../components/CertificateComments";
import ResourceList from "../../../components/ResourceList";
import {
  getCertificateBySlug,
  getResourceFileUrl,
  getResourcesForCertificate,
  incrementPopularity,
} from "../../../lib/queries";

function getLevel(title: string) {
  const upper = title.toUpperCase();

  if (upper.includes("FUNDAMENTALS") || upper.includes("900")) return "Beginner";
  if (upper.includes("ASSOCIATE") || upper.includes("104") || upper.includes("300")) return "Intermediate";
  if (upper.includes("EXPERT") || upper.includes("CISSP") || upper.includes("CCNP")) return "Advanced";

  return "Intermediate";
}

function getCategory(vendor: string) {
  const v = vendor.toLowerCase();

  if (v.includes("microsoft")) return "Cloud / Identity";
  if (v.includes("cisco")) return "Networking";
  if (v.includes("comptia")) return "Security / IT";
  if (v.includes("isc2") || v.includes("isc")) return "Cybersecurity";

  return "Professional Certification";
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let certificate;
  try {
    certificate = await getCertificateBySlug(slug);
  } catch {
    notFound();
  }

  const resources = await getResourcesForCertificate(certificate.id);
  incrementPopularity(certificate.id);

  const hydratedResources = resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    file_type: resource.file_type,
    url: getResourceFileUrl(resource),
  }));

  const pdfs = hydratedResources.filter((resource) => resource.file_type === "pdf");
  const videos = hydratedResources.filter((resource) => resource.file_type === "mp4");
  const level = getLevel(certificate.title);
  const category = getCategory(certificate.vendor);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr] lg:items-start">
          <div className="cyber-panel overflow-hidden rounded-3xl">
            <div className="relative overflow-hidden border-b border-cyan-300/10 bg-slate-950 px-8 py-10 text-white">
              {certificate.image_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: `url("${certificate.image_url}")` }}
                />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.30),transparent_34%),linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0))]" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />
              <div className="relative">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge>{certificate.vendor}</Badge>
                  <Badge>{category}</Badge>
                  <Badge>{level}</Badge>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl">
                  {certificate.title}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                  {certificate.description ||
                    "Access study resources, downloadable PDFs, and video lessons for this certification."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#downloads"
                    className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Open learning library
                  </a>
                  <Link
                    href="/"
                    className="rounded-2xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
                  >
                    Back to vault
                  </Link>
                  <BookmarkCertificateButton certificateId={certificate.id} />
                  <AdminCertificateActions slug={certificate.slug} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<Gauge className="h-5 w-5" />} label="Popularity" value={certificate.popularity} />
              <StatCard icon={<FileText className="h-5 w-5" />} label="PDF files" value={pdfs.length} />
              <StatCard icon={<Video className="h-5 w-5" />} label="Video files" value={videos.length} />
              <StatCard icon={<Layers className="h-5 w-5" />} label="Total resources" value={hydratedResources.length} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="cyber-panel rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                  <Route className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-50">Quick overview</h2>
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-400">
                <OverviewRow label="Vendor" value={certificate.vendor} />
                <OverviewRow label="Category" value={category} />
                <OverviewRow label="Difficulty" value={level} />
                <OverviewRow label="Resources" value={String(hydratedResources.length)} last />
              </div>
            </div>

            <div className="cyber-panel rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                  <BookOpen className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-50">Study path</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                <li>Start with the PDF library to build a structured understanding of the exam topics.</li>
                <li>Watch video lessons for revision and to reinforce difficult concepts.</li>
                <li>Bookmark the certification so you can come back to it quickly later.</li>
              </ul>
            </div>
          </aside>
        </div>

        <section id="downloads" className="cyber-panel mt-10 rounded-3xl p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                Learning library
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-50">
                Available resources
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Preview PDFs, stream videos directly on the page, or download files for offline study.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 font-semibold text-slate-300">
                {pdfs.length} PDFs
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 font-semibold text-slate-300">
                {videos.length} Videos
              </span>
            </div>
          </div>

          <ResourceList resources={hydratedResources} />
        </section>

        <CertificateComments certificateId={certificate.id} />
      </section>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100 backdrop-blur">
      {children}
    </span>
  );
}

function OverviewRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${last ? "" : "border-b border-slate-800 pb-3"}`}>
      <span>{label}</span>
      <span className="text-right font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-50">{value}</p>
        </div>
      </div>
    </div>
  );
}
