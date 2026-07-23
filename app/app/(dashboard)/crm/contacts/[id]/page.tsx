"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, CheckSquare, Clock } from "lucide-react";

interface Tag { id: string; name: string; color: string; }
interface Note { id: string; authorName: string; content: string; createdAt: string; }
interface Task { id: string; title: string; dueDate?: string; completed: boolean; }
interface CallLog { id: string; outcome: string; notes?: string; loggedByName: string; createdAt: string; }
interface EmailEvent { id: string; type: string; occurredAt: string; metadata?: Record<string, unknown>; }
interface InboxReply { id: string; subject?: string; bodyText?: string; receivedAt: string; }

interface ContactDetail {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  stage: string;
  dealValue: number;
  assignedToId?: string;
  contactTags: { tag: Tag }[];
  notes: Note[];
  tasks: Task[];
  callLogs: CallLog[];
  lead?: {
    emailEvents: EmailEvent[];
    inboxReplies: InboxReply[];
  };
}

const STAGES = ["new_lead", "contacted", "interested", "meeting_booked", "closed_won", "closed_lost"];

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [stage, setStage] = useState("");
  const [dealValue, setDealValue] = useState("0");
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  const loadDetail = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([
      fetch(`/api/crm/contacts/${params.id}`),
      fetch("/api/crm/tags"),
    ]);
    if (cRes.ok) {
      const data = await cRes.json();
      setContact(data);
      setStage(data.stage);
      setDealValue(String(data.dealValue || 0));
      setSelectedTagIds(data.contactTags.map((ct: { tag: Tag }) => ct.tag.id));
    }
    if (tRes.ok) setAllTags(await tRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  async function handleUpdateField(field: string, value: unknown) {
    await fetch(`/api/crm/contacts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    loadDetail();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    await fetch(`/api/crm/contacts/${params.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote("");
    loadDetail();
    setSavingNote(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setSavingTask(true);
    await fetch(`/api/crm/contacts/${params.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask }),
    });
    setNewTask("");
    loadDetail();
    setSavingTask(false);
  }

  async function toggleTag(tagId: string) {
    const nextTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(nextTags);
    await fetch(`/api/crm/contacts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds: nextTags }),
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) return <div className="text-muted-foreground p-8">Contact not found.</div>;

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  // Build unified chronological activity timeline
  const timeline: { type: string; title: string; detail?: string; date: Date }[] = [];

  contact.notes.forEach((n) => {
    timeline.push({ type: "note", title: `Note by ${n.authorName}`, detail: n.content, date: new Date(n.createdAt) });
  });

  contact.callLogs.forEach((c) => {
    timeline.push({ type: "call", title: `Call Outcome: ${c.outcome.toUpperCase()} (${c.loggedByName})`, detail: c.notes || undefined, date: new Date(c.createdAt) });
  });

  if (contact.lead) {
    contact.lead.emailEvents.forEach((e) => {
      timeline.push({ type: "email_event", title: `Email Event: ${e.type.toUpperCase()}`, detail: `Step Number: ${e.metadata ? JSON.stringify(e.metadata) : "Standard send"}`, date: new Date(e.occurredAt) });
    });
    contact.lead.inboxReplies.forEach((r) => {
      timeline.push({ type: "reply", title: `Received Reply: ${r.subject || "No Subject"}`, detail: r.bodyText || undefined, date: new Date(r.receivedAt) });
    });
  }

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {contact.firstName ? `${contact.firstName} ${contact.lastName || ""}` : contact.email}
          </h1>
          <p className="text-xs text-muted-foreground">{contact.title || "Contact Profile"} {contact.company ? `@ ${contact.company}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Controls */}
        <div className="glass rounded-xl p-5 space-y-5 border border-border h-fit">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">Deal & Lead Details</h2>

          <div>
            <label className={labelClass}>Pipeline Stage</label>
            <select value={stage} onChange={(e) => { setStage(e.target.value); handleUpdateField("stage", e.target.value); }} className={inputClass}>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Deal Value ($)</label>
            <input
              type="number"
              className={inputClass + " font-mono font-bold text-emerald-400"}
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              onBlur={() => handleUpdateField("dealValue", Number(dealValue))}
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <p className="text-sm font-mono text-foreground bg-secondary/50 p-2 rounded border border-border truncate">{contact.email}</p>
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-2 py-0.5 rounded font-medium transition-all ${isSelected ? "ring-2 ring-white shadow-md opacity-100" : "opacity-40 hover:opacity-80"}`}
                    style={{ backgroundColor: tag.color, color: "#fff" }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Timeline, Notes, Tasks */}
        <div className="md:col-span-2 space-y-6">
          {/* Notes & Tasks Composers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Note composer */}
            <div className="glass rounded-xl p-4 space-y-3 border border-border">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Add Internal Note
              </h3>
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea rows={3} className={inputClass} placeholder="Add a note about this lead..." value={newNote} onChange={(e) => setNewNote(e.target.value)} required />
                <button type="submit" disabled={savingNote} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded transition-all disabled:opacity-50">
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </form>
            </div>

            {/* Task composer */}
            <div className="glass rounded-xl p-4 space-y-3 border border-border">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Add Follow-Up Task
              </h3>
              <form onSubmit={handleAddTask} className="space-y-2">
                <input className={inputClass} placeholder="Task title (e.g. Send proposal)" value={newTask} onChange={(e) => setNewTask(e.target.value)} required />
                <button type="submit" disabled={savingTask} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all disabled:opacity-50">
                  {savingTask ? "Saving..." : "Add Task"}
                </button>
              </form>
            </div>
          </div>

          {/* Active Tasks List */}
          {contact.tasks.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-2 border border-border">
              <h3 className="font-semibold text-sm text-foreground">Tasks</h3>
              <div className="space-y-1.5">
                {contact.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs text-foreground bg-secondary/40 p-2 rounded border border-border">
                    <input type="checkbox" checked={task.completed} onChange={() => {}} className="rounded text-primary" />
                    <span className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline Stream */}
          <div className="glass rounded-xl p-5 space-y-4 border border-border">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Activity Timeline & Touchpoints
            </h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No touchpoint history logged yet.</p>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-6">
                {timeline.map((item, idx) => (
                  <div key={idx} className="ml-5 relative group">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{item.date.toLocaleString()}</span>
                      </div>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg border border-border/50 font-mono whitespace-pre-wrap">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
