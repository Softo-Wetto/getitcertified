"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createRecord,
  deleteRecord,
  getClientRecords,
  getCurrentAuth,
} from "@/lib/pocketbase/client";
import { escapeFilterValue } from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

export default function BookmarkCertificateButton({
  certificateId,
}: {
  certificateId: string;
}) {
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBookmark = useCallback(async () => {
    const auth = getCurrentAuth();
    setSignedIn(Boolean(auth));

    if (!auth) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: "1",
      perPage: "1",
      filter: `user_id = "${escapeFilterValue(auth.user.id)}" && certificate_id = "${escapeFilterValue(certificateId)}"`,
    });

    try {
      const result = await getClientRecords<RawPocketBaseRecord>("bookmarks", params);
      setBookmarkId(result.items[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    loadBookmark();
  }, [loadBookmark]);

  async function toggleBookmark() {
    const auth = getCurrentAuth();
    if (!auth || loading) return;

    setLoading(true);
    try {
      if (bookmarkId) {
        await deleteRecord("bookmarks", bookmarkId);
        setBookmarkId(null);
      } else {
        const record = await createRecord<RawPocketBaseRecord>("bookmarks", {
          user_id: auth.user.id,
          certificate_id: certificateId,
          created_at: new Date().toISOString(),
        });
        setBookmarkId(record.id);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
      >
        <Bookmark className="h-4 w-4" />
        Sign in to bookmark
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 disabled:opacity-60"
    >
      {bookmarkId ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {bookmarkId ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
