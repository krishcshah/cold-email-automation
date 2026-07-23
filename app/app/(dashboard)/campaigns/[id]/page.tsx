"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
import ReachInboxOptions, { ReachInboxOptionsState } from "@/components/campaign/ReachInboxOptions";

interface CampaignAnalytics {
  sent: number; opened: number; clicked: number;
  replied: number; bounced: number; unsubscribed: number;
  totalLeads: number; openRate: number; replyRate: number; clickRate: number;
}

interface LeadState {
  id: string; currentStep: number; status: string; lastEmailSentAt?: string;
  lead: { email: string; firstName?: string; lastName?: string; company?: string };
}

interface Campaign {
  id: string; name: string; status: string;
  sequenceSteps: { stepNumber: number; subject: string; delayDays: number }[];
  campaignLeadLists: { leadList: { name: string } }[];
  // Options
  stopOnReply: boolean;
  stopOnDomainReply: boolean;
  bounceProtection: boolean;
  bounceThreshold: number;
  smartTimeGaps: boolean;
  maxNewLeadsPerDay: number;
  prioritizeNewLeads: boolean;
  autoOptimizeAZ: boolean;
  insertUnsubscribeHeader: boolean;
  unsubscribeBehavior: "current" | "all";
  aiReplyAgentEnabled: boolean;
  textOnlyDelivery: boolean;
  providerMatching: boolean;
  strictProviderMatching: boolean;
  targetProviders: string | string[];
  includeBlockquotes: boolean;
  positiveReplyNotification: boolean;
  notificationEmail: string | null;
  automatedOooReschedule: boolean;
  prospectValue: number;
  tags: string | null;
  ccEmails: string | null;
  bccEmails: string | null;
}

const STATUS_CLASSES: Record<string, string> = {
  active: "status-active", paused: "status-paused",
  stopped: "status-stopped", draft: "status-draft",
  replied: "status-active", completed: "status-draft", unsubscribed: "status-stopped", bounced: "status-error",
};

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-1 ${color}`}>
      <span className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [leadStates, setLeadStates] = useState<LeadState[]>([]);
  const [stateTotal, setStateTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingOptions, setSavingOptions] = useState(false);
  const [tab, setTab] = useState<"analytics" | "leads" | "sequences" | "schedule" | "options">("analytics");

  const [reachInboxOpts, setReachInboxOpts] = useState<ReachInboxOptionsState | null>(null);

  const load = useCallback(async () => {
    const [cRes, aRes, lRes] = await Promise.all([
      fetch(`/api/campaigns/${id}`),
      fetch(`/api/campaigns/${id}/analytics`),
      fetch(`/api/campaigns/${id}/lead-status?page=1&limit=50`),
    ]);
    const [c, a, l] = await Promise.all([cRes.json(), aRes.json(), lRes.json()]);
    setCampaign(c);
    setAnalytics(a);
    setLeadStates(l.states ?? []);
    setStateTotal(l.total ?? 0);

    if (c) {
      const providersArr = typeof c.targetProviders === "string"
        ? c.targetProviders.split(",")
        : (c.targetProviders || ["google", "outlook", "others"]);

      setReachInboxOpts({
        stopOnReply: c.stopOnReply ?? true,
        stopOnDomainReply: c.stopOnDomainReply ?? false,
        bounceProtection: c.bounceProtection ?? true,
        bounceThreshold: c.bounceThreshold ?? 10,
        smartTimeGaps: c.smartTimeGaps ?? true,
        maxNewLeadsPerDay: c.maxNewLeadsPerDay ?? 500,
        prioritizeNewLeads: c.prioritizeNewLeads ?? false,
        autoOptimizeAZ: c.autoOptimizeAZ ?? false,
        insertUnsubscribeHeader: c.insertUnsubscribeHeader ?? true,
        unsubscribeBehavior: (c.unsubscribeBehavior as "current" | "all") || "all",
        aiReplyAgentEnabled: c.aiReplyAgentEnabled ?? false,
        textOnlyDelivery: c.textOnlyDelivery ?? false,
        providerMatching: c.providerMatching ?? false,
        strictProviderMatching: c.strictProviderMatching ?? false,
        targetProviders: providersArr,
        includeBlockquotes: c.includeBlockquotes ?? true,
        positiveReplyNotification: c.positiveReplyNotification ?? false,
        notificationEmail: c.notificationEmail || "",
        automatedOooReschedule: c.automatedOooReschedule ?? true,
        prospectValue: c.prospectValue ?? 500,
        tags: c.tags || "",
        ccEmails: c.ccEmails || "",
        bccEmails: c.bccEmails || "",
      });
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: "launch" | "pause" | "resume" | "stop") {
    setActionLoading(true);
    await fetch(`/api/campaigns/${id}/${action}`, { method: "POST" });
    await load();
    setActionLoading(false);
  }

  async function handleSaveOptions() {
    if (!reachInboxOpts) return;
    setSavingOptions(true);
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reachInboxOpts),
    });
    setSavingOptions(false);
    await load();
  }

  if (!campaign) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/campaigns" className="p-2 mt-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CLASSES[campaign.status] ?? "status-draft"}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {campaign.sequenceSteps.length} step sequence •{" "}
            {campaign.campaignLeadLists.map(l => l.leadList.name).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "draft" && (
            <button onClick={() => doAction("launch")} disabled={actionLoading} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
              <Play className="w-3.5 h-3.5" /> Launch
            </button>
          )}
          {campaign.status === "active" && (
            <button onClick={() => doAction("pause")} disabled={actionLoading} className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button onClick={() => doAction("resume")} disabled={actionLoading} className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
              <Play className="w-3.5 h-3.5" /> Resume Campaign
            </button>
          )}
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button onClick={() => doAction("stop")} disabled={actionLoading} className="flex items-center gap-1.5 border border-border hover:border-destructive/50 text-muted-foreground hover:text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Analytics Summary Banner */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatPill label="Total Leads" value={analytics.totalLeads} color="glass text-foreground" />
          <StatPill label="Sent" value={analytics.sent} color="glass text-primary" />
          <StatPill label="Opened" value={`${analytics.openRate}%`} color="glass text-amber-400" />
          <StatPill label="Clicked" value={`${analytics.clickRate}%`} color="glass text-blue-400" />
          <StatPill label="Replied" value={`${analytics.replyRate}%`} color="glass text-emerald-400" />
          <StatPill label="Bounced" value={analytics.bounced} color="glass text-red-400" />
          <StatPill label="Unsub" value={analytics.unsubscribed} color="glass text-muted-foreground" />
        </div>
      )}

      {/* Main Campaign Management Tabs */}
      <div>
        <div className="flex border-b border-border mb-4 gap-2">
          {(["analytics", "leads", "sequences", "schedule", "options"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "analytics"
                ? "Analytics"
                : t === "leads"
                ? `Leads (${stateTotal})`
                : t === "sequences"
                ? "Sequences"
                : t === "schedule"
                ? "Schedule"
                : "Options"}
            </button>
          ))}
        </div>

        {tab === "analytics" && analytics && (
          <div className="glass rounded-xl p-6 space-y-6">
            <h3 className="text-base font-bold text-foreground">Campaign Analytics Overview</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Leads Contacted</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">{analytics.sent}</p>
              </div>
              <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Open Rate</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-1">{analytics.openRate}%</p>
              </div>
              <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Reply Rate</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{analytics.replyRate}%</p>
              </div>
            </div>
          </div>
        )}

        {tab === "sequences" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Email Sequence Steps</h2>
            </div>
            <div className="p-5 space-y-3">
              {campaign.sequenceSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {step.stepNumber}
                    </div>
                    {i < campaign.sequenceSteps.length - 1 && (
                      <div className="w-px h-8 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-medium text-foreground text-sm">{step.subject}</p>
                    {i > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">+{step.delayDays} day{step.delayDays !== 1 ? "s" : ""} after previous step</p>
                    )}
                    {i === 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Sent immediately after launch</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "leads" && (
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Email</th>
                  <th>Company</th>
                  <th>Step</th>
                  <th>Status</th>
                  <th>Last Sent</th>
                </tr>
              </thead>
              <tbody>
                {leadStates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8">
                      No leads enrolled yet
                    </td>
                  </tr>
                ) : (
                  leadStates.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="font-medium text-foreground text-sm">
                          {[s.lead.firstName, s.lead.lastName].filter(Boolean).join(" ") || s.lead.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{s.lead.email}</div>
                      </td>
                      <td className="text-muted-foreground text-sm">{s.lead.company || "—"}</td>
                      <td className="text-muted-foreground text-sm">Step {s.currentStep}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[s.status] ?? "status-draft"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-xs">
                        {s.lastEmailSentAt ? new Date(s.lastEmailSentAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "options" && reachInboxOpts && (
          <ReachInboxOptions
            options={reachInboxOpts}
            onChange={(updated) => setReachInboxOpts(updated)}
            onSave={handleSaveOptions}
            isSaving={savingOptions}
          />
        )}
      </div>
    </div>
  );
}
