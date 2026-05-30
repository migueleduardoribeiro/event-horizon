"use client";

import LivePriceTicker from "./LivePriceTicker";

interface HeaderProps {
  lastUpdated: Date | null;
  coin: string;
  onCoinChange: (coin: string) => void;
}

const SUPPORTED_COINS = ["BTC", "ETH", "SOL", "XRP", "BNB"];

export default function Header({ lastUpdated, coin, onCoinChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      {/* Left — Logo / Brand */}
      <div className="flex items-center gap-3">
        {/* Animated dot */}
        <div className="relative">
          <span className="block w-2.5 h-2.5 rounded-full bg-neon-green" />
          <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-neon-green animate-ping opacity-40" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          EVENT<span className="text-neon-green">HORIZON</span>
        </h1>
        <span className="hidden sm:inline text-[0.6rem] uppercase tracking-widest text-text-muted ml-2">
          {coin} Confluence Terminal
        </span>

        {/* Coin Selector */}
        <div className="ml-4 flex items-center bg-white/5 rounded-lg p-0.5">
          {SUPPORTED_COINS.map(c => (
            <button
              key={c}
              onClick={() => onCoinChange(c)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                coin === c 
                  ? "bg-neon-green/20 text-neon-green shadow-sm" 
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Right — Price + timestamp */}
      <div className="flex items-center gap-6">
        <LivePriceTicker coin={coin} />
        {lastUpdated && (
          <span className="text-[0.65rem] text-text-muted font-mono tabular-nums">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  );
}
