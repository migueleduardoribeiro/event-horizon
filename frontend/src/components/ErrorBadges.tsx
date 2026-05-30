"use client";

interface ErrorBadgesProps {
  errors: string[];
}

export default function ErrorBadges({ errors }: ErrorBadgesProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="section-label text-neon-red">⚠ Service Errors</span>
      <div className="flex flex-wrap gap-1.5">
        {errors.map((err, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.6rem] font-mono
                       rounded-full bg-red-500/10 text-neon-red border border-red-500/20
                       leading-none"
            title={err}
          >
            <span className="w-1 h-1 rounded-full bg-neon-red flex-shrink-0" />
            {err.length > 50 ? err.slice(0, 50) + "…" : err}
          </span>
        ))}
      </div>
    </div>
  );
}
