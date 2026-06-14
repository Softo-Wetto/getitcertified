"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentAuth } from "@/lib/pocketbase/client";

export default function AdminCertificateActions({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const refresh = () => {
      const auth = getCurrentAuth();
      setIsAdmin(isAdminEmail(auth?.user.email));
    };

    refresh();
    window.addEventListener("getitcertified-auth", refresh);
    return () => window.removeEventListener("getitcertified-auth", refresh);
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href={`/certificates/${slug}/edit`}
      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/18"
    >
      <Pencil className="h-4 w-4" />
      Edit certificate
    </Link>
  );
}
