"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Code2, Plus, Trash2, Globe, Mail } from "lucide-react";

interface SuppressionEntry {
  id: string;
  type: "email" | "domain";
  value: string;
  reason?: string;
  createdAt: string;
}

interface Snippet {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export default function SuppressionAndSnippetsPage() {
  const [tab, setTab] = useState<"suppression" | "snippets">("suppression");

  // Suppression State
  const [entries, setEntries] = useState<SuppressionEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showSuppForm, setShowSuppForm] = useState(false);
  const [suppType, setSuppType] = useState<"email" | "domain">("domain");
  const [suppValue, setSuppValue] = useState("");
  const [suppReason, setSuppReason] = useState("");
  const [savingSupp, setSavingSupp] = useState(false);

  // Snippets State
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(true);
  const [showSnipForm, setShowSnipForm] = useState(false);
  const [snipName, setSnipName] = useState("");
  const [snipContent, setSnipContent] = useState("");
  const [savingSnip, setSavingSnip] = useState(false);

  async function loadSuppression() {
    const res = await fetch("/api/suppression");
    setEntries(await res.json());
    setLoadingEntries(false);
  }

  async function loadSnippets() {
    const res = await fetch("/api/snippets");
    setSnippets(await res.json());
    setLoadingSnippets(false);
  }

  useEffect(() => {
    loadSuppression();
    loadSnippets();
  }, []);

  async function handleAddSuppression(e: React.FormEvent) {
    e.preventDefault();
    if (!suppValue.trim()) return;
    setSavingSupp(true);
    await fetch("/api/suppression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: suppType, value: suppValue, reason: suppReason }),
    });
    setSuppValue("");
    setSuppReason("");
    setShowSuppForm(false);
    loadSuppression();
    setSavingSupp(false);
  }

  async function handleDeleteSuppression(id: string) {
    await fetch(`/api/suppression?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleAddSnippet(e: React.FormEvent) {
    e.preventDefault();
    if (!snipName.trim() || !snipContent.trim()) return;
    setSavingSnip(true);
    await fetch("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: snipName, content: snipContent }),
    });
    setSnipName("");
    setSnipContent("");
    setShowSnipForm(false);
    loadSnippets();
    setSavingSnip(false);
  }

  async function handleDeleteSnippet(id: string) {
    await fetch(`/api/snippets?id=${id}`, { method: "DELETE" });
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suppression & Snippets</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage global email/domain blocklists and reusable template text blocks</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        <button
          onClick={() => setTab("suppression")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "suppression" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Suppression Blocklist ({entries.length})
        </button>
        <button
          onClick={() => setTab("snippets")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "snippets" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Reusable Snippets ({snippets.length})
        </button>
      </div>

      {/* Suppression List */}
      {tab === "suppression" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Emails or domains listed here will be automatically excluded from all campaigns.</p>
            <button
              onClick={() => setShowSuppForm(!showSuppForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Suppression Entry
            </button>
          </div>

          {showSuppForm && (
            <div className="glass rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground">Add to Blocklist</h2>
              <form onSubmit={handleAddSuppression} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select value={suppType} onChange={(e) => setSuppType(e.target.value as "email" | "domain")} className={inputClass}>
                      <option value="domain">Domain (e.g. competitor.com)</option>
                      <option value="email">Email (e.g. ceo@disliked.com)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Value *</label>
                    <input className={inputClass} placeholder={suppType === "domain" ? "competitor.com" : "john@disliked.com"} value={suppValue} onChange={(e) => setSuppValue(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Reason (optional)</label>
                  <input className={inputClass} placeholder="e.g. Competitor domain" value={suppReason} onChange={(e) => setSuppReason(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingSupp} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50">
                    {savingSupp ? "Saving..." : "Save Entry"}
                  </button>
                  <button type="button" onClick={() => setShowSuppForm(false)} className="border border-border text-muted-foreground text-sm px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loadingEntries ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8" />
              <p>No suppression entries. Add competitor domains or emails to exclude them automatically.</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Reason</th>
                    <th>Added</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {entry.type === "domain" ? <Globe className="w-3.5 h-3.5 text-blue-400" /> : <Mail className="w-3.5 h-3.5 text-amber-400" />}
                          {entry.type}
                        </span>
                      </td>
                      <td className="font-mono text-foreground font-semibold">{entry.value}</td>
                      <td className="text-muted-foreground text-sm">{entry.reason || "—"}</td>
                      <td className="text-muted-foreground text-xs">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDeleteSuppression(entry.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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
      )}

      {/* Snippets List */}
      {tab === "snippets" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Insert reusable blocks into email templates using <span className="text-primary font-mono font-semibold">&#123;&#123;snippet:name&#125;&#125;</span>.</p>
            <button
              onClick={() => setShowSnipForm(!showSnipForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Snippet
            </button>
          </div>

          {showSnipForm && (
            <div className="glass rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground">Add Reusable Snippet</h2>
              <form onSubmit={handleAddSnippet} className="space-y-4 max-w-lg">
                <div>
                  <label className={labelClass}>Snippet Key * (used in template as &#123;&#123;snippet:key&#125;&#125;)</label>
                  <input className={inputClass + " font-mono"} placeholder="e.g. calendar_link" value={snipName} onChange={(e) => setSnipName(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Content *</label>
                  <textarea rows={4} className={inputClass} placeholder="e.g. Book a 15-min call here: https://calendly.com/your-name" value={snipContent} onChange={(e) => setSnipContent(e.target.value)} required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingSnip} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50">
                    {savingSnip ? "Saving..." : "Save Snippet"}
                  </button>
                  <button type="button" onClick={() => setShowSnipForm(false)} className="border border-border text-muted-foreground text-sm px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loadingSnippets ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : snippets.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Code2 className="w-8 h-8" />
              <p>No snippets yet. Create reusable text blocks like booking links or case study links.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snippets.map((snip) => (
                <div key={snip.id} className="glass rounded-xl p-5 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-primary">&#123;&#123;snippet:{snip.name}&#125;&#125;</span>
                    <button onClick={() => handleDeleteSnippet(snip.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground bg-secondary/60 p-3 rounded-lg font-mono whitespace-pre-wrap">{snip.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
