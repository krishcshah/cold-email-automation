"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShieldCheck, Sparkles, Shuffle } from "lucide-react";
import { checkSpamScore, SpamCheckResult } from "@/lib/deliverability/spamChecker";

interface SequenceStep {
  subject: string;
  body: string;
  delayDays: number;
  channel: "email" | "linkedin_connect" | "linkedin_message" | "linkedin_view" | "sms" | "call_task";
  condition: "always" | "if_opened" | "if_not_opened" | "if_clicked";
}

interface LeadList { id: string; name: string; leadCount: number; }
interface EmailAccount { id: string; fromEmail: string; fromName: string; }

const VARIABLES = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{company}}", "{{title}}"];

export default function NewCampaignPage() {
  const router = useRouter();

  // Campaign meta
  const [name, setName] = useState("");
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [selectedSenders, setSelectedSenders] = useState<string[]>([]);
  const [availableLists, setAvailableLists] = useState<LeadList[]>([]);
  const [availableSenders, setAvailableSenders] = useState<EmailAccount[]>([]);

  // Sequence
  const [steps, setSteps] = useState<SequenceStep[]>([
    { subject: "", body: "", delayDays: 0, channel: "email", condition: "always" },
  ]);
  const [activeStep, setActiveStep] = useState(0);

  // AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoal, setAiGoal] = useState("Schedule a quick intro call");
  const [aiPersona, setAiPersona] = useState("SaaS Founders & CEOs");
  const [aiTone, setAiTone] = useState("professional");
  const [aiSubjects, setAiSubjects] = useState<string[]>([]);
  const [aiBodyResult, setAiBodyResult] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Sending settings
  const [dailyLimit, setDailyLimit] = useState(50);
  const [minDelay, setMinDelay] = useState(60);
  const [maxDelay, setMaxDelay] = useState(180);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"sequence" | "settings">("sequence");

  // Live Spam Score Check
  const [spamCheck, setSpamCheck] = useState<SpamCheckResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leads"),
      fetch("/api/email-accounts"),
    ])
      .then(([lr, er]) => Promise.all([lr.json(), er.json()]))
      .then(([lists, accounts]) => {
        setAvailableLists(lists);
        setAvailableSenders(accounts);
      });
  }, []);

  useEffect(() => {
    const current = steps[activeStep];
    if (current && current.channel === "email") {
      setSpamCheck(checkSpamScore(current.subject, current.body));
    } else {
      setSpamCheck(null);
    }
  }, [steps, activeStep]);

  function addStep() {
    setSteps([...steps, { subject: "", body: "", delayDays: 2, channel: "email", condition: "always" }]);
    setActiveStep(steps.length);
  }

  function removeStep(i: number) {
    if (steps.length === 1) return;
    const newSteps = steps.filter((_, idx) => idx !== i);
    setSteps(newSteps);
    setActiveStep(Math.min(activeStep, newSteps.length - 1));
  }

  function updateStep(i: number, field: keyof SequenceStep, value: unknown) {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function insertVariable(variable: string) {
    const step = steps[activeStep];
    updateStep(activeStep, "body", step.body + variable);
  }

  async function convertBodyToSpintax() {
    const step = steps[activeStep];
    if (!step.body) return;
    const res = await fetch("/api/ai/spintax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: step.body }),
    });
    const data = await res.json();
    if (data.spintax) {
      updateStep(activeStep, "body", data.spintax);
    }
  }

  async function handleGenerateAi() {
    setGeneratingAi(true);
    const [subjRes, bodyRes] = await Promise.all([
      fetch("/api/ai/generate-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: aiGoal, persona: aiPersona }),
      }),
      fetch("/api/ai/generate-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: aiGoal, persona: aiPersona, tone: aiTone }),
      }),
    ]);
    const subjData = await subjRes.json();
    const bodyData = await bodyRes.json();
    setAiSubjects(subjData.subjects ?? []);
    setAiBodyResult(bodyData.body ?? "");
    setGeneratingAi(false);
  }

  function applyAiDraft(subj: string) {
    updateStep(activeStep, "subject", subj);
    if (aiBodyResult) updateStep(activeStep, "body", aiBodyResult);
    setShowAiModal(false);
  }

  async function handleSave(launch = false) {
    if (!name.trim()) { setError("Campaign name is required"); return; }
    if (steps.some((s) => s.channel === "email" && !s.subject.trim())) { setError("Email steps need a subject line"); return; }
    if (steps.some((s) => !s.body.trim() && s.channel !== "linkedin_view")) { setError("All message steps need copy/instructions"); return; }

    setSaving(true);
    setError("");

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, leadListIds: selectedLists, senderIds: selectedSenders,
        steps, dailyLimit, minDelaySecs: minDelay, maxDelaySecs: maxDelay,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }

    if (launch) {
      await fetch(`/api/campaigns/${data.id}/launch`, { method: "POST" });
    }

    router.push("/campaigns");
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">New Campaign</h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Campaign Name */}
      <div className="glass rounded-xl p-5">
        <label className={labelClass}>Campaign Name *</label>
        <input className={inputClass + " max-w-md"} placeholder="e.g. Multichannel Outreach Campaign Q2" value={name} onChange={(e) => setName(e.target.value)} id="campaign-name" />
      </div>

      {/* Lead Lists */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-3">Lead Lists</h2>
        {availableLists.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lead lists yet. <a href="/leads" className="text-primary hover:underline">Upload one first →</a></p>
        ) : (
          <div className="space-y-2">
            {availableLists.map((list) => (
              <label key={list.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedLists.includes(list.id)}
                  onChange={(e) => setSelectedLists(e.target.checked ? [...selectedLists, list.id] : selectedLists.filter(id => id !== list.id))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {list.name} <span className="text-muted-foreground">({list.leadCount.toLocaleString()} leads)</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sender Accounts */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-3">Sender Accounts</h2>
        {availableSenders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sender accounts yet. <a href="/email-accounts" className="text-primary hover:underline">Add one first →</a></p>
        ) : (
          <div className="space-y-2">
            {availableSenders.map((sender) => (
              <label key={sender.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSenders.includes(sender.id)}
                  onChange={(e) => setSelectedSenders(e.target.checked ? [...selectedSenders, sender.id] : selectedSenders.filter(id => id !== sender.id))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {sender.fromName} <span className="text-muted-foreground">&lt;{sender.fromEmail}&gt;</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tabs: Sequence | Settings */}
      <div>
        <div className="flex border-b border-border mb-4 gap-1">
          {(["sequence", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "sequence" ? "Multichannel Sequence" : "Sending Settings"}
            </button>
          ))}
        </div>

        {/* Sequence Builder */}
        {tab === "sequence" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex">
              {/* Step list */}
              <div className="w-56 border-r border-border flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</p>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> AI Writer
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {steps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`w-full flex items-center gap-2 px-3 py-3 text-left text-sm transition-colors border-b border-border/50 ${activeStep === i ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${activeStep === i ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{step.subject || `${step.channel.replace("_", " ").toUpperCase()} Step`}</p>
                        <p className="text-[10px] opacity-70 uppercase tracking-wider text-primary">{step.channel.replace("_", " ")}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <button
                    onClick={addStep}
                    className="w-full flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Multichannel Step
                  </button>
                </div>
              </div>

              {/* Step editor */}
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Step {activeStep + 1}</p>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(activeStep)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Step
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Outreach Channel</label>
                    <select
                      value={steps[activeStep].channel}
                      onChange={(e) => updateStep(activeStep, "channel", e.target.value)}
                      className={inputClass}
                    >
                      <option value="email">📧 Cold Email</option>
                      <option value="linkedin_connect">💼 LinkedIn Connection Request</option>
                      <option value="linkedin_message">💬 LinkedIn InMail / Message</option>
                      <option value="linkedin_view">👀 LinkedIn Profile View</option>
                      <option value="sms">📱 SMS (Twilio Integration)</option>
                      <option value="call_task">📞 Manual Call Task</option>
                    </select>
                  </div>

                  {activeStep > 0 && (
                    <div>
                      <label className={labelClass}>Delay (days after previous step)</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={steps[activeStep].delayDays}
                        onChange={(e) => updateStep(activeStep, "delayDays", Number(e.target.value))}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                {steps[activeStep].channel === "email" && (
                  <div>
                    <label className={labelClass}>Subject Line *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Quick question about {{company}}"
                      value={steps[activeStep].subject}
                      onChange={(e) => updateStep(activeStep, "subject", e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <label className={labelClass + " mb-0"}>
                      {steps[activeStep].channel === "email" ? "Email Body *" : steps[activeStep].channel === "sms" ? "SMS Message Text *" : "Message / Instructions *"}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={convertBodyToSpintax}
                        title="Convert text to spintax {option1|option2}"
                        className="flex items-center gap-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded transition-colors"
                      >
                        <Shuffle className="w-3 h-3" /> Auto Spintax
                      </button>

                      {VARIABLES.map((v) => (
                        <button key={v} onClick={() => insertVariable(v)} className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono transition-colors">
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    className={inputClass + " font-mono text-xs resize-y"}
                    placeholder={steps[activeStep].channel === "sms" ? "Hi {{first_name}}, following up on my email..." : "Type email or message copy..."}
                    value={steps[activeStep].body}
                    onChange={(e) => updateStep(activeStep, "body", e.target.value)}
                  />
                </div>

                {/* Live Spam Check Bar */}
                {spamCheck && (
                  <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Spam Risk Score:</span>
                      <span className={`text-xs font-bold ${spamCheck.score < 3 ? "text-emerald-400" : spamCheck.score < 6 ? "text-amber-400" : "text-red-400"}`}>
                        {spamCheck.score}/10 ({spamCheck.rating})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sending Settings */}
        {tab === "settings" && (
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Daily limit per sender</label>
                <input type="number" min={1} max={500} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Min delay between sends (sec)</label>
                <input type="number" min={10} value={minDelay} onChange={(e) => setMinDelay(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max delay between sends (sec)</label>
                <input type="number" min={10} value={maxDelay} onChange={(e) => setMaxDelay(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-xl w-full p-6 space-y-5 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg text-foreground">AI Email Copy Generator</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Target Persona / Audience</label>
                <input className={inputClass} placeholder="e.g. SaaS Founders & VP Sales" value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Campaign Goal / Value Proposition</label>
                <input className={inputClass} placeholder="e.g. Schedule a 10-minute demo call for automated outreach" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tone</label>
                <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className={inputClass}>
                  <option value="professional">Professional & Direct</option>
                  <option value="casual">Casual & Conversational</option>
                </select>
              </div>
              <button
                onClick={handleGenerateAi}
                disabled={generatingAi}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {generatingAi ? "Generating Email Copy..." : "Generate Subjects & Body"}
              </button>
            </div>

            {/* Generated Results */}
            {aiSubjects.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select a Subject Line Variant</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {aiSubjects.map((subj, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyAiDraft(subj)}
                      className="w-full text-left p-2.5 rounded-lg bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 border border-border text-xs text-foreground font-medium transition-all"
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? "Launching..." : "Save & Launch Multichannel Campaign"}
        </button>
      </div>
    </div>
  );
}
