"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Users, Trash2, Upload, ChevronRight, Check, Tag } from "lucide-react";

interface LeadList {
  id: string;
  name: string;
  leadCount: number;
  createdAt: string;
}

type TargetFieldType =
  | "email"
  | "firstName"
  | "lastName"
  | "fullName"
  | "company"
  | "title"
  | "phone"
  | "website"
  | "city"
  | "custom"
  | "ignore";

interface ColumnMapping {
  header: string;
  targetField: TargetFieldType;
  customTagKey: string;
}

export default function LeadsPage() {
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [listName, setListName] = useState("");
  
  // CSV Raw Data & Mappings State
  const [rawCsvRows, setRawCsvRows] = useState<Record<string, string>[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLists(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function autoDetectField(header: string): TargetFieldType {
    const clean = header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean === "email" || clean === "mail" || clean.includes("emailaddress")) return "email";
    if (clean === "firstname" || clean === "fname" || clean === "givenname") return "firstName";
    if (clean === "lastname" || clean === "lname" || clean === "surname" || clean === "familyname") return "lastName";
    if (clean === "name" || clean === "fullname" || clean === "contactname") return "fullName";
    if (clean === "company" || clean === "companyname" || clean === "organization" || clean === "org") return "company";
    if (clean === "title" || clean === "jobtitle" || clean === "role" || clean === "position") return "title";
    if (clean === "phone" || clean === "mobile" || clean === "phonenumber" || clean === "telephone") return "phone";
    if (clean === "website" || clean === "url" || clean === "domain" || clean === "site") return "website";
    if (clean === "city" || clean === "location" || clean === "town") return "city";
    return "custom";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setListName(file.name.replace(/\.[^/.]+$/, ""));

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const headers = results.meta.fields ?? [];
        setRawCsvRows(rows);
        setColumnHeaders(headers);

        // Build initial column mappings
        const initialMappings: ColumnMapping[] = headers.map((h) => {
          const detected = autoDetectField(h);
          return {
            header: h,
            targetField: detected,
            customTagKey: detected === "custom" ? h.toLowerCase().replace(/[^a-z0-9_]/g, "_") : "",
          };
        });

        setMappings(initialMappings);
        setShowForm(true);
      },
    });
  }

  function updateMappingField(index: number, target: TargetFieldType) {
    setMappings((prev) =>
      prev.map((m, idx) => {
        if (idx !== index) return m;
        return {
          ...m,
          targetField: target,
          customTagKey: target === "custom" && !m.customTagKey ? m.header.toLowerCase().replace(/[^a-z0-9_]/g, "_") : m.customTagKey,
        };
      })
    );
  }

  function updateCustomTagKey(index: number, keyName: string) {
    setMappings((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, customTagKey: keyName } : m))
    );
  }

  async function handleSave() {
    if (!listName.trim()) { setError("Please enter a list name"); return; }
    if (rawCsvRows.length === 0) { setError("No leads found in CSV"); return; }

    const emailMapping = mappings.find((m) => m.targetField === "email");
    if (!emailMapping) {
      setError("Please designate one column as 'Email (Required)'");
      return;
    }

    setSaving(true);
    setError("");

    // Transform raw CSV rows according to user's column mappings
    const formattedLeads = rawCsvRows.map((row) => {
      let email = "";
      let firstName: string | undefined = undefined;
      let lastName: string | undefined = undefined;
      let company: string | undefined = undefined;
      let title: string | undefined = undefined;
      let phone: string | undefined = undefined;
      let website: string | undefined = undefined;
      const customFields: Record<string, string> = {};

      mappings.forEach((m) => {
        const val = row[m.header]?.trim();
        if (!val || m.targetField === "ignore") return;

        if (m.targetField === "email") email = val;
        else if (m.targetField === "firstName") firstName = val;
        else if (m.targetField === "lastName") lastName = val;
        else if (m.targetField === "fullName") {
          const parts = val.split(" ");
          firstName = parts[0];
          lastName = parts.slice(1).join(" ") || undefined;
        } else if (m.targetField === "company") company = val;
        else if (m.targetField === "title") title = val;
        else if (m.targetField === "phone") phone = val;
        else if (m.targetField === "website") website = val;
        else if (m.targetField === "city") customFields["city"] = val;
        else if (m.targetField === "custom") {
          const key = m.customTagKey.trim() || m.header.toLowerCase().replace(/[^a-z0-9_]/g, "_");
          customFields[key] = val;
        }
      });

      return { email, firstName, lastName, company, title, phone, website, customFields };
    });

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: listName, leads: formattedLeads }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }

    setShowForm(false);
    setListName("");
    setRawCsvRows([]);
    setColumnHeaders([]);
    setMappings([]);
    if (fileRef.current) fileRef.current.value = "";
    load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead list and all its leads?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  const sampleRows = rawCsvRows.slice(0, 3);
  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Lists</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Upload and manage your prospect lists</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" id="lead-csv-input" onChange={handleFileChange} />
          <button
            id="upload-leads-btn"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Upload + Interactive Column Mapping Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 space-y-6 border border-border">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-semibold text-foreground text-lg">Map CSV Columns & Custom Tags</h2>
              <p className="text-xs text-muted-foreground">Specify what each CSV column represents before importing {rawCsvRows.length.toLocaleString()} leads.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Lead List Name *</label>
            <input
              className={`${inputClass} max-w-md`}
              placeholder="e.g. SaaS Founders Q1"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>

          {/* Column Mapping Table */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" /> Map Columns & Set Custom Fields ({columnHeaders.length} Columns Detected)
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="data-table text-xs w-full">
                <thead>
                  <tr className="bg-secondary/60">
                    <th className="w-1/4">CSV Column Header</th>
                    <th className="w-1/3">Sample Values (Top 3 Rows)</th>
                    <th className="w-5/12">Map To Field / Custom Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, idx) => (
                    <tr key={m.header} className="border-b border-border/50 hover:bg-secondary/20">
                      <td>
                        <span className="font-bold text-foreground font-mono bg-secondary px-2.5 py-1 rounded border border-border">
                          {m.header}
                        </span>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {sampleRows.map((r, i) => (
                            <p key={i} className="text-muted-foreground truncate max-w-[220px] italic">
                              {r[m.header] || <span className="opacity-40">&lt;empty&gt;</span>}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-2">
                          <select
                            value={m.targetField}
                            onChange={(e) => updateMappingField(idx, e.target.value as TargetFieldType)}
                            className={`${inputClass} font-semibold ${m.targetField === "ignore" ? "text-muted-foreground bg-secondary/50" : "text-foreground"}`}
                          >
                            <option value="email">✉️ Email (Required)</option>
                            <option value="firstName">👤 First Name</option>
                            <option value="lastName">👤 Last Name</option>
                            <option value="fullName">👤 Full Name (Auto-split)</option>
                            <option value="company">🏢 Company Name</option>
                            <option value="title">💼 Job Title</option>
                            <option value="phone">📞 Phone Number</option>
                            <option value="website">🌐 Website / URL</option>
                            <option value="city">📍 City / Location</option>
                            <option value="custom">🏷️ Custom Tag / Field</option>
                            <option value="ignore">🚫 Do Not Import (Ignore Column)</option>
                          </select>

                          {m.targetField === "custom" && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-mono">Tag Key:</span>
                              <input
                                type="text"
                                placeholder="e.g. industry, employee_count"
                                value={m.customTagKey}
                                onChange={(e) => updateCustomTagKey(idx, e.target.value)}
                                className="bg-background border border-border rounded px-2.5 py-1 text-xs text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => { setShowForm(false); setRawCsvRows([]); setMappings([]); if (fileRef.current) fileRef.current.value = ""; }} className="border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground text-sm px-5 py-2.5 rounded-lg transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {saving ? "Importing Leads..." : `Import ${rawCsvRows.length.toLocaleString()} Leads`}
            </button>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">No lead lists yet</p>
          <p className="text-muted-foreground text-sm max-w-xs text-center">Upload a CSV file with your prospects to get started</p>
          <button onClick={() => fileRef.current?.click()} className="text-primary text-sm font-medium hover:underline mt-1">
            Upload your first CSV →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="glass rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <button onClick={() => handleDelete(list.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-foreground">{list.name}</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {list.leadCount.toLocaleString()} lead{list.leadCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {new Date(list.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/leads/${list.id}`}
                  className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                >
                  View leads <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
