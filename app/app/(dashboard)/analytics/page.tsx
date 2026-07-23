"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Clock, Award, ShieldCheck } from "lucide-react";

interface AnalyticsData {
  days: string[];
  heatmap: { day: number; hour: number; openRate: number }[];
  funnel: { step: string; sent: number; opened: number; replied: number }[];
  benchmarks: {
    userOpenRate: number;
    industryOpenRate: number;
    userReplyRate: number;
    industryReplyRate: number;
    userBounceRate: number;
    industryBounceRate: number;
  };
}

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/heatmap")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getHeatmapColor = (rate: number) => {
    if (rate >= 60) return "bg-emerald-500 text-white font-bold";
    if (rate >= 40) return "bg-emerald-500/40 text-emerald-300";
    if (rate >= 25) return "bg-blue-500/30 text-blue-300";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Campaign Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Send time heatmaps, sequence performance funnels, and industry benchmarks</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl border border-border flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Attributed Pipeline Value</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">$142,500</p>
          </div>
        </div>
      </div>

      {/* Benchmark Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass p-5 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Open Rate vs Industry</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-foreground">OutreachPro</span>
              <span className="font-mono text-emerald-400 font-bold">{data.benchmarks.userOpenRate}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: `${data.benchmarks.userOpenRate}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Industry Avg</span>
              <span className="font-mono">{data.benchmarks.industryOpenRate}%</span>
            </div>
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Reply Rate vs Industry</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-foreground">OutreachPro</span>
              <span className="font-mono text-purple-400 font-bold">{data.benchmarks.userReplyRate}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full" style={{ width: `${data.benchmarks.userReplyRate * 3}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Industry Avg</span>
              <span className="font-mono">{data.benchmarks.industryReplyRate}%</span>
            </div>
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Bounce Rate vs Industry</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-foreground">OutreachPro</span>
              <span className="font-mono text-blue-400 font-bold">{data.benchmarks.userBounceRate}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full" style={{ width: `${data.benchmarks.userBounceRate * 10}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Industry Avg</span>
              <span className="font-mono">{data.benchmarks.industryBounceRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sequence Performance Funnel */}
      <div className="glass rounded-xl p-6 border border-border space-y-4">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Sequence Performance Funnel
        </h2>
        <div className="space-y-3">
          {data.funnel.map((item, idx) => (
            <div key={item.step} className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{item.step}</span>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>Sent: <strong className="text-foreground">{item.sent}</strong></span>
                  <span>Opened: <strong className="text-emerald-400">{item.opened} ({((item.opened / item.sent) * 100).toFixed(0)}%)</strong></span>
                  <span>Replied: <strong className="text-purple-400">{item.replied} ({((item.replied / item.sent) * 100).toFixed(0)}%)</strong></span>
                </div>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden border border-border">
                <div className="bg-primary h-full" style={{ width: `${100 - idx * 22}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7x24 Send Heatmap Grid */}
      <div className="glass rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Best Send Time Heatmap (Mon-Sun x 24 Hours)
          </h2>
          <span className="text-xs text-muted-foreground">Dark Green = Peak Open Rate Window</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px] space-y-1">
            {/* Hour Labels */}
            <div className="grid grid-cols-25 gap-1 text-[9px] font-mono text-muted-foreground text-center pb-1">
              <span>Day</span>
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h}>{h}h</span>
              ))}
            </div>

            {/* Heatmap Rows */}
            {data.days.map((day, dIdx) => (
              <div key={day} className="grid grid-cols-25 gap-1 items-center">
                <span className="text-xs font-bold text-foreground font-mono">{day}</span>
                {Array.from({ length: 24 }).map((_, hIdx) => {
                  const cell = data.heatmap.find((m) => m.day === dIdx && m.hour === hIdx);
                  const rate = cell ? cell.openRate : 20;
                  return (
                    <div
                      key={hIdx}
                      title={`${day} ${hIdx}:00 — ${rate}% predicted open rate`}
                      className={`h-7 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${getHeatmapColor(rate)}`}
                    >
                      {rate}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
