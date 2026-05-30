"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import type { ForecastPoint } from "@/lib/types";

export default function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const [days, setDays] = useState<number>(30);

  if (!data || data.length === 0) return null;

  // Filter data based on selected days
  const filteredData = data.slice(0, days).map((d) => ({
    name: `D+${d.dia}`,
    price: d.preco,
  }));

  // Find min and max for the Y-Axis domain to make the chart dynamic
  const minPrice = Math.min(...filteredData.map((d) => d.price));
  const maxPrice = Math.max(...filteredData.map((d) => d.price));
  
  // Add some padding to the domain
  const domainMin = minPrice * 0.99;
  const domainMax = maxPrice * 1.01;

  // First day price (Current Price reference)
  const currentPrice = filteredData[0]?.price || 0;
  const isBullish = filteredData[filteredData.length - 1]?.price >= currentPrice;
  const strokeColor = isBullish ? "#00ff88" : "#ff3366";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="section-label mb-0">Estimated Price Forecast (AI)</h3>
        
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          {[3, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-[0.65rem] font-bold rounded-md transition-colors ${
                days === d
                  ? "bg-white/20 text-white"
                  : "text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px] w-full glass-card rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#ffffff40"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              stroke="#ffffff40"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0a0f",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace"
              }}
              itemStyle={{ color: strokeColor }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Price"]}
            />
            <ReferenceLine y={currentPrice} stroke="#ffffff40" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={3}
              dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
