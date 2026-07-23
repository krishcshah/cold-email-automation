"use client";

import { useState } from "react";
import { Mail, Send, Bot, ShieldCheck, Settings, Save, LucideIcon } from "lucide-react";

export interface ReachInboxOptionsState {
  stopOnReply: boolean;
  stopOnDomainReply: boolean;
  bounceProtection: boolean;
  bounceThreshold: number;
  smartTimeGaps: boolean;
  maxNewLeadsPerDay: number;
  prioritizeNewLeads: boolean;
  autoOptimizeAZ: boolean;
  insertUnsubscribeHeader: boolean;
  unsubscribeBehavior: "current" | "all";
  aiReplyAgentEnabled: boolean;
  textOnlyDelivery: boolean;
  providerMatching: boolean;
  strictProviderMatching: boolean;
  targetProviders: string[]; // ["google", "outlook", "others"]
  includeBlockquotes: boolean;
  positiveReplyNotification: boolean;
  notificationEmail: string;
  automatedOooReschedule: boolean;
  prospectValue: number;
  tags: string;
  ccEmails: string;
  bccEmails: string;
}

interface Props {
  options: ReachInboxOptionsState;
  onChange: (updated: ReachInboxOptionsState) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

interface OptionCategory {
  id: "email_accounts" | "sending_patterns" | "ai_reply_agent" | "deliverability" | "additional";
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export default function ReachInboxOptions({ options, onChange, onSave, isSaving }: Props) {
  const [activeCategory, setActiveCategory] = useState<
    "email_accounts" | "sending_patterns" | "ai_reply_agent" | "deliverability" | "additional"
  >("sending_patterns");

  function update<K extends keyof ReachInboxOptionsState>(key: K, val: ReachInboxOptionsState[K]) {
    onChange({ ...options, [key]: val });
  }

  function toggleTargetProvider(provider: string) {
    const current = options.targetProviders ?? ["google", "outlook", "others"];
    const updated = current.includes(provider)
      ? current.filter((p) => p !== provider)
      : [...current, provider];
    update("targetProviders", updated);
  }

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-semibold text-muted-foreground mb-1";

  const categories: OptionCategory[] = [
    { id: "email_accounts", label: "Email Settings", icon: Mail },
    { id: "sending_patterns", label: "Sending Patterns", icon: Send },
    { id: "ai_reply_agent", label: "AI Reply Agent", icon: Bot, badge: "New" },
    { id: "deliverability", label: "Deliverability", icon: ShieldCheck },
    { id: "additional", label: "Additional Options", icon: Settings },
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Category Side Navigation */}
      <div className="col-span-1 space-y-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-secondary text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </div>
              {cat.badge && (
                <span className="text-[9px] uppercase tracking-widest bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Options Panel */}
      <div className="col-span-3 space-y-6 glass rounded-xl p-6 border border-border">
        {/* Category: Sending Patterns */}
        {activeCategory === "sending_patterns" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Sending Patterns & Rules
            </h3>

            {/* Stop Sending Emails on Reply */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">Stop Sending Emails on Reply</p>
                <p className="text-xs text-muted-foreground">Stop sending emails to a lead if a response has been received.</p>
              </div>
              <div className="flex rounded-lg border border-border p-1 bg-background">
                <button
                  type="button"
                  onClick={() => update("stopOnReply", false)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${!options.stopOnReply ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  Disable
                </button>
                <button
                  type="button"
                  onClick={() => update("stopOnReply", true)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${options.stopOnReply ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Enable
                </button>
              </div>
            </div>

            {/* Stop Emailing on Domain Reply */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">Stop Emailing on Domain Reply</p>
                <p className="text-xs text-muted-foreground">Stop sending emails to a domain after receiving a reply from any lead within it (Common ESPs like Gmail/Outlook ignored).</p>
              </div>
              <div className="flex rounded-lg border border-border p-1 bg-background">
                <button
                  type="button"
                  onClick={() => update("stopOnDomainReply", false)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${!options.stopOnDomainReply ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  Disable
                </button>
                <button
                  type="button"
                  onClick={() => update("stopOnDomainReply", true)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${options.stopOnDomainReply ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Enable
                </button>
              </div>
            </div>

            {/* Bounce Protection */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-foreground">Bounce Protection</p>
                  <p className="text-xs text-muted-foreground">Automatically pauses campaign if the bounce rate exceeds threshold (triggers after first 50 emails).</p>
                </div>
                <div className="flex rounded-lg border border-border p-1 bg-background">
                  <button
                    type="button"
                    onClick={() => update("bounceProtection", false)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${!options.bounceProtection ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    Disable
                  </button>
                  <button
                    type="button"
                    onClick={() => update("bounceProtection", true)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${options.bounceProtection ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    Enable
                  </button>
                </div>
              </div>
              {options.bounceProtection && (
                <div className="pt-2 border-t border-border/50 max-w-xs">
                  <label className={labelClass}>Bounce Protection Threshold (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={options.bounceThreshold}
                      onChange={(e) => update("bounceThreshold", Number(e.target.value))}
                      className={inputClass}
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Time Gaps */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">Smart Time Gaps</p>
                <p className="text-xs text-muted-foreground">Automatically spread campaign emails across schedule to avoid spam filters.</p>
              </div>
              <div className="flex rounded-lg border border-border p-1 bg-background">
                <button
                  type="button"
                  onClick={() => update("smartTimeGaps", false)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${!options.smartTimeGaps ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  Disable
                </button>
                <button
                  type="button"
                  onClick={() => update("smartTimeGaps", true)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${options.smartTimeGaps ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Enable
                </button>
              </div>
            </div>

            {/* Max New Leads & Priorities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Max New Leads Per Day</label>
                <input
                  type="number"
                  value={options.maxNewLeadsPerDay}
                  onChange={(e) => update("maxNewLeadsPerDay", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 pt-5">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.prioritizeNewLeads}
                    onChange={(e) => update("prioritizeNewLeads", e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>Prioritize new leads over follow-ups</span>
                </label>
              </div>
            </div>

            {/* Unsubscribe Header & Behavior */}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-foreground">Insert Unsubscribe Header</p>
                  <p className="text-[10px] text-muted-foreground">RFC-8058 one-click header</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.insertUnsubscribeHeader}
                  onChange={(e) => update("insertUnsubscribeHeader", e.target.checked)}
                  className="rounded border-border text-primary"
                />
              </div>
              <div>
                <label className={labelClass}>Unsubscribe Leads Behavior</label>
                <select
                  value={options.unsubscribeBehavior}
                  onChange={(e) => update("unsubscribeBehavior", e.target.value as "current" | "all")}
                  className={inputClass}
                >
                  <option value="current">Remove from Current Campaign Only</option>
                  <option value="all">Remove from All Campaigns (Global Suppression)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Category: AI Reply Agent */}
        {activeCategory === "ai_reply_agent" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" /> AI Reply Agent (Autopilot Inbox)
            </h3>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-foreground">Enable AI Reply Agent for this Campaign</p>
                  <p className="text-xs text-muted-foreground mt-0.5">AI auto-drafts personalized replies for interested leads using your business context — simply review and approve.</p>
                </div>
                <div className="flex rounded-lg border border-border p-1 bg-background">
                  <button
                    type="button"
                    onClick={() => update("aiReplyAgentEnabled", false)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${!options.aiReplyAgentEnabled ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    Disable
                  </button>
                  <button
                    type="button"
                    onClick={() => update("aiReplyAgentEnabled", true)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${options.aiReplyAgentEnabled ? "bg-purple-600 text-white" : "text-muted-foreground"}`}
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category: Deliverability */}
        {activeCategory === "deliverability" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Deliverability & Optimization
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">Delivery Optimization (Text-Only)</p>
                  <p className="text-xs text-muted-foreground">Disables HTML and open/click tracking pixels for maximum inbox placement.</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.textOnlyDelivery}
                  onChange={(e) => update("textOnlyDelivery", e.target.checked)}
                  className="rounded border-border text-primary w-4 h-4"
                />
              </div>

              <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">Include Blockquotes in Follow-ups</p>
                  <p className="text-xs text-muted-foreground">Includes thread history in follow-up emails.</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeBlockquotes}
                  onChange={(e) => update("includeBlockquotes", e.target.checked)}
                  className="rounded border-border text-primary w-4 h-4"
                />
              </div>
            </div>

            {/* Provider Matching */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-4">
              <div>
                <p className="font-bold text-sm text-foreground">Provider Matching</p>
                <p className="text-xs text-muted-foreground">Match your lead&apos;s email provider with your mailbox provider (Outlook to Outlook, Google to Google).</p>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.providerMatching}
                    onChange={(e) => update("providerMatching", e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>Enable Provider Matching</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.strictProviderMatching}
                    onChange={(e) => update("strictProviderMatching", e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>Enable Strict Provider Matching</span>
                </label>
              </div>

              <div className="pt-2">
                <label className={labelClass}>Select Target Providers</label>
                <div className="flex gap-3">
                  {["google", "outlook", "others"].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => toggleTargetProvider(provider)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                        (options.targetProviders ?? []).includes(provider)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Positive Reply Notification */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">Positive Reply Email Notification</p>
                  <p className="text-xs text-muted-foreground">Receive real-time notification email for interested replies.</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.positiveReplyNotification}
                  onChange={(e) => update("positiveReplyNotification", e.target.checked)}
                  className="rounded border-border text-primary w-4 h-4"
                />
              </div>

              {options.positiveReplyNotification && (
                <div>
                  <label className={labelClass}>Notification Email Address</label>
                  <input
                    type="email"
                    placeholder="your.email@company.com"
                    value={options.notificationEmail}
                    onChange={(e) => update("notificationEmail", e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category: Additional Options */}
        {activeCategory === "additional" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" /> Additional Campaign Options
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Specify Prospect Value ($)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={options.prospectValue}
                  onChange={(e) => update("prospectValue", Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Custom Tags (comma-separated)</label>
                <input
                  placeholder="IT, SaaS, Outbound"
                  value={options.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>CC Recipients (comma-separated)</label>
                <input
                  placeholder="team@company.com"
                  value={options.ccEmails}
                  onChange={(e) => update("ccEmails", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>BCC Recipients (comma-separated)</label>
                <input
                  placeholder="audit@company.com"
                  value={options.bccEmails}
                  onChange={(e) => update("bccEmails", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        {onSave && (
          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving Options..." : "Save Options"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
