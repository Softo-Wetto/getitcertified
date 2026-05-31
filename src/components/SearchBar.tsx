"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ actionPath = "/" }: { actionPath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") || "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set("search", value);
    else params.delete("search");

    const query = params.toString();
    router.push(query ? `${actionPath}?${query}` : actionPath);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search certs, vendors, or security domains..."
          className="w-full rounded-2xl border border-cyan-300/15 bg-slate-950/70 px-11 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 transition focus:border-cyan-300/60 focus:bg-slate-950"
        />
      </label>
    </form>
  );
}
