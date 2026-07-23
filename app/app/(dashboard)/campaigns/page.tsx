"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, Plus, Pause, Play, Square, BarChart2, ChevronRight } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count: { sequenceSteps: number };
  campaignLeadLists: { leadList: { name: string } }[];
  campaignSenders: { emailAccount: { fromEmail: string } }[];
}

const STATUS_CLASSES: Record<string, string> = {
  active: "status-active", paused: "status-paused",
  stopped: "status-stopped", draft: "status-draft", completed: "status-draft",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/campaigns");
    setCampaigns(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doAction(id: string, action: "launch" | "pause" | "resume" | "stop") {
    setActionLoading(id);
    await fetch(`/api/campaigns/${id}/${action}`, { method: "POST" });
    await load();
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your email outreach campaigns</p>
        </div>
        <Link
          href="/campaigns/new"
          id="create-campaign-btn"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Send className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">No campaigns yet</p>
          <p className="text-muted-foreground text-sm">Create your first campaign to start sending</p>
          <Link href="/campaigns/new" className="text-primary text-sm font-medium hover:underline mt-1">
            Create campaign →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="glass rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/campaigns/${c.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[c.status] ?? "status-draft"}`}>
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>{c._count.sequenceSteps} step{c._count.sequenceSteps !== 1 ? "s" : ""}</span>
                  {c.campaignLeadLists.length > 0 && (
                    <span>{c.campaignLeadLists.map(l => l.leadList.name).join(", ")}</span>
                  )}
                  {c.campaignSenders.length > 0 && (
                    <span>{c.campaignSenders.length} sender{c.campaignSenders.length !== 1 ? "s" : ""}</span>
                  )}
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {c.status === "draft" && (
                  <button onClick={() => doAction(c.id, "launch")} disabled={actionLoading === c.id} title="Launch" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50">
                    <Play className="w-3.5 h-3.5" /> Launch
                  </button>
                )}
                {c.status === "active" && (
                  <button onClick={() => doAction(c.id, "pause")} disabled={actionLoading === c.id} title="Pause" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-50">
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                )}
                {c.status === "paused" && (
                  <button onClick={() => doAction(c.id, "resume")} disabled={actionLoading === c.id} title="Resume" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50">
                    <Play className="w-3.5 h-3.5" /> Resume
                  </button>
                )}
                {(c.status === "active" || c.status === "paused") && (
                  <button onClick={() => doAction(c.id, "stop")} disabled={actionLoading === c.id} title="Stop" className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
                    <Square className="w-3.5 h-3.5" />
                  </button>
                )}
                <Link href={`/campaigns/${c.id}`} title="Analytics" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <BarChart2 className="w-4 h-4" />
                </Link>
                <Link href={`/campaigns/${c.id}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
