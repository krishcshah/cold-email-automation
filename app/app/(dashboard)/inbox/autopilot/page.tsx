"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, XCircle, Sparkles, Edit3, ArrowLeft, Send } from "lucide-react";

interface AiDraft {
  id: string;
  category: string;
  suggestedBody: string;
  status: string;
  createdAt: string;
  inboxReply: {
    subject?: string;
    bodyText?: string;
    lead?: { email: string; firstName?: string; company?: string };
    campaign?: { name: string };
  };
}

export default function AutopilotInboxPage() {
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");

  async function loadDrafts() {
    const res = await fetch("/api/ai/autopilot");
    if (res.ok) setDrafts(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadDrafts(); }, []);

  async function handleApprove(draftId: string, updatedText?: string) {
    await fetch("/api/ai/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, action: "approve", updatedBody: updatedText }),
    });
    setEditingDraftId(null);
    loadDrafts();
  }

  async function handleReject(draftId: string) {
    await fetch("/api/ai/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, action: "reject" }),
    });
    loadDrafts();
  }

  const categoryBadgeClass = (category: string) => {
    switch (category) {
      case "interested": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "meeting_request": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "question": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/inbox" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Reply Agent (Autopilot)</h1>
            <p className="text-muted-foreground text-sm mt-0.5">AI reads incoming replies, categorizes intent, and queues responses for 1-click approval</p>
          </div>
        </div>

        <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl border border-border">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Full Autopilot Mode</p>
            <p className="text-[10px] text-muted-foreground">Auto-send approved responses</p>
          </div>
          <input
            type="checkbox"
            checked={autopilotEnabled}
            onChange={(e) => setAutopilotEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
          />
        </div>
      </div>

      {/* Review Queue */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <p>No pending AI reply drafts in the queue. New incoming replies will automatically appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((d) => {
            const isEditing = editingDraftId === d.id;
            const lead = d.inboxReply?.lead;
            return (
              <div key={d.id} className="glass rounded-xl p-6 border border-border space-y-4 hover:border-primary/40 transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${categoryBadgeClass(d.category)}`}>
                      {d.category.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">• Campaign: <strong className="text-foreground">{d.inboxReply?.campaign?.name}</strong></span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleTimeString()}</span>
                </div>

                {/* Incoming Message Snippet */}
                <div className="p-3.5 rounded-lg bg-secondary/40 border border-border space-y-1">
                  <p className="text-xs font-bold text-foreground">{lead?.firstName || lead?.email} ({lead?.company || "Lead"}):</p>
                  <p className="text-xs text-muted-foreground italic">&ldquo;{d.inboxReply?.bodyText || d.inboxReply?.subject}&rdquo;</p>
                </div>

                {/* AI Suggested Response */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Suggested Response Draft:
                    </span>
                    {!isEditing && (
                      <button onClick={() => { setEditingDraftId(d.id); setEditedBody(d.suggestedBody); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Response
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-3 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingDraftId(null)} className="text-xs px-3 py-1 border border-border rounded text-muted-foreground">Cancel</button>
                        <button onClick={() => handleApprove(d.id, editedBody)} className="text-xs px-3 py-1 bg-primary text-primary-foreground font-semibold rounded">Save & Send</button>
                      </div>
                    </div>
                  ) : (
                    <pre className="p-3.5 rounded-lg bg-background border border-border text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                      {d.suggestedBody}
                    </pre>
                  )}
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => handleReject(d.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-3 py-1.5 rounded transition-colors">
                    <XCircle className="w-4 h-4" /> Reject Draft
                  </button>
                  <button onClick={() => handleApprove(d.id)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all">
                    <Send className="w-3.5 h-3.5" /> Approve & Send Response
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
