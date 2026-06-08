"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Radar,
  UserRound,
} from "lucide-react";
import AuthPortalShell from "@/components/AuthPortalShell";
import { signInWithPassword } from "@/lib/pocketbase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("redirect")?.startsWith("/") ? searchParams.get("redirect")! : "/";
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithPassword(identity.trim(), password);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPortalShell
      eyebrow="Authorized Access"
      title="Enter your cyber training vault."
      text="Resume bookmarks, manage resources, and keep your certification study path ready from any device."
    >
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-200">
          <Radar className="h-3.5 w-3.5" />
          Secure login
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-50">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sign in with your email or username.
        </p>
      </div>

      <form onSubmit={handleLogin} className="mt-7 space-y-4">
        <label className="group relative block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Email or username
          </span>
          <UserRound className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" />
          <input
            type="text"
            placeholder="analyst@example.com"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            className="auth-field pl-10"
            autoComplete="username"
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
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-field pl-10 pr-11"
            autoComplete="current-password"
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

        {error && (
          <p className="fade-up flex items-start gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-3 text-sm text-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
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
              Verifying
            </>
          ) : (
            <>
              Unlock vault
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Need access?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-cyan-300 transition hover:text-cyan-100">
          Create an account
        </Link>
      </p>
    </AuthPortalShell>
  );
}

function AuthFallback() {
  return (
    <AuthPortalShell
      eyebrow="Authorized Access"
      title="Enter your cyber training vault."
      text="Preparing secure access..."
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
        Loading access console...
      </div>
    </AuthPortalShell>
  );
}
