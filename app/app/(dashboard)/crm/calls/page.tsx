"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, CheckCircle, PhoneOff, PhoneMissed, ArrowLeft, ChevronRight } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  stage: string;
  dealValue: number;
}

export default function CallTasksPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [loggingOutcome, setLoggingOutcome] = useState(false);

  async function loadCallQueue() {
    const res = await fetch("/api/crm/contacts");
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadCallQueue(); }, []);

  async function handleLogOutcome(contactId: string, outcome: "connected" | "voicemail" | "no_answer") {
    setLoggingOutcome(true);
    await fetch(`/api/crm/contacts/${contactId}/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, notes: callNotes }),
    });
    setCallNotes("");
    setActiveCallId(null);
    loadCallQueue();
    setLoggingOutcome(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/crm" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Call Tasks Queue</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Execute cold calls, log outcomes, and auto-advance campaign steps</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <PhoneCall className="w-8 h-8 text-primary" />
          <p>No call tasks queued for today. Add contacts to your pipeline to start calling.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((c) => (
            <div key={c.id} className="glass rounded-xl p-5 border border-border space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {c.firstName ? `${c.firstName} ${c.lastName || ""}` : c.email}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {c.title || "Prospect"} {c.company ? `@ ${c.company}` : ""} • <span className="font-mono text-primary">{c.phone || "No phone listed"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCallId(activeCallId === c.id ? null : c.id)}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3.5 py-2 rounded-lg transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Log Call Outcome
                  </button>
                  <Link href={`/crm/contacts/${c.id}`} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Log Outcome Panel */}
              {activeCallId === c.id && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                  <p className="text-xs font-semibold text-foreground">Select Outcome for this Call:</p>
                  <textarea
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    placeholder="Add brief call notes..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleLogOutcome(c.id, "connected")}
                      disabled={loggingOutcome}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Connected
                    </button>
                    <button
                      onClick={() => handleLogOutcome(c.id, "voicemail")}
                      disabled={loggingOutcome}
                      className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all disabled:opacity-50"
                    >
                      <PhoneOff className="w-3.5 h-3.5" /> Voicemail
                    </button>
                    <button
                      onClick={() => handleLogOutcome(c.id, "no_answer")}
                      disabled={loggingOutcome}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all disabled:opacity-50"
                    >
                      <PhoneMissed className="w-3.5 h-3.5" /> No Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
