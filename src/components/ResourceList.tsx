"use client";

import { Download, ExternalLink, FileText, LockKeyhole, PlayCircle, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { createRecord, getCurrentAuth } from "@/lib/pocketbase/client";
import VideoPreview from "./VideoPreview";

type Resource = {
  id: string;
  title: string;
  file_type: "pdf" | "mp4";
  url: string;
};

export default function ResourceList({ resources }: { resources: Resource[] }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const refreshAuth = () => setSignedIn(Boolean(getCurrentAuth()));
    refreshAuth();
    window.addEventListener("getitcertified-auth", refreshAuth);
    return () => window.removeEventListener("getitcertified-auth", refreshAuth);
  }, []);

  if (!resources.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
        No resources uploaded yet.
      </div>
    );
  }

  const videos = resources.filter((resource) => resource.file_type === "mp4");
  const pdfs = resources.filter((resource) => resource.file_type === "pdf");

  return (
    <div className="space-y-8">
      {videos.length > 0 && (
        <section>
          <ResourceSectionHeader
            icon={<Video className="h-5 w-5" />}
            title="Video lessons"
            count={videos.length}
          />
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {videos.map((resource, index) => (
              <article
                key={resource.id}
                className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
              >
                <div className="aspect-video bg-slate-900">
                  <VideoPreview src={resource.url} />
                </div>
                <div className="border-t border-cyan-300/10 bg-slate-950 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                        Video lesson {index + 1}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-6">
                        {resource.title}
                      </h3>
                    </div>
                    <PlayCircle className="h-6 w-6 flex-none text-blue-300" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <GuardedResourceButton
                      resource={resource}
                      variant="primary"
                      action="download"
                      signedIn={signedIn}
                    />
                    <GuardedResourceButton
                      resource={resource}
                      variant="secondary"
                      action="open"
                      signedIn={signedIn}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {pdfs.length > 0 && (
        <section>
          <ResourceSectionHeader
            icon={<FileText className="h-5 w-5" />}
            title="PDF library"
            count={pdfs.length}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {pdfs.map((resource, index) => (
              <article
                key={resource.id}
                className="group rounded-2xl border border-slate-800 bg-slate-950/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-950"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      PDF resource {index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-bold leading-6 text-slate-50">
                      {resource.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <GuardedResourceButton
                        resource={resource}
                        variant="secondary"
                        action="open"
                        signedIn={signedIn}
                      />
                      <GuardedResourceButton
                        resource={resource}
                        variant="primary"
                        action="download"
                        signedIn={signedIn}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!signedIn && (
        <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-5 text-sm leading-6 text-cyan-50">
          <span className="inline-flex items-center gap-2 font-bold">
            <LockKeyhole className="h-4 w-4" />
            Sign in required for downloads.
          </span>{" "}
          You can review the certificate overview, but file downloads and external resource opens are protected.
        </div>
      )}
    </div>
  );
}

function GuardedResourceButton({
  resource,
  variant,
  action,
  signedIn,
}: {
  resource: Resource;
  variant: "primary" | "secondary";
  action: "download" | "open";
  signedIn: boolean;
}) {
  const isDownload = action === "download";
  const Icon = isDownload ? Download : ExternalLink;
  const label = isDownload ? "Download" : resource.file_type === "pdf" ? "Preview" : "Open";
  const baseClass =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
      : "inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100";

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!signedIn) {
      event.preventDefault();
      const next = `${window.location.pathname}${window.location.search || ""}#downloads`;
      window.location.href = `/login?redirect=${encodeURIComponent(next)}`;
      return;
    }

    if (isDownload) recordDownload(resource.id);
  }

  return (
    <a
      href={resource.url}
      download={isDownload ? true : undefined}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={baseClass}
      title={signedIn ? label : "Sign in to access this file"}
    >
      {signedIn ? <Icon className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
      {signedIn ? label : "Sign in"}
    </a>
  );
}

function ResourceSectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
          {icon}
        </span>
        <h3 className="text-xl font-extrabold text-slate-50">{title}</h3>
      </div>
      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-sm font-semibold text-slate-300">
        {count}
      </span>
    </div>
  );
}

function recordDownload(resourceId: string) {
  const auth = getCurrentAuth();
  const payload: Record<string, unknown> = {
    resource_id: resourceId,
    downloaded_at: new Date().toISOString(),
  };

  if (auth?.user.id) payload.user_id = auth.user.id;

  createRecord("downloads", payload).catch(() => {
    // Downloads should never block access to a study resource.
  });
}
