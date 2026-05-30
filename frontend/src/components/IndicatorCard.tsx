"use client";

import type { IndicatorDisplayItem } from "@/lib/types";
import StatusLed from "./StatusLed";

interface IndicatorCardProps {
  item: IndicatorDisplayItem;
}

export default function IndicatorCard({ item }: IndicatorCardProps) {
  return (
    <div
      className="glass-card px-3.5 py-2.5 flex items-center justify-between gap-3 group cursor-default"
      title={item.tooltip}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusLed signal={item.signal} />
        <span className="text-xs text-text-secondary truncate leading-none">
          {item.name}
        </span>
      </div>
      <span className="font-mono text-sm font-medium text-white tabular-nums whitespace-nowrap">
        {item.value}
      </span>
    </div>
  );
}
