import { NextRequest, NextResponse } from "next/server";

// GET /api/assets/video-thumbnail?name=John
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "there";

  const svg = `<svg width="480" height="270" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#4338ca" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" rx="12" />
    
    <!-- Play Button Icon -->
    <circle cx="240" cy="120" r="36" fill="#10b981" opacity="0.9" />
    <polygon points="232,105 256,120 232,135" fill="#ffffff" />
    
    <text x="240" y="200" font-family="-apple-system, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">
      Personalized Video for ${name}
    </text>
    <text x="240" y="225" font-family="-apple-system, sans-serif" font-size="13" fill="#a5b4fc" text-anchor="middle">
      Duration: 1 min 45 sec • Click to play
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
