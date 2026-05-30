"use client";

import type { IndicatorsResponse } from "@/lib/types";
import type { IndicatorDisplayItem } from "@/lib/types";
import IndicatorCard from "./IndicatorCard";
import {
  buildTechnicalItems,
  buildDerivativesItems,
  buildSentimentItems,
  buildMacroItems,
  buildOnchainItems,
} from "@/lib/indicators";

interface IndicatorsSidebarProps {
  data: IndicatorsResponse;
  coin?: string;
}

interface SectionProps {
  label: string;
  items: IndicatorDisplayItem[];
}

function Section({ label, items }: SectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="section-label px-1">{label}</span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <IndicatorCard key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function IndicatorsSidebar({ data, coin = "BTC" }: IndicatorsSidebarProps) {
  const technical = buildTechnicalItems(data, coin);
  const derivatives = buildDerivativesItems(data);
  const sentiment = buildSentimentItems(data);
  const macro = buildMacroItems(data);
  const onchain = buildOnchainItems(data, coin);

  return (
    <aside className="flex flex-col gap-5 overflow-y-auto pr-1 fade-in">
      <Section label="📈 Technical Analysis" items={technical} />
      <Section label="📊 Derivatives" items={derivatives} />
      <Section label="🧠 Sentiment" items={sentiment} />
      <Section label="🌍 Macro" items={macro} />
      <Section label="⛓ On-Chain" items={onchain} />
    </aside>
  );
}
