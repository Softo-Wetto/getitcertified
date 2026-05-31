type LogoProps = {
  markClassName?: string;
  showText?: boolean;
  textClassName?: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function GetItCertifiedLogo({
  markClassName,
  showText = true,
  textClassName,
}: LogoProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={joinClasses(
          "group/logo relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.18)]",
          markClassName
        )}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_26%_16%,rgba(34,211,238,0.58),transparent_28%),linear-gradient(135deg,rgba(14,165,233,0.28),rgba(2,6,23,0.2)_48%,rgba(16,185,129,0.28))]" />
        <span className="cert-logo-sweep absolute inset-0 opacity-80" />
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="relative h-8 w-8 text-cyan-100 transition duration-300 group-hover/logo:scale-105"
          role="img"
          aria-label="GetItCertified"
        >
          <path
            d="M24 6.5 36.5 11v10.3c0 8.7-4.9 15.5-12.5 20.2C16.4 36.8 11.5 30 11.5 21.3V11L24 6.5Z"
            className="fill-slate-950/70 stroke-cyan-200"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m17.5 24 4.2 4.2 9.4-10"
            className="stroke-emerald-200"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 17H5.5M39 17h3.5M13 33 9.8 36.2M35 33l3.2 3.2M24 4V1.5"
            className="stroke-cyan-200/90"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="5.5" cy="17" r="1.5" className="fill-cyan-200" />
          <circle cx="42.5" cy="17" r="1.5" className="fill-cyan-200" />
          <circle cx="9.8" cy="36.2" r="1.5" className="fill-emerald-200" />
          <circle cx="38.2" cy="36.2" r="1.5" className="fill-emerald-200" />
          <circle cx="24" cy="1.5" r="1.5" className="fill-cyan-200" />
        </svg>
      </span>

      {showText && (
        <span className={textClassName}>
          <span className="block text-lg font-extrabold tracking-tight text-slate-50">
            GetITCertified
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/70 sm:block">
            Cyber training vault
          </span>
        </span>
      )}
    </span>
  );
}
