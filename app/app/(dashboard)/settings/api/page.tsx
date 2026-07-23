"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Key, Webhook, Plus, Trash2, BookOpen } from "lucide-react";

interface ApiKey { id: string; name: string; key: string; createdAt: string; }
interface WebhookSub { id: string; url: string; events: string; secret: string; createdAt: string; }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [keyName, setKeyName] = useState("");
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("email.sent,email.replied,meeting.booked");
  const [showWebhookForm, setShowWebhookForm] = useState(false);

  async function loadData() {
    const [kRes, wRes] = await Promise.all([
      fetch("/api/keys"),
      fetch("/api/webhooks/subscriptions"),
    ]);
    if (kRes.ok) setKeys(await kRes.json());
    if (wRes.ok) setWebhooks(await wRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName) return;
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName }),
    });
    setKeyName("");
    setShowKeyForm(false);
    loadData();
  }

  async function handleDeleteKey(id: string) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl) return;
    await fetch("/api/webhooks/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
    });
    setWebhookUrl("");
    setShowWebhookForm(false);
    loadData();
  }

  async function handleDeleteWebhook(id: string) {
    await fetch(`/api/webhooks/subscriptions?id=${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys & Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage REST API credentials and real-time webhook event subscriptions</p>
        </div>
        <Link href="/docs/api" className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
          <BookOpen className="w-4 h-4" /> API Documentation
        </Link>
      </div>

      {/* REST API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Secret REST API Keys
          </h2>
          <button onClick={() => setShowKeyForm(!showKeyForm)} className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-3.5 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Generate API Key
          </button>
        </div>

        {showKeyForm && (
          <form onSubmit={handleCreateKey} className="glass rounded-xl p-5 border border-border space-y-3 max-w-lg">
            <div>
              <label className={labelClass}>Key Description / App Name *</label>
              <input className={inputClass} placeholder="e.g. Production Ingestion Key" value={keyName} onChange={(e) => setKeyName(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg">Generate Key</button>
              <button type="button" onClick={() => setShowKeyForm(false)} className="border border-border text-muted-foreground text-xs px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            No API keys generated yet. Click Generate API Key to create one.
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>API Token</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="font-semibold text-foreground text-sm">{k.name}</td>
                    <td className="font-mono text-xs text-primary font-bold">{k.key}</td>
                    <td className="text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDeleteKey(k.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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

      {/* Webhook Subscriptions Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" /> Webhook Subscriptions
          </h2>
          <button onClick={() => setShowWebhookForm(!showWebhookForm)} className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold px-3.5 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Add Webhook Subscription
          </button>
        </div>

        {showWebhookForm && (
          <form onSubmit={handleCreateWebhook} className="glass rounded-xl p-5 border border-border space-y-3 max-w-lg">
            <div>
              <label className={labelClass}>Webhook Payload URL *</label>
              <input className={inputClass} placeholder="https://api.yourdomain.com/webhooks/outreach" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Subscribed Events (CSV)</label>
              <input className={inputClass} placeholder="email.sent,email.replied,meeting.booked" value={webhookEvents} onChange={(e) => setWebhookEvents(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">Subscribe Webhook</button>
              <button type="button" onClick={() => setShowWebhookForm(false)} className="border border-border text-muted-foreground text-xs px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {webhooks.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            No webhook subscriptions configured yet.
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target URL</th>
                  <th>Events</th>
                  <th>HMAC Signing Secret</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.id}>
                    <td className="font-mono text-xs font-semibold text-foreground">{w.url}</td>
                    <td>
                      <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">{w.events}</span>
                    </td>
                    <td className="font-mono text-xs text-amber-400 font-medium">{w.secret}</td>
                    <td>
                      <button onClick={() => handleDeleteWebhook(w.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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
    </div>
  );
}
