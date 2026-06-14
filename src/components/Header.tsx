"use client";

import { Cpu, LogOut, Radar, Shield, UploadCloud, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import GetItCertifiedLogo from "@/components/GetItCertifiedLogo";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentAuth, signOut } from "@/lib/pocketbase/client";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const isAdmin = isAdminEmail(email);

  useEffect(() => {
    const refreshAuth = () => {
      const auth = getCurrentAuth();
      setEmail(auth?.user.email ?? null);
      setUsername(auth?.user.username ?? null);
    };
    refreshAuth();
    window.addEventListener("getitcertified-auth", refreshAuth);

    return () => window.removeEventListener("getitcertified-auth", refreshAuth);
  }, []);

  function handleLogout() {
    signOut();
  }

  return (
    <header className="sticky top-0 z-30 overflow-hidden border-b border-cyan-400/10 bg-slate-950/82 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute -top-20 left-1/3 h-32 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <GetItCertifiedLogo />
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/certificates"
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
          >
            <Radar className="h-4 w-4 text-cyan-300/60 transition group-hover:rotate-12 group-hover:text-cyan-200" />
            Certificates
          </Link>
          <Link
            href="/bookmarks"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
          >
            Bookmarks
          </Link>

          {!email && (
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)] transition hover:bg-cyan-300/18"
            >
              <span className="absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/20 transition duration-500 group-hover:left-[120%]" />
              <Shield className="relative h-4 w-4" />
              <span className="relative">Sign in / Sign up</span>
            </Link>
          )}

          {email && isAdmin && (
            <Link
              href="/upload"
              className="admin-studio-link inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/18"
            >
              <UploadCloud className="h-4 w-4" />
              Admin studio
            </Link>
          )}

          {email && (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/5 hover:text-cyan-100"
                title={email}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="hidden max-w-28 truncate lg:inline">
                  {username || email}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/5 hover:text-cyan-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}

          <Cpu className="hidden h-5 w-5 animate-pulse text-cyan-300/35 md:block" />
        </nav>
      </div>
    </header>
  );
}
