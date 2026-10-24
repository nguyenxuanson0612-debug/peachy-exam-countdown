import { streamText, type LanguageModel, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "./gateway.server";

export const AI_MODEL = "google/gemini-3.8-flash";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export function getProvider() {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("Thiếu cấu hình AI (LOVABLE_API_KEY).");
  return createLovableAiGatewayProvider(key, undefined, { baseURL: GATEWAY });
}

export function friendlyAiError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 429) return "AI đang quá tải, vui lòng thử lại sau ít phút.";
  if (status === 402) return "Đã hết lượt dùng AI miễn phí. Vui lòng nạp thêm credits trong cài đặt workspace.";
  if (status === 403) return "AI hiện không khả dụng cho tài khoản này.";
  return msg || "AI gặp lỗi.";
}

/** Stream a completion and return the final text. */
export async function complete(system: string, messages: ModelMessage[]): Promise<string> {
  const provider = getProvider();
  let err: unknown;
  const result = streamText({
    model: provider(AI_MODEL) as unknown as LanguageModel,
    system,
    messages,
    onError: ({ error }) => { err = error; },
  });
  const text = await result.text;
  if (err) throw new Error(friendlyAiError(err));
  return text;
}

export function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
