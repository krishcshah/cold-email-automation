"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShieldCheck, Check } from "lucide-react";
import { checkSpamScore, SpamCheckResult } from "@/lib/deliverability/spamChecker";
import ReachInboxOptions, { ReachInboxOptionsState } from "@/components/campaign/ReachInboxOptions";

interface SequenceStep {
  subject: string;
  body: string;
  delayDays: number;
  condition: "always" | "if_opened" | "if_not_opened" | "if_clicked";
}

interface LeadList { id: string; name: string; leadCount: number; }
interface EmailAccount { id: string; fromEmail: string; fromName: string; }

const VARIABLES = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{company}}", "{{title}}"];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore",
  "Australia/Sydney",
];

const DEFAULT_OPTIONS: ReachInboxOptionsState = {
  stopOnReply: true,
  stopOnDomainReply: false,
  bounceProtection: true,
  bounceThreshold: 10,
  smartTimeGaps: true,
  maxNewLeadsPerDay: 500,
  prioritizeNewLeads: false,
  autoOptimizeAZ: false,
  insertUnsubscribeHeader: true,
  unsubscribeBehavior: "all",
  aiReplyAgentEnabled: false,
  textOnlyDelivery: false,
  providerMatching: false,
  strictProviderMatching: false,
  targetProviders: ["google", "outlook", "others"],
  includeBlockquotes: true,
  positiveReplyNotification: false,
  notificationEmail: "",
  automatedOooReschedule: true,
  prospectValue: 500,
  tags: "",
  ccEmails: "",
  bccEmails: "",
};

export default function NewCampaignPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [leadListId, setLeadListId] = useState("");
  const [emailAccountIds, setEmailAccountIds] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [sendSchedule, setSendSchedule] = useState({
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 9,
    endHour: 17,
    timezone: "UTC",
  });

  const [steps, setSteps] = useState<SequenceStep[]>([
    { subject: "", body: "", delayDays: 0, condition: "always" },
  ]);

  const [reachInboxOpts, setReachInboxOpts] = useState<ReachInboxOptionsState>(DEFAULT_OPTIONS);

  const [availableLists, setAvailableLists] = useState<LeadList[]>([]);
  const [availableSenders, setAvailableSenders] = useState<EmailAccount[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"sequence" | "schedule" | "options">("sequence");

  // Live Spam Score Check
  const [spamCheck, setSpamCheck] = useState<SpamCheckResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leads"),
      fetch("/api/email-accounts"),
    ])
      .then(async ([lr, er]) => {
        const lists = lr.ok ? await lr.json() : [];
        const accounts = er.ok ? await er.json() : [];
        return [lists, accounts];
      })
      .then(([lists, accounts]) => {
        setAvailableLists(Array.isArray(lists) ? lists : []);
        setAvailableSenders(Array.isArray(accounts) ? accounts : []);
      })
      .catch((err) => console.error("Error loading campaign resources:", err));
  }, []);

  useEffect(() => {
    const current = steps[activeStep];
    if (current) {
      setSpamCheck(checkSpamScore(current.subject, current.body));
    }
  }, [steps, activeStep]);

  function addStep() {
    setSteps([...steps, { subject: "", body: "", delayDays: 2, condition: "always" }]);
    setActiveStep(steps.length);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    setActiveStep(Math.max(0, index - 1));
  }

  function updateStep(index: number, field: keyof SequenceStep, val: unknown) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  }

  function insertVariable(varName: string) {
    const active = steps[activeStep];
    if (!active) return;
    updateStep(activeStep, "body", active.body + " " + varName);
  }

  function toggleSender(id: string) {
    setEmailAccountIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleDay(day: number) {
    setSendSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort(),
    }));
  }

  async function handleSave() {
    if (!name.trim()) { setError("Campaign name is required"); return; }
    if (!leadListId) { setError("Please select a lead list"); return; }
    if (emailAccountIds.length === 0) { setError("Please select at least one sender account"); return; }
    if (steps.some(s => !s.subject.trim() || !s.body.trim())) {
      setError("All steps must have a subject and body");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        leadListId,
        emailAccountIds,
        dailyLimit,
        trackOpens,
        trackClicks,
        sendSchedule,
        steps,
        ...reachInboxOpts,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }

    router.push(`/campaigns/${data.id}`);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  const currentStep = steps[activeStep];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Campaign</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Build sequence, schedule, and ReachInbox campaign options</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="border border-border text-muted-foreground hover:text-foreground text-sm px-4 py-2 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {saving ? "Launching..." : "Save & Launch Campaign →"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Campaign Name & Basics */}
      <div className="glass rounded-xl p-6 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className={labelClass}>Campaign Name *</label>
          <input className={inputClass} placeholder="e.g. IT COMPANIES" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Lead List *</label>
          <select className={inputClass} value={leadListId} onChange={e => setLeadListId(e.target.value)}>
            <option value="">Select a lead list...</option>
            {availableLists.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.leadCount} leads)</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sender Email Accounts *</label>
          <div className="relative">
            <div className="border border-border bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground flex justify-between items-center cursor-pointer">
              <span>{emailAccountIds.length === 0 ? "Select senders..." : `${emailAccountIds.length} selected`}</span>
            </div>
            {availableSenders.length > 0 && (
              <div className="mt-1 space-y-1 bg-card border border-border rounded-lg p-2 max-h-36 overflow-y-auto">
                {availableSenders.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-accent/50 p-1 rounded">
                    <input type="checkbox" checked={emailAccountIds.includes(s.id)} onChange={() => toggleSender(s.id)} className="rounded border-border text-primary" />
                    <span>{s.fromName} ({s.fromEmail})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Campaign Tabs */}
      <div className="flex border-b border-border">
        <button onClick={() => setTab("sequence")} className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "sequence" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Sequences ({steps.length})
        </button>
        <button onClick={() => setTab("schedule")} className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "schedule" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Schedule
        </button>
        <button onClick={() => setTab("options")} className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "options" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Options
        </button>
      </div>

      {/* Tab Content: Sequences */}
      {tab === "sequence" && (
        <div className="grid grid-cols-4 gap-6">
          {/* Step list sidebar */}
          <div className="col-span-1 space-y-2">
            {steps.map((s, idx) => (
              <div key={idx} onClick={() => setActiveStep(idx)} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeStep === idx ? "border-primary bg-primary/10 text-foreground" : "border-border glass text-muted-foreground hover:border-primary/40"}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Step {idx + 1} {idx === 0 ? "(Initial)" : `(+${s.delayDays}d)`}</span>
                  {steps.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeStep(idx); }} className="hover:text-destructive p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs truncate font-medium text-foreground mt-1">{s.subject || "(No subject)"}</p>
              </div>
            ))}

            <button onClick={addStep} className="w-full flex items-center justify-center gap-1.5 border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-xs py-2.5 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Add Follow-up Step
            </button>
          </div>

          {/* Editor */}
          {currentStep && (
            <div className="col-span-3 space-y-4 glass rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Editing Step {activeStep + 1}</h3>
                {activeStep > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Wait</span>
                    <input type="number" min={1} value={currentStep.delayDays} onChange={e => updateStep(activeStep, "delayDays", Number(e.target.value))} className="w-16 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground text-center" />
                    <span className="text-xs text-muted-foreground">days before sending</span>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Subject Line *</label>
                <input className={inputClass} placeholder="e.g. Quick question regarding {{company}}" value={currentStep.subject} onChange={e => updateStep(activeStep, "subject", e.target.value)} />
              </div>

              {/* Variables toolbar */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Insert Variable:</span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map(v => (
                    <button key={v} type="button" onClick={() => insertVariable(v)} className="text-xs font-mono bg-secondary hover:bg-primary/20 text-foreground hover:text-primary border border-border px-2 py-0.5 rounded transition-all">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body textarea */}
              <div>
                <label className={labelClass}>Email Body *</label>
                <textarea rows={8} className={`${inputClass} font-sans leading-relaxed`} placeholder="Hi {{first_name}},\n\nI noticed that {{company}} is growing..." value={currentStep.body} onChange={e => updateStep(activeStep, "body", e.target.value)} />
              </div>

              {/* Live Deliverability & Spam Score Indicator */}
              {spamCheck && (
                <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-foreground">Spam Score & Deliverability Health:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${spamCheck.score >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {spamCheck.score}/100 ({spamCheck.rating})
                    </span>
                  </div>
                  {spamCheck.triggers.length > 0 && (
                    <span className="text-xs text-red-400 font-mono">
                      {spamCheck.triggers.length} trigger word{spamCheck.triggers.length !== 1 ? "s" : ""} found
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Schedule */}
      {tab === "schedule" && (
        <div className="glass rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Max Daily Sends Per Account</label>
              <input type="number" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} className={inputClass} />
            </div>
            <div className="space-y-2 pt-4">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={trackOpens} onChange={e => setTrackOpens(e.target.checked)} className="rounded border-border text-primary" />
                <span>Track Email Opens (1x1 tracking pixel)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={trackClicks} onChange={e => setTrackClicks(e.target.checked)} className="rounded border-border text-primary" />
                <span>Track Link Clicks (Redirect tracking)</span>
              </label>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Sending Days & Hours</h4>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, idx) => (
                <button key={label} type="button" onClick={() => toggleDay(idx)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sendSchedule.days.includes(idx) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className={labelClass}>Start Hour (24h)</label>
                <input type="number" min={0} max={23} value={sendSchedule.startHour} onChange={e => setSendSchedule(s => ({ ...s, startHour: Number(e.target.value) }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Hour (24h)</label>
                <input type="number" min={0} max={23} value={sendSchedule.endHour} onChange={e => setSendSchedule(s => ({ ...s, endHour: Number(e.target.value) }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <select value={sendSchedule.timezone} onChange={e => setSendSchedule(s => ({ ...s, timezone: e.target.value }))} className={inputClass}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Options (ReachInbox Options) */}
      {tab === "options" && (
        <ReachInboxOptions
          options={reachInboxOpts}
          onChange={(updated) => setReachInboxOpts(updated)}
        />
      )}
    </div>
  );
}
