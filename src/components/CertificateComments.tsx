"use client";

import { MessageSquare, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import {
  createRecord,
  deleteRecord,
  getClientRecords,
  getCurrentAuth,
} from "@/lib/pocketbase/client";
import { escapeFilterValue } from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

type CommentItem = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: string;
};

export default function CertificateComments({
  certificateId,
}: {
  certificateId: string;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [auth, setAuth] = useState<ReturnType<typeof getCurrentAuth>>(null);
  const isAdmin = isAdminEmail(auth?.user.email);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      perPage: "100",
      sort: "created_at",
      filter: `certificate_id = "${escapeFilterValue(certificateId)}"`,
      expand: "user_id",
    });

    try {
      const result = await getClientRecords<RawPocketBaseRecord>("certificate_comments", params);
      setComments(result.items.map(normalizeComment));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load comments.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAuth(getCurrentAuth()), 0);
    loadComments();
    return () => window.clearTimeout(timer);
  }, [loadComments]);

  async function handlePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const currentAuth = getCurrentAuth();
    const text = body.trim();
    if (!currentAuth || !text) return;

    setPosting(true);
    setError("");

    try {
      await createRecord("certificate_comments", {
        certificate_id: certificateId,
        user_id: currentAuth.user.id,
        body: text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setAuth(currentAuth);
      setBody("");
      await loadComments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to post comment.";
      setError(message);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(comment: CommentItem) {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    try {
      await deleteRecord("certificate_comments", comment.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete comment.";
      setError(message);
    }
  }

  return (
    <section className="cyber-panel mt-10 rounded-3xl p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
            Discussion
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-50">Certificate comments</h2>
        </div>
        <MessageSquare className="h-7 w-7 text-cyan-300" />
      </div>

      {auth ? (
        <form onSubmit={handlePost} className="mt-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share a note, correction, or study tip..."
            className="field-input resize-none"
          />
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {posting ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
          <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-100">
            Sign in
          </Link>{" "}
          to comment on this certificate.
        </div>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-center text-sm text-slate-500">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-100">{comment.author}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(comment.created_at)}</p>
                </div>
                {(isAdmin || auth?.user.id === comment.user_id) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment)}
                    className="rounded-xl border border-slate-800 p-2 text-slate-500 transition hover:border-red-300/40 hover:text-red-300"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {comment.body}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function normalizeComment(record: RawPocketBaseRecord): CommentItem {
  const expand = record.expand as { user_id?: Record<string, unknown> } | undefined;
  const user = expand?.user_id;
  const username = typeof user?.username === "string" ? user.username : null;
  const email = typeof user?.email === "string" ? user.email : null;

  return {
    id: record.id,
    user_id: typeof record.user_id === "string" ? record.user_id : "",
    body: typeof record.body === "string" ? record.body : "",
    created_at: typeof record.created_at === "string" ? record.created_at : "",
    author: username || email || "User",
  };
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
