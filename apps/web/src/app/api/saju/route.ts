import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateSaju } from "@lib/saju/core";

const schema = z.object({
  birthDate: z.string().min(8),
  birthTime: z.string().optional(),
  timezone: z.string().optional(),
  place: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    // 핵심 계산 (현재는 Mock, 이후 실제 로직 교체)
    const result = calculateSaju(parsed);

    // TODO: Supabase readings 테이블에 저장 (후속 단계)
    return NextResponse.json({ ok: true, data: result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Invalid request payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
