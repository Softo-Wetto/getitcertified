"use client";

import { FileText, Loader2, ShieldCheck, UploadCloud, Video, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getPocketBaseFileUrl } from "@/lib/pocketbase/config";
import {
  createRecord,
  getClientRecords,
  getCurrentAuth,
  updateRecord,
} from "@/lib/pocketbase/client";
import { escapeFilterValue } from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

type UploadItem = {
  id: string;
  file: File;
  fileType: "pdf" | "mp4";
  title: string;
  description: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = getCurrentAuth();
    const isAdmin = isAdminEmail(auth?.user.email);
    setAllowed(isAdmin);

    if (!isAdmin) router.push("/login");
  }, [router]);

  const generatedSlug = useMemo(() => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [title]);

  const pdfCount = items.filter((item) => item.fileType === "pdf").length;
  const videoCount = items.filter((item) => item.fileType === "mp4").length;

  useEffect(() => {
    if (!slug && title) {
      setSlug(generatedSlug);
    }
  }, [generatedSlug, slug, title]);

  function addFiles(fileList: FileList | null, fileType: "pdf" | "mp4") {
    if (!fileList?.length) return;

    const nextItems = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      fileType,
      title: titleFromFileName(file.name),
      description: "",
    }));

    setItems((current) => [...current, ...nextItems]);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function updateItemTitle(id: string, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, title: value } : item))
    );
  }

  function updateItemDescription(id: string, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, description: value } : item))
    );
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!items.length) {
      setError("Please choose at least one PDF or video.");
      return;
    }

    if (!title.trim() || !slug.trim() || !vendor.trim()) {
      setError("Title, slug, and vendor are required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setUploadedCount(0);

    try {
      const cert = await upsertCertificate({
        slug: slug.trim(),
        title: title.trim(),
        vendor: vendor.trim(),
        description: description.trim(),
      });

      for (const item of items) {
        const formData = new FormData();
        formData.append("certificate_id", cert.id);
        formData.append("title", item.title.trim() || titleFromFileName(item.file.name));
        formData.append("description", item.description.trim());
        formData.append("file_type", item.fileType);
        formData.append("resource_file", item.file);
        formData.append("created_at", new Date().toISOString());

        const resource = await createRecord<RawPocketBaseRecord>("resources", formData);
        const fileUrl = getPocketBaseFileUrl(
          "resources",
          resource.id,
          typeof resource.resource_file === "string" ? resource.resource_file : null
        );

        if (fileUrl) {
          await updateRecord("resources", resource.id, { storage_path: fileUrl });
        }

        setUploadedCount((count) => count + 1);
      }

      setMessage(`Uploaded ${items.length} resource${items.length === 1 ? "" : "s"}.`);
      setItems([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Upload failed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (allowed === null) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-slate-400">Checking access...</p>
      </main>
    );
  }

  if (allowed === false) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-slate-400">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <section className="admin-studio-hero relative mb-8 min-h-[23rem] overflow-hidden rounded-3xl border border-cyan-300/15">
        <Image
          src="/images/admin-content-studio.png"
          alt="Secure certificate resource upload workstation"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1152px"
          className="admin-studio-image object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.90)_46%,rgba(2,6,23,0.30)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.92),transparent_70%)]" />
        <div className="relative z-10 flex min-h-[23rem] flex-col justify-end p-6 md:p-9">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100 backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Administrator access verified
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl">
            Build a polished certification library
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            Create the certificate once, attach multiple PDFs and training videos, then give every resource its own clear lesson description.
          </p>
          <div className="mt-6 grid w-full max-w-lg grid-cols-3 overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/75 text-center shadow-sm backdrop-blur-md">
            <Metric label="PDFs" value={pdfCount} />
            <Metric label="Videos" value={videoCount} />
            <Metric label="Queued" value={items.length} />
          </div>
        </div>
      </section>

      <form onSubmit={handleUpload} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="cyber-panel studio-panel-enter rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/70">Step 01</p>
          <h2 className="mt-2 text-lg font-bold text-slate-50">Certificate details</h2>

          <div className="mt-5 space-y-4">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AZ-104"
                className="field-input"
              />
            </Field>

            <Field label="Slug">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="az-104"
                className="field-input"
              />
            </Field>

            <Field label="Vendor">
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Microsoft"
                className="field-input"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this certification covers"
                rows={6}
                className="field-input resize-none"
              />
            </Field>
          </div>
        </section>

        <section className="cyber-panel studio-panel-enter rounded-3xl p-6 [animation-delay:100ms]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/70">Step 02</p>
              <h2 className="mt-2 text-lg font-bold text-slate-50">Resource batch</h2>
              <p className="mt-1 text-sm text-slate-400">
                File names become editable lesson titles automatically.
              </p>
            </div>
            <UploadCloud className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FileDrop
              icon={<FileText className="h-5 w-5" />}
              label="PDF resources"
              accept=".pdf,application/pdf"
              onChange={(files) => addFiles(files, "pdf")}
            />
            <FileDrop
              icon={<Video className="h-5 w-5" />}
              label="Video lessons"
              accept=".mp4,video/mp4"
              onChange={(files) => addFiles(files, "mp4")}
            />
          </div>

          <div className="mt-6 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-500">
                No files selected.
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/75 p-3 md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300 shadow-sm">
                    {item.fileType === "pdf" ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <input
                      value={item.title}
                      onChange={(e) => updateItemTitle(item.id, e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300/60"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItemDescription(item.id, e.target.value)}
                      placeholder="Optional lesson description, objectives, or recommended study order"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-300 outline-none transition focus:border-cyan-300/60"
                    />
                    <p className="truncate text-xs text-slate-500">
                      {index + 1}. {item.file.name} - {formatFileSize(item.file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:border-red-300/40 hover:text-red-300"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-300">{error}</p>}
          {message && <p className="mt-4 text-sm font-medium text-emerald-300">{message}</p>}

          {loading && (
            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold text-cyan-100">
                <span>Uploading</span>
                <span>
                  {uploadedCount} / {items.length}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all"
                  style={{
                    width: `${items.length ? (uploadedCount / items.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Uploading batch..." : "Upload resources"}
          </button>
        </section>
      </form>
    </main>
  );
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
    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-7 text-center transition hover:border-cyan-300/45 hover:bg-cyan-300/10">
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

async function upsertCertificate(data: {
  slug: string;
  title: string;
  vendor: string;
  description: string;
}) {
  const params = new URLSearchParams({
    page: "1",
    perPage: "1",
    filter: `slug = "${escapeFilterValue(data.slug)}"`,
  });
  const existing = await getClientRecords<RawPocketBaseRecord>("certificates", params);
  const current = existing.items[0];
  const payload = {
    ...data,
    description: data.description || null,
    updated_at: new Date().toISOString(),
  };

  if (current) {
    return updateRecord<RawPocketBaseRecord>("certificates", current.id, payload);
  }

  return createRecord<RawPocketBaseRecord>("certificates", {
    ...payload,
    popularity: 0,
    featured: false,
    created_at: new Date().toISOString(),
  });
}
