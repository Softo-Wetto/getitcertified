"use client";

import { useRouter, useSearchParams } from "next/navigation";

const vendors = ["All", "Microsoft", "Cisco", "CompTIA", "ISC2"];

export default function VendorFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("vendor") || "All";

  function setVendor(vendor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (vendor === "All") params.delete("vendor");
    else params.set("vendor", vendor);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {vendors.map((vendor) => {
        const active = vendor === selected;
        return (
          <button
            key={vendor}
            type="button"
            onClick={() => setVendor(vendor)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-cyan-300/60 bg-cyan-300/14 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.10)]"
                : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-300/30 hover:text-cyan-100"
            }`}
          >
            {vendor}
          </button>
        );
      })}
    </div>
  );
}
