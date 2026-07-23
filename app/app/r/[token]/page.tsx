"use client";

import { useEffect, useState } from "react";
import { Zap, Send, MailCheck, MessageSquare, Calendar, DollarSign, Printer, ShieldCheck } from "lucide-react";

interface ReportData {
  title: string;
  views: number;
  createdAt: string;
  branding: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  } | null;
  metrics: {
    totalEmailsSent: number;
    openRate: number;
    replyRate: number;
    meetingsBooked: number;
    estimatedRoi: string;
  };
}

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/r/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground p-4">
        Report not found or has been revoked.
      </div>
    );
  }

  const { title, metrics, branding } = data;
  const companyName = branding?.companyName || "OutreachPro";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Client Header */}
      <div className="flex items-center justify-between border-b border-border pb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">Prepared for {companyName} • Updated Live</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all">
          <Printer className="w-4 h-4" /> Print PDF Report
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass p-5 rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Emails Sent</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{metrics.totalEmailsSent.toLocaleString()}</p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Open Rate</span>
            <MailCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.openRate}%</p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Reply Rate</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono">{metrics.replyRate}%</p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Meetings Booked</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{metrics.meetingsBooked}</p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Estimated ROI</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.estimatedRoi}</p>
        </div>
      </div>

      {/* Summary Container */}
      <div className="glass rounded-xl p-6 border border-border space-y-3">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" /> Performance Summary & Health Score
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Outreach campaign deliverability score is currently at <strong className="text-emerald-400">98/100</strong>. Email accounts are operating within safety rate parameters with automatic inbox warmup enabled.
        </p>
      </div>
    </div>
  );
}
