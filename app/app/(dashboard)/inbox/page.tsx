"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Reply, MailOpen } from "lucide-react";

interface InboxReply {
  id: string;
  subject?: string;
  bodyText?: string;
  receivedAt: string;
  label: string;
  isRead: boolean;
  repliedAt?: string;
  lead: { email: string; firstName?: string; lastName?: string; company?: string };
  campaign: { name: string };
  emailAccount: { fromEmail: string; fromName: string };
}

const LABEL_OPTIONS = [
  { value: "interested", label: "Interested", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "not_interested", label: "Not Interested", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { value: "meeting_booked", label: "Meeting Booked", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "unsubscribed", label: "Unsubscribed", color: "text-muted-foreground bg-secondary border-border" },
  { value: "none", label: "No Label", color: "text-muted-foreground bg-secondary border-border" },
];

function getLabelStyle(label: string) {
  return LABEL_OPTIONS.find(l => l.value === label)?.color ?? "text-muted-foreground";
}

export default function InboxPage() {
  const [replies, setReplies] = useState<InboxReply[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<InboxReply | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/inbox?limit=50&label=${filter}`);
    const data = await res.json();
    setReplies(data.replies ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function updateLabel(replyId: string, label: string) {
    await fetch(`/api/inbox/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, label } : r));
    if (selected?.id === replyId) setSelected((s) => s ? { ...s, label } : s);
  }

  async function sendReply(replyId: string) {
    if (!replyBody.trim()) return;
    setSending(true);
    const res = await fetch(`/api/inbox/${replyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: replyBody.replace(/\n/g, "<br>") }),
    });
    if (res.ok) {
      setReplyBody("");
      setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, repliedAt: new Date().toISOString() } : r));
    }
    setSending(false);
  }

  const filterTabs = [
    { value: "all", label: "All" },
    { value: "interested", label: "Interested" },
    { value: "meeting_booked", label: "Meeting Booked" },
    { value: "not_interested", label: "Not Interested" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Unified Inbox</h1>
        <p className="text-muted-foreground text-sm mt-0.5">All replies from all campaigns in one place</p>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-border gap-1">
        {filterTabs.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${filter === t.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto py-2 text-xs text-muted-foreground self-center pr-1">{total} replies</div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)]">
        {/* Reply list */}
        <div className="w-80 flex-shrink-0 glass rounded-xl overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <Inbox className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No replies yet</p>
            </div>
          ) : (
            <div>
              {replies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => setSelected(reply)}
                  className={`w-full p-4 text-left border-b border-border/50 hover:bg-accent/50 transition-colors ${selected?.id === reply.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {reply.lead.firstName || reply.lead.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{reply.lead.company}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{reply.subject || "(no subject)"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(reply.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {reply.label !== "none" && (
                    <span className={`inline-block mt-2 text-xs px-1.5 py-0.5 rounded border font-medium ${getLabelStyle(reply.label)}`}>
                      {LABEL_OPTIONS.find(l => l.value === reply.label)?.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply detail */}
        {selected ? (
          <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {[selected.lead.firstName, selected.lead.lastName].filter(Boolean).join(" ") || selected.lead.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selected.lead.email} • {selected.campaign.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={selected.label}
                    onChange={(e) => updateLabel(selected.id, e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {LABEL_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground mt-3">{selected.subject || "(no subject)"}</p>
              <p className="text-xs text-muted-foreground">{new Date(selected.receivedAt).toLocaleString()}</p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {selected.bodyText || "(empty reply)"}
              </pre>
            </div>

            {/* Reply composer */}
            <div className="px-5 py-4 border-t border-border">
              <textarea
                rows={4}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => sendReply(selected.id)}
                  disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  <Reply className="w-3.5 h-3.5" />
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
              {selected.repliedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Replied at {new Date(selected.repliedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 glass rounded-xl flex flex-col items-center justify-center gap-3">
            <MailOpen className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Select a reply to read it</p>
          </div>
        )}
      </div>
    </div>
  );
}
