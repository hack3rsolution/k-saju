import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("/api"),
});

// Next.js는 NEXT_PUBLIC_* 를 클라이언트 번들에 주입하므로 여기서 한 번만 파싱해도 OK
export const env = EnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
