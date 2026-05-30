"use client";

import { useState, useEffect } from "react";

export default function LivePriceTicker({ coin = "BTC" }: { coin?: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function fetchPrice() {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin.toUpperCase()}USDT`);
        if (!res.ok) throw new Error("Failed to fetch price");
        const data = await res.json();
        if (mounted) {
          setPrice(parseFloat(data.price));
          setError(false);
        }
      } catch (err) {
        if (mounted) setError(true);
      }
    }

    // Initial fetch
    fetchPrice();

    // Light polling every 3 seconds
    const interval = setInterval(fetchPrice, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [coin]);

  if (error) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-text-secondary text-xs uppercase tracking-wider">{coin}/USD</span>
        <span className="font-mono text-sm text-neon-red">Error</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-text-secondary text-xs uppercase tracking-wider">{coin}/USD</span>
      <span className="font-mono text-xl font-bold text-white tabular-nums">
        {price !== null
          ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "..."}
      </span>
      {/* Pulse indicator to show it's live */}
      <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse ml-1" />
    </div>
  );
}
