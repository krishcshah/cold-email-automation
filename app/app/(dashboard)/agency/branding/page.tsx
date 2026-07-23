"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Palette, Globe } from "lucide-react";

export default function WhiteLabelBrandingPage() {
  const [customDomain, setCustomDomain] = useState("app.clientagency.com");
  const [companyName, setCompanyName] = useState("Apex Growth Agency");
  const [logoUrl, setLogoUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100");
  const [primaryColor, setPrimaryColor] = useState("#0284c7");
  const [supportEmail, setSupportEmail] = useState("support@clientagency.com");
  const [removeBranding, setRemoveBranding] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    alert("White-Label branding settings saved successfully!");
    setSaving(false);
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agency" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">White-Label Branding Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Customize OutreachPro domain, logos, primary accent color, and remove platform watermarks</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Custom Domain Section */}
        <div className="glass rounded-xl p-6 border border-border space-y-4">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Custom Domain (CNAME Record)
          </h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Agency Subdomain / Custom Domain *</label>
              <input className={inputClass} placeholder="app.youragency.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} required />
            </div>
            <div className="p-3 rounded-lg bg-secondary/60 border border-border text-xs space-y-1">
              <p className="font-semibold text-foreground">DNS CNAME Instructions:</p>
              <p className="text-muted-foreground">Add a CNAME record pointing <code className="text-primary font-mono">{customDomain}</code> to <code className="text-emerald-400 font-mono">cname.outreachpro.app</code>.</p>
            </div>
          </div>
        </div>

        {/* Visual Styling & Theme Section */}
        <div className="glass rounded-xl p-6 border border-border space-y-4">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Agency Branding & Color Theme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Agency Company Name *</label>
              <input className={inputClass} placeholder="Apex Growth Agency" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Support Email Address</label>
              <input className={inputClass} placeholder="support@youragency.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Logo URL (PNG / SVG)</label>
              <input className={inputClass} placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Primary Color Accent (Hex)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border bg-transparent" />
                <input className={inputClass} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-foreground">Remove Platform Branding</p>
              <p className="text-xs text-muted-foreground">Removes &quot;Powered by OutreachPro&quot; footer watermarks from all client portals and system emails.</p>
            </div>
            <input
              type="checkbox"
              checked={removeBranding}
              onChange={(e) => setRemoveBranding(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50">
            {saving ? "Saving Settings..." : "Save White-Label Branding"}
          </button>
        </div>
      </form>
    </div>
  );
}
