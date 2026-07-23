"use client";

import { useState } from "react";
import { Download, Trash2, Key, Server, CheckCircle2 } from "lucide-react";

export default function EnterpriseSettingsPage() {
  const [targetEmail, setTargetEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("okta");
  const [ssoUrl, setSsoUrl] = useState("https://okta.yourcompany.com/sso/saml");

  async function handleGdprDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!targetEmail) return;
    setDeleting(true);

    const res = await fetch("/api/enterprise/gdpr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetEmail }),
    });

    if (res.ok) {
      alert(`GDPR Data Deletion completed for ${targetEmail}. Lead deleted and permanently suppressed.`);
      setTargetEmail("");
    }
    setDeleting(false);
  }

  function handleDownloadExport() {
    window.location.href = "/api/enterprise/export";
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enterprise Compliance & Data Privacy</h1>
          <p className="text-muted-foreground text-sm mt-0.5">SAML 2.0 SSO, GDPR Right-to-be-forgotten, dedicated IP pools, and account data exports</p>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> 99.99% SLA Uptime Guarantee
        </div>
      </div>

      {/* Full Account Data Export */}
      <div className="glass rounded-xl p-6 border border-border flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Full Account Data Export (JSON)
          </h2>
          <p className="text-xs text-muted-foreground">Download a complete backup of all campaigns, sequence steps, lead lists, contacts, and API logs.</p>
        </div>
        <button onClick={handleDownloadExport} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg transition-all">
          <Download className="w-4 h-4" /> Download Complete JSON Export
        </button>
      </div>

      {/* SAML 2.0 Single Sign-On (SSO) */}
      <div className="glass rounded-xl p-6 border border-border space-y-4">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-400" /> SAML 2.0 Enterprise Single Sign-On (SSO)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Identity Provider (IdP)</label>
            <select value={ssoProvider} onChange={(e) => setSsoProvider(e.target.value)} className={inputClass}>
              <option value="okta">Okta Enterprise SSO</option>
              <option value="azure">Azure Active Directory (Entra ID)</option>
              <option value="ping">Ping Identity / SAML 2.0</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>SAML SSO Metadata URL *</label>
            <input className={inputClass} value={ssoUrl} onChange={(e) => setSsoUrl(e.target.value)} />
          </div>
        </div>
      </div>

      {/* GDPR Data Deletion (Right to be forgotten) */}
      <div className="glass rounded-xl p-6 border border-border space-y-4">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5 text-destructive" /> GDPR Right-to-be-Forgotten Lead Deletion
        </h2>
        <p className="text-xs text-muted-foreground">Permanently delete a lead across all lists, campaigns, and inbox threads while logging compliance suppression.</p>
        <form onSubmit={handleGdprDelete} className="flex gap-3 max-w-lg">
          <input className={inputClass} placeholder="lead@company.com" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} required />
          <button type="submit" disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap">
            {deleting ? "Deleting..." : "Execute GDPR Deletion"}
          </button>
        </form>
      </div>

      {/* Dedicated IP Pools */}
      <div className="glass rounded-xl p-6 border border-border space-y-3">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" /> Dedicated Sending IP Pools
        </h2>
        <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-foreground">198.51.100.42 (Dedicated Sender Pool #1)</p>
            <p className="text-[10px] text-muted-foreground">Status: Active • Warmup Score: 100%</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Dedicated</span>
        </div>
      </div>
    </div>
  );
}
