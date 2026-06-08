"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquare,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  getClientRecords,
  getCurrentAuth,
  signOut,
  updateCurrentUser,
} from "@/lib/pocketbase/client";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

type AccountStats = {
  bookmarks: number;
  downloads: number;
  comments: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<AccountStats>({
    bookmarks: 0,
    downloads: 0,
    comments: 0,
  });

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    return score <= 1 ? "Weak" : score <= 3 ? "Good" : "Strong";
  }, [newPassword]);

  useEffect(() => {
    async function loadProfile() {
      const auth = getCurrentAuth();
      if (!auth?.user.id) {
        router.push("/login?redirect=/profile");
        return;
      }

      setEmail(auth.user.email || "");
      setUsername(auth.user.username || "");
      setMemberSince(auth.user.created_at || auth.user.created || "");

      const [bookmarks, downloads, comments] = await Promise.all([
        countRecords("bookmarks", auth.user.id),
        countRecords("downloads", auth.user.id),
        countRecords("certificate_comments", auth.user.id),
      ]);

      setStats({ bookmarks, downloads, comments });
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function saveProfile() {
    setError("");
    setMessage("");

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
      setError("Username must be 3-24 characters and use letters, numbers, underscore, or dash.");
      return;
    }

    setSavingProfile(true);
    try {
      const user = await updateCurrentUser({
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      });
      setUsername(user.username || cleanUsername);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await updateCurrentUser({
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
        updated_at: new Date().toISOString(),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSignOut() {
    signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-5 py-4 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="cyber-panel scan-line overflow-hidden rounded-3xl p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                <UserRound className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                  Account console
                </p>
                <h1 className="mt-1 text-3xl font-black text-slate-50 md:text-4xl">
                  {username || "Profile"}
                </h1>
                <p className="mt-1 text-sm text-slate-400">{email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-400/15"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <ProfileStat icon={<Bookmark className="h-5 w-5" />} label="Bookmarks" value={stats.bookmarks} />
            <ProfileStat icon={<Download className="h-5 w-5" />} label="Downloads" value={stats.downloads} />
            <ProfileStat icon={<MessageSquare className="h-5 w-5" />} label="Comments" value={stats.comments} />
          </div>
        </section>

        {(message || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? "border-red-400/25 bg-red-400/10 text-red-100"
                : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
            }`}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              {error ? <ShieldCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {error || message}
            </span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="cyber-panel rounded-3xl p-6">
            <h2 className="text-xl font-black text-slate-50">Profile details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This username is used for login and appears beside your certificate comments.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Username
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="field-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </span>
                <input value={email} disabled className="field-input opacity-70" />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              <span className="font-semibold text-slate-100">Member since:</span>{" "}
              {formatDate(memberSince)}
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </button>
          </section>

          <section className="cyber-panel rounded-3xl p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-50">
              <KeyRound className="h-5 w-5 text-cyan-300" />
              Security
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Change your password. Use a unique password for this study vault.
            </p>

            <div className="mt-6 space-y-4">
              <PasswordField
                label="Current password"
                value={currentPassword}
                showPassword={showPassword}
                onChange={setCurrentPassword}
              />
              <PasswordField
                label="New password"
                value={newPassword}
                showPassword={showPassword}
                onChange={setNewPassword}
              />
              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                showPassword={showPassword}
                onChange={setConfirmPassword}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-100"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Password strength
                </p>
                <p className="mt-1 text-lg font-black text-slate-50">{newPassword ? passwordStrength : "Waiting"}</p>
              </div>

              <button
                type="button"
                onClick={savePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Change password
              </button>
            </div>
          </section>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <ProfileShortcut
            href="/bookmarks"
            title="Saved certificates"
            text="Jump back into bookmarked certification paths."
          />
          <ProfileShortcut
            href="/certificates"
            title="Certificate catalog"
            text="Search and filter the full study library."
          />
          <ProfileShortcut
            href="/"
            title="Overview"
            text="Return to the command dashboard."
          />
        </section>
      </div>
    </main>
  );
}

function ProfileStat({
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
      <div className="flex items-center gap-2 text-cyan-300">{icon}</div>
      <p className="mt-3 text-3xl font-black text-slate-50">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  showPassword,
  onChange,
}: {
  label: string;
  value: string;
  showPassword: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
        autoComplete="new-password"
      />
    </label>
  );
}

function ProfileShortcut({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="cyber-card rounded-3xl p-5 transition hover:-translate-y-1 hover:border-cyan-300/35">
      <p className="text-lg font-black text-slate-50">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </Link>
  );
}

async function countRecords(collection: string, userId: string) {
  try {
    const params = new URLSearchParams({
      page: "1",
      perPage: "1",
      filter: `user_id = "${userId.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    });
    const result = await getClientRecords<RawPocketBaseRecord>(collection, params);
    return result.totalItems || 0;
  } catch {
    return 0;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}
