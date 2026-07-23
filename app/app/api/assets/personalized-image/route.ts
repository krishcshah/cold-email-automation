import { NextRequest, NextResponse } from "next/server";

// GET /api/assets/personalized-image?name=John&company=Acme
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "there";
  const company = url.searchParams.get("company") || "your team";

  const svg = `<svg width="600" height="315" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" rx="16" />
    <rect x="30" y="30" width="540" height="255" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" rx="12" />
    <text x="300" y="120" font-family="-apple-system, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">
      Specially Prepared For
    </text>
    <text x="300" y="170" font-family="-apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle">
      ${name} @ ${company}
    </text>
    <text x="300" y="220" font-family="-apple-system, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">
      Click to view your custom 2-minute video presentation
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
