"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPortalShell from "@/components/AuthPortalShell";
import { signUpWithPassword } from "@/lib/pocketbase/client";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("redirect")?.startsWith("/") ? searchParams.get("redirect")! : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await signUpWithPassword(email.trim(), password);
      setMessage("Account created.");
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPortalShell
      eyebrow="Provision Access"
      title="Create your certification command profile."
      text="Save certificates, track downloads, join discussions, and keep your study resources organized."
    >
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-200">
          <UserPlus className="h-3.5 w-3.5" />
          Create access
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-50">
          Join the vault
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create an account to manage bookmarks, comments, and resource downloads.
        </p>
      </div>

      <form onSubmit={handleSignup} className="mt-7 space-y-4">
        <label className="group relative block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Email
          </span>
          <Mail className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" />
          <input
            type="email"
            placeholder="analyst@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-field pl-10"
            autoComplete="email"
            required
          />
        </label>

        <label className="group relative block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Password
          </span>
          <LockKeyhole className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-field pl-10 pr-11"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-[2.1rem] grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-cyan-100"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </label>

        <label className="group relative block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Confirm password
          </span>
          <ShieldCheck className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="auth-field pl-10"
            autoComplete="new-password"
            required
          />
        </label>

        {error && (
          <p className="fade-up flex items-start gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-3 text-sm text-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {message && (
          <p className="fade-up flex items-start gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-primary-button"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />
              Creating
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already cleared?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-cyan-300 transition hover:text-cyan-100">
          Sign in
        </Link>
      </p>
    </AuthPortalShell>
  );
}

function AuthFallback() {
  return (
    <AuthPortalShell
      eyebrow="Provision Access"
      title="Create your certification command profile."
      text="Preparing secure access..."
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
        Loading access console...
      </div>
    </AuthPortalShell>
  );
}
