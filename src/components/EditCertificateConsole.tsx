"use client";

import { ArrowLeft, FileText, Loader2, Save, ShieldCheck, Trash2, UploadCloud, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getPocketBaseFileUrl } from "@/lib/pocketbase/config";
import {
  createRecord,
  deleteRecord,
  getClientRecords,
  getCurrentAuth,
  updateRecord,
} from "@/lib/pocketbase/client";
import { escapeFilterValue } from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

type CertificateForm = {
  id: string;
  title: string;
  slug: string;
  vendor: string;
  description: string;
  image_url: string;
  popularity: number;
  featured: boolean;
};

type ResourceForm = {
  id: string;
  title: string;
  file_type: "pdf" | "mp4";
  storage_path: string;
  description: string;
};

type UploadItem = {
  id: string;
  file: File;
  fileType: "pdf" | "mp4";
  title: string;
  description: string;
};

export default function EditCertificateConsole({ slug }: { slug: string }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [certificate, setCertificate] = useState<CertificateForm | null>(null);
  const [resources, setResources] = useState<ResourceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResources, setUploadingResources] = useState(false);
  const [uploadedResourceCount, setUploadedResourceCount] = useState(0);
  const [newItems, setNewItems] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pdfCount = useMemo(
    () => resources.filter((resource) => resource.file_type === "pdf").length,
    [resources]
  );
  const videoCount = resources.length - pdfCount;

  useEffect(() => {
    const auth = getCurrentAuth();
    const isAdmin = isAdminEmail(auth?.user.email);
    setAllowed(isAdmin);

    if (!isAdmin) {
      router.push("/login");
      return;
    }

    loadCertificate(slug)
      .then(({ certificate, resources }) => {
        setCertificate(certificate);
        setResources(resources);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unable to load certificate.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [router, slug]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!certificate) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateRecord<RawPocketBaseRecord>("certificates", certificate.id, {
        title: certificate.title.trim(),
        slug: certificate.slug.trim(),
        vendor: certificate.vendor.trim(),
        description: certificate.description.trim(),
        image_url: certificate.image_url.trim(),
        popularity: certificate.popularity,
        featured: certificate.featured,
        updated_at: new Date().toISOString(),
      });

      for (const resource of resources) {
        await updateRecord("resources", resource.id, {
          title: resource.title.trim(),
          file_type: resource.file_type,
          storage_path: resource.storage_path.trim(),
          description: resource.description.trim(),
          updated_at: new Date().toISOString(),
        });
      }

      const nextSlug = String(updated.slug || certificate.slug);
      setMessage("Certificate saved.");
      if (nextSlug !== slug) router.replace(`/certificates/${nextSlug}/edit`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save certificate.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResource(resource: ResourceForm) {
    const confirmed = window.confirm(`Delete "${resource.title}" from this certificate?`);
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteRecord("resources", resource.id);
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setMessage("Resource deleted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete resource.";
      setError(message);
    }
  }

  function addFiles(fileList: FileList | null, fileType: "pdf" | "mp4") {
    if (!fileList?.length) return;

    const items = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      fileType,
      title: titleFromFileName(file.name),
      description: "",
    }));

    setNewItems((current) => [...current, ...items]);
  }

  function updateNewItem(id: string, patch: Partial<Pick<UploadItem, "title" | "description">>) {
    setNewItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeNewItem(id: string) {
    setNewItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleUploadResources() {
    if (!certificate || newItems.length === 0) return;

    setUploadingResources(true);
    setUploadedResourceCount(0);
    setError("");
    setMessage("");

    try {
      const createdResources: ResourceForm[] = [];

      for (const item of newItems) {
        const formData = new FormData();
        formData.append("certificate_id", certificate.id);
        formData.append("title", item.title.trim() || titleFromFileName(item.file.name));
        formData.append("description", item.description.trim());
        formData.append("file_type", item.fileType);
        formData.append("resource_file", item.file);
        formData.append("created_at", new Date().toISOString());
        formData.append("updated_at", new Date().toISOString());

        const resource = await createRecord<RawPocketBaseRecord>("resources", formData);
        const fileUrl = getPocketBaseFileUrl(
          "resources",
          resource.id,
          typeof resource.resource_file === "string" ? resource.resource_file : null
        );

        if (fileUrl) {
          await updateRecord("resources", resource.id, { storage_path: fileUrl });
        }

        createdResources.push({
          id: resource.id,
          title: typeof resource.title === "string" ? resource.title : item.title,
          file_type: item.fileType,
          storage_path: fileUrl || "",
          description: item.description.trim(),
        });
        setUploadedResourceCount((count) => count + 1);
      }

      setResources((current) => [...current, ...createdResources]);
      setNewItems([]);
      setMessage(`Added ${createdResources.length} resource${createdResources.length === 1 ? "" : "s"}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload resources.";
      setError(message);
    } finally {
      setUploadingResources(false);
    }
  }

  if (allowed === null || loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-slate-400">Loading edit console...</p>
      </main>
    );
  }

  if (allowed === false) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-slate-400">Redirecting to login...</p>
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="cyber-panel rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-slate-50">Certificate not found</h1>
          <p className="mt-2 text-slate-400">{error || "This certificate could not be loaded."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <section className="admin-studio-hero relative mb-8 min-h-[22rem] overflow-hidden rounded-3xl border border-cyan-300/15">
        <Image
          src="/images/admin-content-studio.png"
          alt="Secure certificate editing workstation"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1152px"
          className="admin-studio-image object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.88)_52%,rgba(2,6,23,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.92),transparent_70%)]" />
        <div className="relative z-10 flex min-h-[22rem] flex-col justify-end p-6 md:p-9">
          <Link
            href={`/certificates/${certificate.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/55 px-3 py-2 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-300/10 hover:text-cyan-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to certificate
          </Link>
          <p className="mt-6 inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Administrator edit console
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl">
            Edit {certificate.title}
          </h1>
          <div className="mt-6 grid w-full max-w-lg grid-cols-3 overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/75 text-center shadow-sm backdrop-blur-md">
            <Metric label="PDFs" value={pdfCount} />
            <Metric label="Videos" value={videoCount} />
            <Metric label="Resources" value={resources.length} />
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="cyber-panel studio-panel-enter rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/70">Certificate record</p>
          <h2 className="mt-2 text-lg font-bold text-slate-50">Certificate details</h2>
          <div className="mt-5 space-y-4">
            <Field label="Title">
              <input
                value={certificate.title}
                onChange={(e) => setCertificate({ ...certificate, title: e.target.value })}
                className="field-input"
              />
            </Field>
            <Field label="Slug">
              <input
                value={certificate.slug}
                onChange={(e) => setCertificate({ ...certificate, slug: e.target.value })}
                className="field-input"
              />
            </Field>
            <Field label="Vendor">
              <input
                value={certificate.vendor}
                onChange={(e) => setCertificate({ ...certificate, vendor: e.target.value })}
                className="field-input"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={certificate.description}
                onChange={(e) => setCertificate({ ...certificate, description: e.target.value })}
                rows={7}
                className="field-input resize-none"
              />
            </Field>
            <Field label="Image URL">
              <input
                value={certificate.image_url}
                onChange={(e) => setCertificate({ ...certificate, image_url: e.target.value })}
                className="field-input"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Popularity">
                <input
                  type="number"
                  value={certificate.popularity}
                  onChange={(e) =>
                    setCertificate({ ...certificate, popularity: Number(e.target.value) || 0 })
                  }
                  className="field-input"
                />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={certificate.featured}
                  onChange={(e) => setCertificate({ ...certificate, featured: e.target.checked })}
                  className="h-4 w-4 accent-cyan-300"
                />
                Featured certification
              </label>
            </div>
          </div>
        </section>

        <section className="cyber-panel studio-panel-enter rounded-3xl p-6 [animation-delay:100ms]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-50">Attached resources</h2>
              <p className="mt-1 text-sm text-slate-400">
                Rename resources, correct file type labels, or remove outdated files.
              </p>
            </div>
            <UploadCloud className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-5 space-y-3">
            {resources.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-500">
                No resources attached.
              </div>
            ) : (
              resources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/75 p-3 md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                    {resource.file_type === "pdf" ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <input
                      value={resource.title}
                      onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300/60"
                    />
                    <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                      <select
                        value={resource.file_type}
                        onChange={(e) =>
                          updateResource(resource.id, {
                            file_type: e.target.value === "mp4" ? "mp4" : "pdf",
                          })
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300/60"
                      >
                        <option value="pdf">PDF</option>
                        <option value="mp4">Video</option>
                      </select>
                      <input
                        value={resource.storage_path}
                        onChange={(e) => updateResource(resource.id, { storage_path: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400 outline-none focus:border-cyan-300/60"
                      />
                    </div>
                    <textarea
                      value={resource.description}
                      onChange={(e) => updateResource(resource.id, { description: e.target.value })}
                      placeholder="Add a lesson summary, learning objective, or study note"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-300 outline-none transition focus:border-cyan-300/60"
                    />
                    <p className="text-xs text-slate-500">Resource {index + 1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteResource(resource)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:border-red-300/40 hover:text-red-300"
                    aria-label="Delete resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-7 border-t border-slate-800 pt-6">
            <h3 className="text-base font-bold text-slate-50">Add missing files</h3>
            <p className="mt-1 text-sm text-slate-400">
              Attach additional PDFs or videos directly to this certificate.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FileDrop
                icon={<FileText className="h-5 w-5" />}
                label="Add PDFs"
                accept=".pdf,application/pdf"
                onChange={(files) => addFiles(files, "pdf")}
              />
              <FileDrop
                icon={<Video className="h-5 w-5" />}
                label="Add videos"
                accept=".mp4,video/mp4"
                onChange={(files) => addFiles(files, "mp4")}
              />
            </div>

            {newItems.length > 0 && (
              <div className="mt-4 space-y-3">
                {newItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/75 p-3 md:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                      {item.fileType === "pdf" ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <Video className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <input
                        value={item.title}
                        onChange={(e) => updateNewItem(item.id, { title: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300/60"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => updateNewItem(item.id, { description: e.target.value })}
                        placeholder="Optional lesson description, objectives, or recommended study order"
                        rows={3}
                        className="mt-2 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-300 outline-none transition focus:border-cyan-300/60"
                      />
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {index + 1}. {item.file.name} - {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:border-red-300/40 hover:text-red-300"
                      aria-label="Remove queued file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {uploadingResources && (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <div className="flex items-center justify-between gap-4 text-sm font-semibold text-cyan-100">
                      <span>Uploading resources</span>
                      <span>
                        {uploadedResourceCount} / {newItems.length}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-300 transition-all"
                        style={{
                          width: `${newItems.length ? (uploadedResourceCount / newItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUploadResources}
                  disabled={uploadingResources}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/18 disabled:opacity-60"
                >
                  {uploadingResources && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadingResources ? "Adding files..." : "Add files to this certificate"}
                </button>
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-300">{error}</p>}
          {message && <p className="mt-4 text-sm font-medium text-emerald-300">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save certificate"}
          </button>
        </section>
      </form>
    </main>
  );

  function updateResource(id: string, patch: Partial<ResourceForm>) {
    setResources((current) =>
      current.map((resource) => (resource.id === id ? { ...resource, ...patch } : resource))
    );
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-slate-800 px-5 py-3 last:border-r-0">
      <p className="text-xl font-extrabold text-slate-50">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function FileDrop({
  icon,
  label,
  accept,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-6 text-center transition hover:border-cyan-300/45 hover:bg-cyan-300/10">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 shadow-sm transition group-hover:scale-105">
        {icon}
      </span>
      <span className="mt-3 text-sm font-bold text-slate-50">{label}</span>
      <span className="mt-1 text-xs text-slate-500">Select multiple files</span>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={(e) => {
          onChange(e.target.files);
          e.target.value = "";
        }}
        className="sr-only"
      />
    </label>
  );
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

async function loadCertificate(slug: string) {
  const certificateParams = new URLSearchParams({
    page: "1",
    perPage: "1",
    filter: `slug = "${escapeFilterValue(slug)}"`,
  });

  const certificateResult = await getClientRecords<RawPocketBaseRecord>(
    "certificates",
    certificateParams
  );
  const rawCertificate = certificateResult.items[0];
  if (!rawCertificate) throw new Error("Certificate not found.");

  const certificate: CertificateForm = {
    id: rawCertificate.id,
    title: stringValue(rawCertificate.title, "Untitled certificate"),
    slug: stringValue(rawCertificate.slug, ""),
    vendor: stringValue(rawCertificate.vendor, ""),
    description: stringValue(rawCertificate.description, ""),
    image_url: stringValue(rawCertificate.image_url, ""),
    popularity: Number(rawCertificate.popularity || 0),
    featured: Boolean(rawCertificate.featured),
  };

  const resourceParams = new URLSearchParams({
    page: "1",
    perPage: "200",
    sort: "created_at",
    filter: `certificate_id = "${escapeFilterValue(rawCertificate.id)}"`,
  });
  const resourceResult = await getClientRecords<RawPocketBaseRecord>("resources", resourceParams);
  const resources: ResourceForm[] = resourceResult.items.map((resource) => ({
    id: resource.id,
    title: stringValue(resource.title, "Untitled resource"),
    file_type: resource.file_type === "mp4" ? "mp4" : "pdf",
    storage_path: stringValue(resource.storage_path, ""),
    description: stringValue(resource.description, ""),
  }));

  return { certificate, resources };
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}
