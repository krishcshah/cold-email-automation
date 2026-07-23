"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Sparkles, Filter, CheckCircle2, MailSearch } from "lucide-react";

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  linkedInUrl: string;
  phone: string;
  techStack: string[];
  confidenceScore: number;
}

interface LeadList { id: string; name: string; }

export default function ProspectingPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(450);
  const [availableLists, setAvailableLists] = useState<LeadList[]>([]);
  const [targetListId, setTargetListId] = useState("");
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [savingLeads, setSavingLeads] = useState(false);

  // Search Filters
  const [title, setTitle] = useState("Founder");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Software & SaaS");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch("/api/leads").then((r) => r.json()).then((data) => {
      setAvailableLists(data);
      if (data.length > 0) setTargetListId(data[0].id);
    });
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/prospecting/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, companyName, industry, companySize, location }),
    });
    const data = await res.json();
    setProspects(data.results || []);
    if (data.availableCredits !== undefined) setCredits(data.availableCredits);
    setLoading(false);
  }, [title, companyName, industry, companySize, location]);

  useEffect(() => { handleSearch(); }, [handleSearch]);

  function toggleProspect(id: string) {
    setSelectedProspectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleImportSelected() {
    if (!targetListId || selectedProspectIds.length === 0) return;
    setSavingLeads(true);

    const selectedProspects = prospects.filter((p) => selectedProspectIds.includes(p.id));
    await fetch("/api/integrations/clay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId: targetListId,
        leads: selectedProspects.map((p) => ({
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          company: p.company,
          title: p.title,
          phone: p.phone,
          website: `https://${p.company.toLowerCase().replace(/\s+/g, "")}.com`,
        })),
      }),
    });

    setSelectedProspectIds([]);
    setSavingLeads(false);
    alert(`Successfully imported ${selectedProspects.length} prospects into selected Lead List!`);
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">B2B Prospect Database</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Search verified B2B leads by job title, company size, industry, location, and tech stack</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Available Credits:</span>
            <span className="font-mono text-emerald-400 font-bold">{credits}</span>
          </div>
          <Link href="/prospecting/finder" className="flex items-center gap-1.5 bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <MailSearch className="w-4 h-4 text-primary" /> Email Finder & Verifier
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="glass rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">Search Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className={labelClass}>Job Title</label>
            <input className={inputClass} placeholder="e.g. VP of Sales" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} placeholder="e.g. Acme Inc" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input className={inputClass} placeholder="e.g. Software & SaaS" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company Size</label>
            <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputClass}>
              <option value="">Any Company Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} placeholder="e.g. San Francisco" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2 rounded-lg transition-all disabled:opacity-50">
            {loading ? "Searching..." : "Search Prospects"}
          </button>
        </div>
      </form>

      {/* Action Toolbar */}
      {selectedProspectIds.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-semibold text-primary">{selectedProspectIds.length} prospects selected</span>
          <div className="flex items-center gap-3">
            <select value={targetListId} onChange={(e) => setTargetListId(e.target.value)} className={inputClass + " w-56"}>
              {availableLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button
              onClick={handleImportSelected}
              disabled={savingLeads}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {savingLeads ? "Importing..." : "Import to Selected Lead List"}
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prospects.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Search className="w-8 h-8 text-primary" />
          <p>No prospects match your current search filters. Try adjusting your title or industry criteria.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Prospect</th>
                <th>Company & Title</th>
                <th>Location</th>
                <th>Tech Stack</th>
                <th>Verified Email</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const isSelected = selectedProspectIds.includes(p.id);
                return (
                  <tr key={p.id} className={isSelected ? "bg-primary/10" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProspect(p.id)}
                        className="rounded border-border text-primary focus:ring-primary/50"
                      />
                    </td>
                    <td>
                      <p className="font-bold text-foreground text-sm">{p.firstName} {p.lastName}</p>
                      <a href={p.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">LinkedIn Profile</a>
                    </td>
                    <td>
                      <p className="font-medium text-foreground text-xs">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.company} • {p.companySize}</p>
                    </td>
                    <td className="text-xs text-muted-foreground">{p.location}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {p.techStack.map((tech) => (
                          <span key={tech} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-foreground font-semibold">{p.email}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {p.confidenceScore}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
