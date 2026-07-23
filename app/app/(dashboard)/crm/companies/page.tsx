"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, Users, ChevronRight } from "lucide-react";

interface ContactSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  title?: string;
}

interface CompanyGroup {
  company: string;
  contactCount: number;
  totalDealValue: number;
  contacts: ContactSummary[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/companies")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/crm" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Groupings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Aggregate deal pipeline value and contacts per organization</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Building2 className="w-8 h-8" />
          <p>No companies found in your CRM.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((c) => (
            <div key={c.company} className="glass rounded-xl p-5 border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">{c.company}</h3>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${c.totalDealValue.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.contactCount} Contact{c.contactCount !== 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-1 pt-1">
                {c.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/crm/contacts/${contact.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 hover:bg-primary/10 text-xs text-foreground font-medium transition-colors"
                  >
                    <span>{contact.firstName ? `${contact.firstName} ${contact.lastName || ""}` : contact.email} ({contact.title || "Member"})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
