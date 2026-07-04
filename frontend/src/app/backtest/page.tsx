"use client";

import { useState } from "react";
import { Play, TrendingUp, Calendar, DollarSign, Activity } from "lucide-react";

export default function BacktestPage() {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-02-01");
  const [capital, setCapital] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          initial_capital: capital
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Backtest failed", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Activity className="text-blue-500" />
          Algorithmic Backtester
        </h1>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Initial Capital ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={runBacktest} disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Play className="h-4 w-4" />
              {loading ? "Running..." : "Run Backtest"}
            </button>
          </div>
        </div>

        {result && result.summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-400 text-sm font-medium">ROI</p>
                <div className="flex items-center gap-3 mt-2">
                  <TrendingUp className={result.summary.roi_pct >= 0 ? "text-green-500" : "text-red-500"} />
                  <p className={`text-3xl font-bold ${result.summary.roi_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {result.summary.roi_pct.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-400 text-sm font-medium">Final Capital</p>
                <p className="text-3xl font-bold text-white mt-2">
                  ${result.summary.final_capital.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-400 text-sm font-medium">Total Trades</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {result.summary.total_trades}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="font-semibold text-white">Trade History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Entry Date</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Entry Price</th>
                      <th className="px-6 py-3 font-medium">Exit Price</th>
                      <th className="px-6 py-3 font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {result.trades?.map((trade: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">{trade.entry_date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${trade.tipo === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {trade.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4">${trade.entry_price?.toFixed(2)}</td>
                        <td className="px-6 py-4">${trade.exit_price?.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={trade.pnl === 'Profit' ? 'text-green-500' : 'text-red-500'}>
                            {trade.pnl}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!result.trades || result.trades.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No trades executed in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
