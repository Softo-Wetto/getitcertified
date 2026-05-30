import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cyan-400/10 bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-50">GetItCertified</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              A focused resource vault for IT, cloud, networking, and cyber security certification study.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Resources
            </h4>

            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-cyan-200">
                  Certifications
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-cyan-200">
                  Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-200">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-cyan-200">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Signal
            </h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              PDFs, labs, and video lessons organized by certification target.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-cyan-400/10 pt-6 text-sm text-slate-500">
          (c) {year} GetItCertified. Training vault online.
        </div>
      </div>
    </footer>
  );
}
