"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search, Sparkles } from "lucide-react";

interface SpamResult {
  score: number;
  rating: "Good" | "Moderate" | "High Risk";
  triggers: { word: string; category: string; severity: "low" | "medium" | "high" }[];
  suggestions: string[];
}

interface DnsResult {
  domain: string;
  spfValid: boolean;
  spfRecord?: string;
  dmarcValid: boolean;
  dmarcRecord?: string;
  mxValid: boolean;
  mxRecords?: string[];
  issues: string[];
}

interface BlacklistResult {
  domain: string;
  isBlacklisted: boolean;
  blacklistsChecked: number;
  listings: { name: string; host: string; listed: boolean; details?: string }[];
}

export default function DeliverabilityPage() {
  const [tab, setTab] = useState<"spam" | "dns" | "blacklist">("spam");

  // Spam score state
  const [spamSubject, setSpamSubject] = useState("");
  const [spamBody, setSpamBody] = useState("");
  const [spamResult, setSpamResult] = useState<SpamResult | null>(null);
  const [checkingSpam, setCheckingSpam] = useState(false);

  // DNS check state
  const [dnsDomain, setDnsDomain] = useState("");
  const [dnsResult, setDnsResult] = useState<DnsResult | null>(null);
  const [checkingDns, setCheckingDns] = useState(false);

  // Blacklist check state
  const [blDomain, setBlDomain] = useState("");
  const [blResult, setBlResult] = useState<BlacklistResult | null>(null);
  const [checkingBl, setCheckingBl] = useState(false);

  async function handleCheckSpam(e: React.FormEvent) {
    e.preventDefault();
    setCheckingSpam(true);
    const res = await fetch("/api/deliverability/spam-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: spamSubject, body: spamBody }),
    });
    setSpamResult(await res.json());
    setCheckingSpam(false);
  }

  async function handleCheckDns(e: React.FormEvent) {
    e.preventDefault();
    if (!dnsDomain.trim()) return;
    setCheckingDns(true);
    const res = await fetch("/api/deliverability/dns-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: dnsDomain }),
    });
    setDnsResult(await res.json());
    setCheckingDns(false);
  }

  async function handleCheckBl(e: React.FormEvent) {
    e.preventDefault();
    if (!blDomain.trim()) return;
    setCheckingBl(true);
    const res = await fetch("/api/deliverability/blacklist-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: blDomain }),
    });
    setBlResult(await res.json());
    setCheckingBl(false);
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deliverability Tools</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Diagnose spam triggers, DNS authentication, and domain blacklists</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {[
          { id: "spam", label: "Spam Score Checker" },
          { id: "dns", label: "DNS Authentication (SPF / DMARC)" },
          { id: "blacklist", label: "DNSBL Blacklist Monitor" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Spam Score Checker */}
      {tab === "spam" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Analyze Email Content</h2>
            <form onSubmit={handleCheckSpam} className="space-y-4">
              <div>
                <label className={labelClass}>Subject Line</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Quick question regarding Q3 expansion"
                  value={spamSubject}
                  onChange={(e) => setSpamSubject(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Email Body</label>
                <textarea
                  rows={8}
                  className={inputClass + " resize-none font-mono text-xs"}
                  placeholder="Type or paste your email copy here..."
                  value={spamBody}
                  onChange={(e) => setSpamBody(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={checkingSpam || (!spamSubject && !spamBody)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {checkingSpam ? "Analyzing..." : "Analyze Spam Score"}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Analysis Results</h2>
            {!spamResult ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground text-sm text-center">
                <ShieldCheck className="w-10 h-10 stroke-1" />
                <p>Run the analyzer to inspect spam trigger words and deliverability recommendations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className={`text-3xl font-bold ${spamResult.score < 3 ? "text-emerald-400" : spamResult.score < 6 ? "text-amber-400" : "text-red-400"}`}>
                    {spamResult.score}/10
                  </div>
                  <div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${spamResult.score < 3 ? "status-active" : spamResult.score < 6 ? "status-paused" : "status-error"}`}>
                      {spamResult.rating}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {spamResult.score < 3 ? "Low spam risk. Great for deliverability!" : spamResult.score < 6 ? "Moderate risk. Consider cleaning up trigger words." : "High risk. Likely to land in spam folders."}
                    </p>
                  </div>
                </div>

                {spamResult.triggers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detected Trigger Words ({spamResult.triggers.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {spamResult.triggers.map((t, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                          {t.word} ({t.category})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</p>
                  <ul className="space-y-1 text-xs text-foreground">
                    {spamResult.suggestions.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DNS Authentication Check */}
      {tab === "dns" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <form onSubmit={handleCheckDns} className="flex gap-3 max-w-md">
              <input
                className={inputClass}
                placeholder="Enter domain (e.g. acme.com)"
                value={dnsDomain}
                onChange={(e) => setDnsDomain(e.target.value)}
              />
              <button
                type="submit"
                disabled={checkingDns}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {checkingDns ? "Checking..." : "Check DNS"}
              </button>
            </form>
          </div>

          {dnsResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SPF */}
              <div className="glass rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">SPF Record</span>
                  {dnsResult.spfValid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
                <p className="text-xs text-muted-foreground">Validates authorized sending mail servers.</p>
                <div className="bg-secondary p-3 rounded-lg font-mono text-xs text-foreground break-all">
                  {dnsResult.spfRecord || "No SPF record found"}
                </div>
              </div>

              {/* DMARC */}
              <div className="glass rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">DMARC Record</span>
                  {dnsResult.dmarcValid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
                <p className="text-xs text-muted-foreground">Specifies policy for unauthenticated emails.</p>
                <div className="bg-secondary p-3 rounded-lg font-mono text-xs text-foreground break-all">
                  {dnsResult.dmarcRecord || "No DMARC record found (_dmarc)"}
                </div>
              </div>

              {/* MX */}
              <div className="glass rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">MX Records</span>
                  {dnsResult.mxValid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
                <p className="text-xs text-muted-foreground">Inbound mail servers handling replies.</p>
                <div className="bg-secondary p-3 rounded-lg font-mono text-xs text-foreground break-all">
                  {dnsResult.mxRecords?.join(", ") || "No MX records found"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DNSBL Blacklist Checker */}
      {tab === "blacklist" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <form onSubmit={handleCheckBl} className="flex gap-3 max-w-md">
              <input
                className={inputClass}
                placeholder="Enter domain or IP (e.g. acme.com)"
                value={blDomain}
                onChange={(e) => setBlDomain(e.target.value)}
              />
              <button
                type="submit"
                disabled={checkingBl}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {checkingBl ? "Checking..." : "Check Blacklists"}
              </button>
            </form>
          </div>

          {blResult && (
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-semibold text-foreground">Blacklist Summary for {blResult.domain}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Scanned {blResult.blacklistsChecked} major DNSBL providers</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${blResult.isBlacklisted ? "status-error" : "status-active"}`}>
                  {blResult.isBlacklisted ? "Blacklisted" : "Clean"}
                </span>
              </div>

              <div className="space-y-2">
                {blResult.listings.map((l) => (
                  <div key={l.host} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/50">
                    <div>
                      <span className="font-medium text-sm text-foreground">{l.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">({l.host})</span>
                    </div>
                    {l.listed ? (
                      <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Listed
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
