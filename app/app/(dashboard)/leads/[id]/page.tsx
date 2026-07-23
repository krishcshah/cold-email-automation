"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";

interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  website?: string;
  status: string;
  customFields?: Record<string, string>;
}

interface ListMeta {
  id: string;
  name: string;
  leadCount: number;
}

interface ValidationReport {
  total: number;
  valid: number;
  invalid: number;
  validPercentage: number;
}

export default function LeadListDetailPage() {
  const params = useParams();
  const listId = params.id as string;

  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [valReport, setValReport] = useState<ValidationReport | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const [metaRes, leadsRes] = await Promise.all([
      fetch(`/api/leads/${listId}`),
      fetch(`/api/leads/${listId}/leads?page=${p}&limit=50`),
    ]);
    const metaData = await metaRes.json();
    const leadsData = await leadsRes.json();
    setMeta(metaData);
    setLeads(leadsData.leads ?? []);
    setTotal(leadsData.total ?? 0);
    setLoading(false);
  }, [listId]);

  useEffect(() => { load(page); }, [load, page]);

  async function handleValidateList() {
    setValidating(true);
    const res = await fetch(`/api/leads/${listId}/validate`, { method: "POST" });
    const data = await res.json();
    setValReport(data);
    setValidating(false);
    load(page); // refresh leads list to see updated status
  }

  const customKeys = leads.length > 0
    ? Object.keys(leads[0].customFields ?? {})
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{meta?.name ?? "Lead List"}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{total.toLocaleString()} leads</p>
          </div>
        </div>
        <button
          onClick={handleValidateList}
          disabled={validating || total === 0}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          {validating ? "Validating MX & Syntax..." : "Validate Emails"}
        </button>
      </div>

      {valReport && (
        <div className="glass rounded-xl p-4 flex items-center justify-between border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Validation Results</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {valReport.valid} valid emails ({valReport.validPercentage}%) • {valReport.invalid} invalid/bounced emails automatically flagged
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-20">
          <Users className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No leads in this list</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table whitespace-nowrap">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Status</th>
                  {customKeys.map((k) => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-medium text-foreground">{lead.email}</td>
                    <td className="text-muted-foreground">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="text-muted-foreground">{lead.company || "—"}</td>
                    <td className="text-muted-foreground">{lead.title || "—"}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lead.status === "active" ? "status-active" : "status-error"}`}>
                        {lead.status}
                      </span>
                    </td>
                    {customKeys.map((k) => (
                      <td key={k} className="text-muted-foreground max-w-[120px] truncate">
                        {lead.customFields?.[k] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-40 hover:border-primary/50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 50 >= total}
                  className="px-3 py-1 text-xs border border-border rounded-lg disabled:opacity-40 hover:border-primary/50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
