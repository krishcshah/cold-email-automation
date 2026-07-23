"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Copy, ExternalLink, Eye, Check } from "lucide-react";

interface Report {
  id: string;
  token: string;
  title: string;
  views: number;
  createdAt: string;
}

interface Workspace { id: string; name: string; }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [rRes, wRes] = await Promise.all([
      fetch("/api/reports"),
      fetch("/api/agency/workspaces"),
    ]);
    if (rRes.ok) setReports(await rRes.json());
    if (wRes.ok) {
      const wsData = await wRes.json();
      setWorkspaces(wsData);
      if (wsData.length > 0) setWorkspaceId(wsData[0].id);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !workspaceId) return;
    setSaving(true);

    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, workspaceId }),
    });

    setTitle("");
    setShowModal(false);
    setSaving(false);
    loadData();
  }

  function copyReportLink(token: string) {
    const fullUrl = `${window.location.origin}/r/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shareable Client Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate read-only live performance reports for your agency clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
          <Plus className="w-4 h-4" /> Create Shareable Report
        </button>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          <p>No shareable client reports generated yet. Click Create Shareable Report to get started.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Public URL Token</th>
                <th>Views</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const isCopied = copiedToken === r.token;
                return (
                  <tr key={r.id}>
                    <td className="font-bold text-foreground text-sm">{r.title}</td>
                    <td className="font-mono text-xs text-primary font-bold">{r.token}</td>
                    <td className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> {r.views} views
                    </td>
                    <td className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyReportLink(r.token)} className="flex items-center gap-1 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded transition-all">
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {isCopied ? "Copied" : "Copy Link"}
                        </button>
                        <Link href={`/r/${r.token}`} target="_blank" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Create Shareable Client Report</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-3">
              <div>
                <label className={labelClass}>Report Title *</label>
                <input className={inputClass} placeholder="e.g. Q3 Performance Summary — Acme Corp" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Target Workspace *</label>
                <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} className={inputClass}>
                  {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">
                  {saving ? "Generating..." : "Generate Shareable Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
