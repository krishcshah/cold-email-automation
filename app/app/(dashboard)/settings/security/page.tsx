"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Smartphone, Plus, Trash2 } from "lucide-react";

interface AuditLog {
  id: string;
  actorName: string;
  actorEmail: string;
  actionType: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

interface IpEntry {
  id: string;
  ipAddress: string;
  label?: string;
  createdAt: string;
}

export default function SecuritySettingsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [ips, setIps] = useState<IpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  // IP Form
  const [newIp, setNewIp] = useState("");
  const [ipLabel, setIpLabel] = useState("");
  const [showIpForm, setShowIpForm] = useState(false);

  async function loadData() {
    const [aRes, iRes] = await Promise.all([
      fetch("/api/security/audit"),
      fetch("/api/security/ip-allowlist"),
    ]);
    if (aRes.ok) setLogs(await aRes.json());
    if (iRes.ok) setIps(await iRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddIp(e: React.FormEvent) {
    e.preventDefault();
    if (!newIp) return;
    await fetch("/api/security/ip-allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: "ws_default", ipAddress: newIp, label: ipLabel }),
    });
    setNewIp("");
    setIpLabel("");
    setShowIpForm(false);
    loadData();
  }

  async function handleDeleteIp(id: string) {
    await fetch(`/api/security/ip-allowlist?id=${id}`, { method: "DELETE" });
    setIps((prev) => prev.filter((i) => i.id !== id));
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enterprise Security & Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage 2FA authentication, IP allowlisting, and review workspace activity logs</p>
      </div>

      {/* 2FA Section */}
      <div className="glass rounded-xl p-6 border border-border flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Two-Factor Authentication (2FA TOTP)</h2>
            <p className="text-xs text-muted-foreground">Secure your account with authenticator apps (Google Authenticator, 1Password, Authy)</p>
          </div>
        </div>
        <button
          onClick={() => setTwoFaEnabled(!twoFaEnabled)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${twoFaEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          {twoFaEnabled ? "2FA Enabled" : "Enable 2FA Authenticator"}
        </button>
      </div>

      {/* IP Allowlist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Workspace IP Allowlist
          </h2>
          <button onClick={() => setShowIpForm(!showIpForm)} className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-3.5 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Add IP Subnet
          </button>
        </div>

        {showIpForm && (
          <form onSubmit={handleAddIp} className="glass rounded-xl p-5 border border-border space-y-3 max-w-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>IP Address / CIDR *</label>
                <input className={inputClass} placeholder="192.168.1.1 or 10.0.0.0/24" value={newIp} onChange={(e) => setNewIp(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Description / Label</label>
                <input className={inputClass} placeholder="e.g. HQ Office VPN" value={ipLabel} onChange={(e) => setIpLabel(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg">Allow IP</button>
              <button type="button" onClick={() => setShowIpForm(false)} className="border border-border text-muted-foreground text-xs px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {ips.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-muted-foreground text-xs">
            No IP restrictions configured. All IP addresses are currently permitted.
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Allowed IP Address</th>
                  <th>Label</th>
                  <th>Added Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ips.map((ip) => (
                  <tr key={ip.id}>
                    <td className="font-mono text-xs font-bold text-foreground">{ip.ipAddress}</td>
                    <td className="text-xs text-muted-foreground">{ip.label || "—"}</td>
                    <td className="text-xs text-muted-foreground">{new Date(ip.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDeleteIp(ip.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enterprise Audit Log Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Enterprise Audit Logs
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                    <td>
                      <p className="font-semibold text-foreground text-xs">{l.actorName}</p>
                      <p className="text-[10px] text-muted-foreground">{l.actorEmail}</p>
                    </td>
                    <td>
                      <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-primary border border-border font-semibold">
                        {l.actionType}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{l.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
