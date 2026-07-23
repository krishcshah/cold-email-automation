"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Activity, Trash2 } from "lucide-react";

interface WorkspaceMember {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "member" | "viewer";
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  actorName: string;
  action: string;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  async function loadData() {
    const [mRes, aRes] = await Promise.all([
      fetch("/api/team/members"),
      fetch("/api/team/activity"),
    ]);
    if (mRes.ok) setMembers(await mRes.json());
    if (aRes.ok) setActivities(await aRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    await fetch("/api/team/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    setEmail(""); setName("");
    setShowInviteModal(false);
    loadData();
    setInviting(false);
  }

  async function handleDeleteMember(id: string) {
    await fetch(`/api/team/members?id=${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Collaboration & Workspace</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage team members, roles, and view workspace activity stream</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Invite Teammate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold text-foreground text-base">Workspace Members ({members.length})</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Users className="w-8 h-8" />
              <p>No team members invited yet. Invite teammates to share campaigns, lead lists, and deals.</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <p className="font-semibold text-foreground text-sm">{m.name || m.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">{m.email}</p>
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${m.role === "admin" ? "bg-amber-500/20 text-amber-400" : m.role === "member" ? "bg-blue-500/20 text-blue-400" : "bg-secondary text-muted-foreground"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-emerald-400 capitalize">{m.status}</span>
                      </td>
                      <td className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDeleteMember(m.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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

        {/* Real-time Activity Feed Stream */}
        <div className="glass rounded-xl p-5 space-y-4 border border-border h-fit">
          <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Workspace Activity Feed
          </h2>

          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No workspace activity logged yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activities.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{a.actorName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Invite Teammate to Workspace</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className={labelClass}>Email Address *</label>
                <input className={inputClass} placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Full Name (optional)</label>
                <input className={inputClass} placeholder="Sarah Connor" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Workspace Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")} className={inputClass}>
                  <option value="admin">Admin (Full Control)</option>
                  <option value="member">Member (Create & Manage Campaigns/Deals)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={inviting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">
                  {inviting ? "Sending Invitation..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
