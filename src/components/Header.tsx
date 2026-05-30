"use client";

import { Cpu, LogOut, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentAuth, signOut } from "@/lib/pocketbase/client";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = Boolean(email && adminEmail && email === adminEmail);

  useEffect(() => {
    const refreshAuth = () => setEmail(getCurrentAuth()?.user.email ?? null);
    refreshAuth();
    window.addEventListener("getitcertified-auth", refreshAuth);

    return () => window.removeEventListener("getitcertified-auth", refreshAuth);
  }, []);

  function handleLogout() {
    signOut();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-400/10 bg-slate-950/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-tight text-slate-50">
              GetITCertified
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/70 sm:block">
              Cyber training vault
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/bookmarks"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
          >
            Bookmarks
          </Link>

          {!email && (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/18"
              >
                Sign up
              </Link>
            </>
          )}

          {email && isAdmin && (
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/18"
            >
              <UploadCloud className="h-4 w-4" />
              Upload
            </Link>
          )}

          {email && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/5 hover:text-cyan-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}

          <Cpu className="hidden h-5 w-5 text-cyan-300/35 md:block" />
        </nav>
      </div>
    </header>
  );
}
