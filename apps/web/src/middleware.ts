import type { NextRequest } from "next/server";

const counters = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 5_000;
const LIMIT = 20;

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api")) return;
  const ip = req.ip ?? "anon";
  const now = Date.now();
  const rec = counters.get(ip) ?? { n: 0, t: now };
  if (now - rec.t > WINDOW_MS) { rec.n = 0; rec.t = now; }
  rec.n += 1; counters.set(ip, rec);
  if (rec.n > LIMIT) {
    return new Response(JSON.stringify({ ok:false, error:"rate_limited" }), { status: 429 });
  }
}
export const config = { matcher: ["/api/:path*"] };
