"use client";

import { Bookmark, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getClientRecords, getCurrentAuth } from "@/lib/pocketbase/client";
import { escapeFilterValue } from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

type BookmarkItem = {
  id: string;
  certificate: {
    title: string;
    slug: string;
    vendor: string;
    description: string;
  } | null;
};

export default function BookmarksClient() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<ReturnType<typeof getCurrentAuth>>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentAuth = getCurrentAuth();
      setAuth(currentAuth);

      if (!currentAuth) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: "1",
        perPage: "100",
        sort: "-created_at",
        expand: "certificate_id",
        filter: `user_id = "${escapeFilterValue(currentAuth.user.id)}"`,
      });

      getClientRecords<RawPocketBaseRecord>("bookmarks", params)
        .then((result) => setItems(result.items.map(normalizeBookmark)))
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!auth) {
    return (
      <div className="cyber-panel rounded-3xl p-8">
        <Bookmark className="h-8 w-8 text-cyan-300" />
        <h1 className="mt-5 text-3xl font-extrabold text-slate-50">Bookmarks</h1>
        <p className="mt-2 text-slate-400">Sign in to save and view certificate bookmarks.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="cyber-panel rounded-3xl p-8">
      <Bookmark className="h-8 w-8 text-cyan-300" />
      <h1 className="mt-5 text-3xl font-extrabold text-slate-50">Bookmarks</h1>
      <p className="mt-2 text-slate-400">Saved certification paths.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading bookmarks...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-500">
            No bookmarked certificates yet.
          </div>
        ) : (
          items.map((item) =>
            item.certificate ? (
              <Link
                key={item.id}
                href={`/certificates/${item.certificate.slug}`}
                className="group rounded-2xl border border-slate-800 bg-slate-950/75 p-5 transition hover:border-cyan-300/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                      {item.certificate.vendor}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-50">
                      {item.certificate.title}
                    </h2>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                  {item.certificate.description || "No description available."}
                </p>
              </Link>
            ) : null
          )
        )}
      </div>
    </div>
  );
}

function normalizeBookmark(record: RawPocketBaseRecord): BookmarkItem {
  const expand = record.expand as { certificate_id?: Record<string, unknown> } | undefined;
  const certificate = expand?.certificate_id;

  return {
    id: record.id,
    certificate: certificate
      ? {
          title: stringValue(certificate.title),
          slug: stringValue(certificate.slug),
          vendor: stringValue(certificate.vendor),
          description: stringValue(certificate.description),
        }
      : null,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
