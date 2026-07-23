"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Users, Trash2, Upload, ChevronRight } from "lucide-react";

interface LeadList {
  id: string;
  name: string;
  leadCount: number;
  createdAt: string;
}

export default function LeadsPage() {
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [listName, setListName] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data.slice(0, 5));
        setPreviewHeaders(results.meta.fields ?? []);
        setShowForm(true);
      },
    });
  }

  async function handleSave() {
    if (!listName.trim()) { setError("Please enter a list name"); return; }
    if (previewData.length === 0) { setError("No leads found in CSV"); return; }

    setSaving(true);
    setError("");

    // Re-parse full file
    const file = fileRef.current?.files?.[0];
    if (!file) { setSaving(false); return; }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: listName, leads: results.data }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); return; }
        setShowForm(false);
        setListName("");
        setPreviewData([]);
        setPreviewHeaders([]);
        if (fileRef.current) fileRef.current.value = "";
        load();
        setSaving(false);
      },
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead list and all its leads?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
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

      {/* Upload + Preview Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">New Lead List</h2>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">List Name *</label>
            <input
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all max-w-xs"
              placeholder="e.g. SaaS Founders Q1"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>

          {/* Preview table */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Preview (first 5 rows of {previewData.length > 0 ? "your CSV" : "no data"})
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    {previewHeaders.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      {previewHeaders.map((h) => (
                        <td key={h} className="max-w-[150px] truncate">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Detected {previewHeaders.length} columns.{" "}
              <span className="text-primary font-medium">Required:</span> email |{" "}
              <span className="text-muted-foreground">Optional:</span> first_name, last_name, company, title, phone, website
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50">
              {saving ? "Saving..." : "Save Lead List"}
            </button>
            <button onClick={() => { setShowForm(false); setPreviewData([]); if (fileRef.current) fileRef.current.value = ""; }} className="border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground text-sm px-5 py-2 rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lists */}
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

      {/* CSV hint */}
      <div className="bg-accent/50 rounded-lg px-4 py-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">CSV Format:</span>{" "}
        email (required), first_name, last_name, company, title, phone, website — plus any custom columns
      </div>
    </div>
  );
}
