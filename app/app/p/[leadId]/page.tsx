import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Play, Calendar, CheckCircle } from "lucide-react";

export async function generateMetadata({ params }: { params: { leadId: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: { firstName: true, company: true },
  });

  return {
    title: lead ? `Special Overview for ${lead.firstName || "You"} @ ${lead.company || "Your Team"}` : "Personalized Overview",
  };
}

export default async function PersonalizedLandingPage({
  params,
}: {
  params: { leadId: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
  });

  if (!lead) return notFound();

  const name = lead.firstName || "there";
  const company = lead.company || "your company";
  const title = lead.title || "Leader";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8 text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" /> Prepared specially for {name}
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Welcome, <span className="gradient-text">{name}</span>!
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Here is the custom breakdown prepared for {title}s at <span className="text-foreground font-semibold">{company}</span>.
          </p>
        </div>

        {/* Video Player Card */}
        <div className="glass rounded-2xl p-4 overflow-hidden border border-border shadow-2xl relative group">
          <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            <img
              src={`/api/assets/video-thumbnail?name=${encodeURIComponent(name)}`}
              alt="Personalized video thumbnail"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg transform group-hover:scale-110 transition-all">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="glass rounded-xl p-4 space-y-1 border border-border">
            <p className="font-semibold text-sm text-foreground">Tailored for {company}</p>
            <p className="text-xs text-muted-foreground">Built to scale outreach and inbox placement effortlessly.</p>
          </div>
          <div className="glass rounded-xl p-4 space-y-1 border border-border">
            <p className="font-semibold text-sm text-foreground">Automated & Scalable</p>
            <p className="text-xs text-muted-foreground">Inbox rotation, AI personalization, and deliverability protection.</p>
          </div>
          <div className="glass rounded-xl p-4 space-y-1 border border-border">
            <p className="font-semibold text-sm text-foreground">10x Higher Reply Rate</p>
            <p className="text-xs text-muted-foreground">Hyper-personalized dynamic assets for every lead.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="pt-4">
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <Calendar className="w-5 h-5" /> Schedule 15-Minute Intro Call
          </a>
        </div>
      </div>
    </div>
  );
}
