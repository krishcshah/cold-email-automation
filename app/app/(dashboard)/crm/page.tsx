"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, DollarSign, PhoneCall, Building2, ChevronRight } from "lucide-react";

interface Tag { id: string; name: string; color: string; }

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  stage: "new_lead" | "contacted" | "interested" | "meeting_booked" | "closed_won" | "closed_lost";
  dealValue: number;
  assignedToId?: string;
  contactTags: { tag: Tag }[];
  updatedAt: string;
}

const STAGES = [
  { key: "new_lead", label: "New Lead", color: "border-blue-500/40 bg-blue-500/5 text-blue-400" },
  { key: "contacted", label: "Contacted", color: "border-purple-500/40 bg-purple-500/5 text-purple-400" },
  { key: "interested", label: "Interested", color: "border-amber-500/40 bg-amber-500/5 text-amber-400" },
  { key: "meeting_booked", label: "Meeting Booked", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" },
  { key: "closed_won", label: "Closed Won", color: "border-emerald-600 bg-emerald-600/10 text-emerald-300 font-bold" },
  { key: "closed_lost", label: "Closed Lost", color: "border-red-500/40 bg-red-500/5 text-red-400" },
] as const;

export default function CrmKanbanPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  // New Contact Form
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [dealValue, setDealValue] = useState("0");
  const [saving, setSaving] = useState(false);

  async function loadContacts() {
    const res = await fetch("/api/crm/contacts");
    setContacts(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadContacts(); }, []);

  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSaving(true);
    await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName, company, title, dealValue }),
    });
    setEmail(""); setFirstName(""); setLastName(""); setCompany(""); setTitle(""); setDealValue("0");
    setShowNewContactModal(false);
    loadContacts();
    setSaving(false);
  }

  async function moveStage(contactId: string, newStage: Contact["stage"]) {
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, stage: newStage } : c));
    await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
  }

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.firstName && c.firstName.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  const totalPipelineValue = contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0);

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM Pipeline (Kanban)</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Total Pipeline Value: <span className="text-emerald-400 font-bold font-mono">${totalPipelineValue.toLocaleString()}</span> across {contacts.length} deal contacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/crm/calls" className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <PhoneCall className="w-4 h-4 text-primary" /> Call Tasks
          </Link>
          <Link href="/crm/companies" className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <Building2 className="w-4 h-4 text-primary" /> Companies
          </Link>
          <button
            onClick={() => setShowNewContactModal(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <input
          className={inputClass + " pl-9"}
          placeholder="Search contacts, companies, or emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colContacts = filteredContacts.filter((c) => c.stage === col.key);
            const colValue = colContacts.reduce((sum, c) => sum + (c.dealValue || 0), 0);

            return (
              <div key={col.key} className="glass rounded-xl p-3 flex flex-col h-[700px] border border-border">
                {/* Column Header */}
                <div className={`p-2.5 rounded-lg border mb-3 flex items-center justify-between ${col.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/40 font-mono">{colContacts.length}</span>
                </div>

                {colValue > 0 && (
                  <p className="text-xs font-mono font-semibold text-muted-foreground px-1 mb-2">
                    ${colValue.toLocaleString()}
                  </p>
                )}

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colContacts.map((contact) => (
                    <div key={contact.id} className="glass rounded-lg p-3 space-y-2 border border-border/80 hover:border-primary/40 transition-all group relative">
                      <div className="flex items-start justify-between">
                        <Link href={`/crm/contacts/${contact.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                          {contact.firstName ? `${contact.firstName} ${contact.lastName || ""}` : contact.email}
                        </Link>
                        <Link href={`/crm/contacts/${contact.id}`} className="text-muted-foreground hover:text-foreground">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>

                      {contact.company && (
                        <p className="text-xs text-muted-foreground font-medium truncate">{contact.company}</p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <span className="font-mono font-semibold text-emerald-400 flex items-center">
                          <DollarSign className="w-3 h-3" />{(contact.dealValue || 0).toLocaleString()}
                        </span>

                        {/* Quick Shift Dropdown */}
                        <select
                          value={contact.stage}
                          onChange={(e) => moveStage(contact.id, e.target.value as Contact["stage"])}
                          className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tag Badges */}
                      {contact.contactTags.length > 0 && (
                        <div className="flex gap-1 flex-wrap pt-1">
                          {contact.contactTags.map(({ tag }) => (
                            <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-md w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Add New CRM Contact</h2>
              <button onClick={() => setShowNewContactModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className={labelClass}>Email Address *</label>
                <input className={inputClass} placeholder="john@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input className={inputClass} placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input className={inputClass} placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Company</label>
                  <input className={inputClass} placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} placeholder="VP of Sales" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Deal Value ($)</label>
                <input type="number" className={inputClass} value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
