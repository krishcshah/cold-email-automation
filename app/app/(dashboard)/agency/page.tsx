"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, CreditCard, ExternalLink, SlidersHorizontal, Sparkles } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  clientName?: string;
  clientEmail?: string;
  sendingCreditsLimit: number;
  sendingCreditsUsed: number;
  enrichmentCreditsLimit: number;
  enrichmentCreditsUsed: number;
  createdAt: string;
}

export default function AgencyDashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sendingLimit, setSendingLimit] = useState("10000");
  const [enrichmentLimit, setEnrichmentLimit] = useState("500");
  const [saving, setSaving] = useState(false);

  async function loadWorkspaces() {
    const res = await fetch("/api/agency/workspaces");
    if (res.ok) setWorkspaces(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadWorkspaces(); }, []);

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/agency/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        clientName,
        clientEmail,
        sendingCreditsLimit: sendingLimit,
        enrichmentCreditsLimit: enrichmentLimit,
      }),
    });
    setName("");
    setClientName("");
    setClientEmail("");
    setShowModal(false);
    setSaving(false);
    loadWorkspaces();
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agency Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage isolated client workspaces, allocate sending credits, and shadow client accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/agency/branding" className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <SlidersHorizontal className="w-4 h-4 text-primary" /> White-Label Settings
          </Link>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> New Client Workspace
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass p-5 rounded-xl border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Client Workspaces</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{workspaces.length}</p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Sending Credits Pool</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {workspaces.reduce((acc, w) => acc + w.sendingCreditsLimit, 0).toLocaleString()}
          </p>
        </div>

        <div className="glass p-5 rounded-xl border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Lead Credits Pool</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            {workspaces.reduce((acc, w) => acc + w.enrichmentCreditsLimit, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Workspaces Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          <p>No client workspaces created yet. Click New Client Workspace to onboard your first agency client.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workspace Name</th>
                <th>Client Info</th>
                <th>Sending Credits</th>
                <th>Lead Credits</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => (
                <tr key={w.id}>
                  <td>
                    <p className="font-bold text-foreground text-sm">{w.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{w.id}</p>
                  </td>
                  <td>
                    <p className="text-xs font-semibold text-foreground">{w.clientName || "Direct Client"}</p>
                    <p className="text-xs text-muted-foreground">{w.clientEmail || "—"}</p>
                  </td>
                  <td>
                    <p className="text-xs font-mono text-foreground font-semibold">
                      {w.sendingCreditsUsed.toLocaleString()} / {w.sendingCreditsLimit.toLocaleString()}
                    </p>
                    <div className="w-28 bg-secondary h-1.5 rounded-full overflow-hidden mt-1 border border-border">
                      <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (w.sendingCreditsUsed / w.sendingCreditsLimit) * 100)}%` }} />
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-mono text-foreground font-semibold">
                      {w.enrichmentCreditsUsed} / {w.enrichmentCreditsLimit}
                    </p>
                  </td>
                  <td className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => alert(`Shadowing workspace: ${w.name}`)} className="flex items-center gap-1 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded transition-all">
                      Shadow Workspace <ExternalLink className="w-3 h-3 text-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Create Client Workspace</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label className={labelClass}>Workspace Name *</label>
                <input className={inputClass} placeholder="e.g. Acme Growth Account" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Client Name</label>
                  <input className={inputClass} placeholder="John Acme" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Client Email</label>
                  <input className={inputClass} placeholder="john@acme.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Sending Limit / Month</label>
                  <input className={inputClass} type="number" value={sendingLimit} onChange={(e) => setSendingLimit(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Lead Credits Limit</label>
                  <input className={inputClass} type="number" value={enrichmentLimit} onChange={(e) => setEnrichmentLimit(e.target.value)} />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">
                  {saving ? "Creating..." : "Create Client Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
