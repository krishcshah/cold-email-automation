"use client";

import { useState } from "react";
import { Plug, MessageSquare, Database, FileSpreadsheet, Check, ArrowRight } from "lucide-react";

const INTEGRATIONS = [
  {
    id: "slack",
    name: "Slack",
    category: "Notifications",
    description: "Send real-time channel alerts when prospects reply positively or book meetings.",
    icon: MessageSquare,
    connected: true,
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    category: "CRM & Sales",
    description: "Two-way sync contacts, deal stages, and log outreach email activity into HubSpot.",
    icon: Plug,
    connected: false,
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "CRM & Sales",
    description: "Sync contacts, organization details, and deal pipelines into Pipedrive.",
    icon: Plug,
    connected: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM & Sales",
    description: "Push qualified leads and log engagement activity into Salesforce CRM.",
    icon: Database,
    connected: false,
  },
  {
    id: "clay",
    name: "Clay Workflows",
    category: "Lead Ingestion",
    description: "Push leads directly from Clay tables into OutreachPro lead lists via webhooks.",
    icon: MessageSquare,
    connected: true,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "Data Sync",
    description: "Two-way live synchronization with Google Sheets as an active lead source.",
    icon: FileSpreadsheet,
    connected: true,
  },
];

export default function IntegrationsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/test/webhook");
  const [hubspotKey, setHubspotKey] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveSlack(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/integrations/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl: slackWebhook }),
    });
    setActiveModal(null);
    setSaving(false);
    alert("Slack integration updated and test alert dispatched!");
  }

  async function handleSaveHubspot(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/integrations/hubspot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: hubspotKey }),
    });
    setActiveModal(null);
    setSaving(false);
    alert("HubSpot integration connected!");
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Native Integrations Hub</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Connect OutreachPro with your CRM, Slack channels, Clay workflows, and Google Sheets</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="glass rounded-xl p-5 border border-border flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{item.category}</span>
                    </div>
                  </div>
                  {item.connected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <button
                onClick={() => setActiveModal(item.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold py-2 rounded-lg transition-all"
              >
                Configure Integration <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Slack Modal */}
      {activeModal === "slack" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Configure Slack Integration</h2>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSaveSlack} className="space-y-3">
              <div>
                <label className={labelClass}>Slack Webhook URL *</label>
                <input className={inputClass} placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} required />
              </div>
              <p className="text-xs text-muted-foreground">Alerts will be automatically dispatched to this channel whenever a lead replies or books a meeting.</p>
              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Save & Dispatch Test Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HubSpot Modal */}
      {activeModal === "hubspot" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Configure HubSpot CRM</h2>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSaveHubspot} className="space-y-3">
              <div>
                <label className={labelClass}>HubSpot Access Token / API Key *</label>
                <input className={inputClass} placeholder="pat-na1-..." value={hubspotKey} onChange={(e) => setHubspotKey(e.target.value)} required />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">
                  {saving ? "Connecting..." : "Connect HubSpot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
