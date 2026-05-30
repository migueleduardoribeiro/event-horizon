"use client";

import type { SignalColor } from "@/lib/types";

interface StatusLedProps {
  signal: SignalColor;
  size?: "sm" | "md";
}

const sizeMap = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
};

const classMap: Record<SignalColor, string> = {
  bullish: "led-bullish",
  bearish: "led-bearish",
  neutral: "led-neutral",
  inactive: "led-inactive",
};

export default function StatusLed({ signal, size = "md" }: StatusLedProps) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${sizeMap[size]} ${classMap[signal]}`}
      aria-label={signal}
    />
  );
}
