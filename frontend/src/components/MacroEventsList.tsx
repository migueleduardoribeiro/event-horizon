import type { MarketEvent } from "@/lib/types";

export default function MacroEventsList({ events }: { events: MarketEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      <h3 className="section-label mb-1">Macro & Geopolitical Scenario</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((ev, i) => {
          let colorClass = "border-white/10 bg-white/5 text-text-secondary";
          let badgeClass = "bg-white/10 text-white/70";
          let icon = "ℹ️";

          if (ev.importancia === "Alta") {
            colorClass = "border-neon-red/30 bg-neon-red/5 text-neon-red glow-red";
            badgeClass = "bg-neon-red/20 text-neon-red";
            icon = "🔥";
          } else if (ev.importancia === "Média") {
            colorClass = "border-neon-amber/30 bg-neon-amber/5 text-neon-amber";
            badgeClass = "bg-neon-amber/20 text-neon-amber";
            icon = "⚡";
          }

          return (
            <div key={i} className={`p-4 rounded-xl border ${colorClass} flex flex-col gap-2 transition-colors`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm leading-tight text-white">{ev.evento}</span>
                <span className={`text-[0.6rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${badgeClass} shrink-0`}>
                  {ev.importancia === "Alta" ? "HIGH" : ev.importancia === "Média" ? "MEDIUM" : ev.importancia === "Baixa" ? "LOW" : ev.importancia}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed mt-1">
                <span className="opacity-70 mr-1">{icon}</span>
                {ev.impacto_descricao}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
