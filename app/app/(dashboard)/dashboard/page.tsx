"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Send, MailOpen, CornerDownRight,
  AlertTriangle, TrendingUp, Plus, Zap
} from "lucide-react";

interface DashboardData {
  totalLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  recentCampaigns: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { sequenceSteps: number };
  }[];
}

function StatCard({
  label, value, icon: Icon, color, suffix = "",
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="stat-card group hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "status-active",
  paused: "status-paused",
  stopped: "status-stopped",
  draft: "status-draft",
  completed: "status-draft",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overview of your outreach performance
          </p>
        </div>
        <Link
          href="/campaigns/new"
          id="new-campaign-btn"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={data.totalLeads.toLocaleString()}
          icon={Users}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Emails Sent"
          value={data.emailsSent.toLocaleString()}
          icon={Send}
          color="bg-primary/15 text-primary"
        />
        <StatCard
          label="Open Rate"
          value={data.openRate}
          icon={MailOpen}
          color="bg-amber-500/15 text-amber-400"
          suffix="%"
        />
        <StatCard
          label="Reply Rate"
          value={data.replyRate}
          icon={CornerDownRight}
          color="bg-purple-500/15 text-purple-400"
          suffix="%"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Active Campaigns"
          value={data.activeCampaigns}
          icon={Zap}
          color="bg-primary/15 text-primary"
        />
        <StatCard
          label="Total Campaigns"
          value={data.totalCampaigns}
          icon={TrendingUp}
          color="bg-slate-500/15 text-slate-400"
        />
        <StatCard
          label="Bounce Rate"
          value={data.bounceRate}
          icon={AlertTriangle}
          color="bg-red-500/15 text-red-400"
          suffix="%"
        />
      </div>

      {/* Recent Campaigns */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-primary text-sm hover:underline">
            View all →
          </Link>
        </div>

        {data.recentCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">No campaigns yet</p>
            <p className="text-muted-foreground text-sm max-w-xs">
              Create your first campaign to start sending cold emails
            </p>
            <Link
              href="/campaigns/new"
              className="text-primary text-sm font-medium hover:underline mt-1"
            >
              Create campaign →
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Steps</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCampaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "status-draft"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{c._count.sequenceSteps} step{c._count.sequenceSteps !== 1 ? "s" : ""}</td>
                  <td className="text-muted-foreground text-sm">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
