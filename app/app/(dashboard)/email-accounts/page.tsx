"use client";

import { useEffect, useState, useRef } from "react";
import { Mail, Plus, Trash2, TestTube, Upload, CheckCircle, XCircle, Clock, Flame } from "lucide-react";

interface EmailAccount {
  id: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  customDomain?: string;
  status: "active" | "error" | "untested";
  lastTestedAt?: string;
  createdAt: string;
}

interface WarmupStats {
  health: {
    score: number;
    rating: string;
    factors: { name: string; score: number; max: number; status: string }[];
  };
  activity: { date: string; sent: number; received: number; replied: number }[];
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "active") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-slate-400" />;
};

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Warmup Modal State
  const [warmupAccount, setWarmupAccount] = useState<EmailAccount | null>(null);
  const [warmupForm, setWarmupForm] = useState({
    enabled: false, dailyLimit: 40, rampUpDays: 30, rampUpCurve: "linear",
    replyRate: 35, importantRate: 20, spamRescueRate: 15,
  });
  const [warmupStats, setWarmupStats] = useState<WarmupStats | null>(null);
  const [savingWarmup, setSavingWarmup] = useState(false);

  const [form, setForm] = useState({
    fromName: "", fromEmail: "",
    smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "",
    imapHost: "", imapPort: "993", imapUser: "", imapPass: "",
    customDomain: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/email-accounts");
    const data = await res.json();
    setAccounts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openWarmupModal(acc: EmailAccount) {
    setWarmupAccount(acc);
    const [settingRes, statsRes] = await Promise.all([
      fetch(`/api/warmup/settings/${acc.id}`),
      fetch(`/api/warmup/stats/${acc.id}`),
    ]);
    const setting = await settingRes.json();
    const stats = await statsRes.json();
    setWarmupForm(setting);
    setWarmupStats(stats);
  }

  async function handleSaveWarmup(e: React.FormEvent) {
    e.preventDefault();
    if (!warmupAccount) return;
    setSavingWarmup(true);
    await fetch(`/api/warmup/settings/${warmupAccount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(warmupForm),
    });
    setSavingWarmup(false);
    setWarmupAccount(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        smtpPort: Number(form.smtpPort),
        imapPort: form.imapPort ? Number(form.imapPort) : undefined,
        imapHost: form.imapHost || undefined,
        imapUser: form.imapUser || undefined,
        imapPass: form.imapPass || undefined,
        customDomain: form.customDomain || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setShowForm(false);
    setForm({ fromName: "", fromEmail: "", smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", imapHost: "", imapPort: "993", imapUser: "", imapPass: "", customDomain: "" });
    load();
    setSaving(false);
  }

  async function handleTest(id: string) {
    setTesting(id);
    const res = await fetch(`/api/email-accounts/${id}/test`, { method: "POST" });
    const data = await res.json();
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, status: data.status } : a));
    setTesting(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this email account?")) return;
    await fetch(`/api/email-accounts/${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/email-accounts/import", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) { alert(`Imported ${data.created} accounts`); load(); }
    else alert(data.error);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Accounts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your SMTP/IMAP sending accounts and email warmup</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} id="csv-import-input" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 border border-border hover:border-primary/50 text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? "Importing..." : "Import CSV"}
          </button>
          <button
            id="add-account-btn"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Add Email Account</h2>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>From Name *</label>
                <input className={inputClass} placeholder="John Smith" value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>From Email *</label>
                <input className={inputClass} type="email" placeholder="john@company.com" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))} required />
              </div>
            </div>

            <p className="text-xs font-semibold text-primary uppercase tracking-wider pt-2">SMTP Settings</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>SMTP Host *</label>
                <input className={inputClass} placeholder="smtp.gmail.com" value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Port *</label>
                <input className={inputClass} type="number" placeholder="587" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Username *</label>
                <input className={inputClass} placeholder="john@company.com" value={form.smtpUser} onChange={e => setForm(f => ({ ...f, smtpUser: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input className={inputClass} type="password" placeholder="App password" value={form.smtpPass} onChange={e => setForm(f => ({ ...f, smtpPass: e.target.value }))} required />
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">IMAP Settings (optional — for reply tracking)</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>IMAP Host</label>
                <input className={inputClass} placeholder="imap.gmail.com" value={form.imapHost} onChange={e => setForm(f => ({ ...f, imapHost: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Port</label>
                <input className={inputClass} type="number" placeholder="993" value={form.imapPort} onChange={e => setForm(f => ({ ...f, imapPort: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Custom Tracking Domain (optional)</label>
                <input className={inputClass} placeholder="track.company.com" value={form.customDomain} onChange={e => setForm(f => ({ ...f, customDomain: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50">
                {saving ? "Saving..." : "Save Account"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground text-sm px-5 py-2 rounded-lg transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">No email accounts yet</p>
          <p className="text-muted-foreground text-sm">Add an SMTP account to start sending emails</p>
          <button onClick={() => setShowForm(true)} className="text-primary text-sm font-medium hover:underline mt-1">
            Add your first account →
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>SMTP</th>
                <th>Status</th>
                <th>Warmup</th>
                <th>Last Tested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <div className="font-medium text-foreground">{account.fromName}</div>
                    <div className="text-xs text-muted-foreground">{account.fromEmail}</div>
                  </td>
                  <td className="text-muted-foreground text-sm">{account.smtpHost}:{account.smtpPort}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={account.status} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${account.status}`}>
                        {account.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => openWarmupModal(account)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" /> Configure Warmup
                    </button>
                  </td>
                  <td className="text-muted-foreground text-sm">
                    {account.lastTestedAt ? new Date(account.lastTestedAt).toLocaleString() : "Never"}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleTest(account.id)}
                        disabled={testing === account.id}
                        title="Test connection"
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        title="Delete account"
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warmup Settings Modal */}
      {warmupAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-lg text-foreground">Email Warmup — {warmupAccount.fromEmail}</h2>
              </div>
              <button onClick={() => setWarmupAccount(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Health Score Gauge */}
            {warmupStats && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Health Score</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-emerald-400">{warmupStats.health.score}/100</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {warmupStats.health.rating}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {warmupStats.health.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{f.name}:</span>
                      <span className="text-primary font-semibold">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveWarmup} className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={warmupForm.enabled}
                  onChange={(e) => setWarmupForm((f) => ({ ...f, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
                <span className="font-medium text-sm text-foreground">Enable Warmup for this account</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Target Daily Limit (emails/day)</label>
                  <input type="number" value={warmupForm.dailyLimit} onChange={(e) => setWarmupForm(f => ({ ...f, dailyLimit: Number(e.target.value) }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ramp-Up Duration (days)</label>
                  <input type="number" value={warmupForm.rampUpDays} onChange={(e) => setWarmupForm(f => ({ ...f, rampUpDays: Number(e.target.value) }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ramp-Up Curve</label>
                  <select value={warmupForm.rampUpCurve} onChange={(e) => setWarmupForm(f => ({ ...f, rampUpCurve: e.target.value }))} className={inputClass}>
                    <option value="linear">Linear (Steady)</option>
                    <option value="exponential">Exponential (Gradual start)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Target Reply Rate (%)</label>
                  <input type="number" min={0} max={100} value={warmupForm.replyRate} onChange={(e) => setWarmupForm(f => ({ ...f, replyRate: Number(e.target.value) }))} className={inputClass} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="submit" disabled={savingWarmup} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50">
                  {savingWarmup ? "Saving..." : "Save Settings"}
                </button>
                <button type="button" onClick={() => setWarmupAccount(null)} className="border border-border text-muted-foreground hover:text-foreground text-sm px-5 py-2 rounded-lg transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
