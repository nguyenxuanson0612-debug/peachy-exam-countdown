import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Fishbone = { head: string; bones: { title: string; keywords: string[]; meaning: string }[] };
export type Question =
  | { type: "single"; question: string; options: string[]; answer: number[]; explain: string }
  | { type: "multi"; question: string; options: string[]; answer: number[]; explain: string }
  | { type: "essay"; question: string; sample: string };

const MAX_CTX = 60000;

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function loadDocsText(
  supabase: { from: (t: "documents") => any },
  category?: string,
) {
  let q = supabase.from("documents").select("title, html, category").neq("category", "de-thi");
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const text = (data ?? [])
    .map((d: { title: string; html: string }) => `### ${d.title}\n${stripHtml(d.html)}`)
    .join("\n\n");
  return text.slice(0, MAX_CTX);
}

export const generateFishbone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { category: string; focus?: string }) => d)
  .handler(async ({ data, context }) => {
    const { complete, extractJson } = await import("./ai/llm.server");
    const docs = await loadDocsText(context.supabase, data.category);
    if (!docs) throw new Error("Chưa có tài liệu trong mục này. Hãy tải file Word lên trước.");
    const text = await complete(
      "Bạn là chuyên gia luyện thi viên chức giáo dục Việt Nam. Trả lời CHỈ bằng JSON hợp lệ, tiếng Việt.",
      [{
        role: "user",
        content: `Từ tài liệu dưới đây, lập SƠ ĐỒ XƯƠNG CÁ để ghi nhớ${data.focus ? ` (tập trung: ${data.focus})` : ""}.
Trả về JSON: {"head": "chủ đề chính", "bones": [{"title": "nhánh", "keywords": ["từ khóa gợi nhớ", ...], "meaning": "ý nghĩa/nội dung câu ngắn gọn"}]}
Tối đa 8 nhánh, mỗi nhánh 3-6 từ khóa.\n\nTÀI LIỆU:\n${docs}`,
      }],
    );
    return extractJson<Fishbone>(text);
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { category: string; kind: "single" | "multi" | "essay"; count: number }) => d)
  .handler(async ({ data, context }) => {
    const { complete, extractJson } = await import("./ai/llm.server");
    const docs = await loadDocsText(context.supabase, data.category);
    if (!docs) throw new Error("Chưa có tài liệu trong mục này. Hãy tải file Word lên trước.");
    const shape =
      data.kind === "essay"
        ? `[{"type":"essay","question":"...","sample":"đáp án gợi ý"}]`
        : data.kind === "multi"
          ? `[{"type":"multi","question":"...","options":["A","B","C","D"],"answer":[0,2],"explain":"..."}] (mỗi câu có 2-3 đáp án đúng)`
          : `[{"type":"single","question":"...","options":["A","B","C","D"],"answer":[1],"explain":"..."}] (đúng 1 đáp án)`;
    const text = await complete(
      "Bạn là người ra đề thi viên chức giáo dục Việt Nam. Trả lời CHỈ bằng JSON hợp lệ, tiếng Việt.",
      [{ role: "user", content: `Tạo ${data.count} câu hỏi dựa CHÍNH XÁC vào tài liệu. Định dạng: ${shape}\n\nTÀI LIỆU:\n${docs}` }],
    );
    return extractJson<Question[]>(text);
  });

export const gradeEssay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { category: string; question: string; answer: string }) => d)
  .handler(async ({ data, context }) => {
    const { complete } = await import("./ai/llm.server");
    const docs = await loadDocsText(context.supabase, data.category);
    return complete(
      "Bạn là giám khảo chấm thi viên chức. Chấm theo thang 10, dựa trên tài liệu. Trình bày Markdown ngắn gọn bằng tiếng Việt: Điểm, Chỗ sai/thiếu (trích cụ thể), Điểm mạnh, Gợi ý bổ sung.",
      [{ role: "user", content: `CÂU HỎI: ${data.question}\nBÀI LÀM: ${data.answer}\n\nTÀI LIỆU:\n${docs}` }],
    );
  });

export const gradeExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { attemptId: string }) => d)
  .handler(async ({ data, context }) => {
    const { complete } = await import("./ai/llm.server");
    const sb = context.supabase;
    const { data: att, error } = await sb.from("exam_attempts").select("*").eq("id", data.attemptId).single();
    if (error || !att) throw new Error("Không tìm thấy bài thi.");
    let examText = "";
    if (att.exam_doc_id) {
      const { data: ex } = await sb.from("documents").select("html").eq("id", att.exam_doc_id).single();
      examText = ex ? stripHtml(ex.html).slice(0, 20000) : "";
    }
    const docs = await loadDocsText(sb);
    const feedback = await complete(
      `Bạn là giám khảo chấm thi viên chức giáo dục. Chấm bài theo đề, dựa trên tài liệu tham khảo. Trả lời Markdown tiếng Việt, DÒNG ĐẦU TIÊN bắt buộc là "ĐIỂM: x/100". Sau đó gồm các mục: ## Nhận xét từng câu (chỉ rõ chỗ sai, trích nguyên văn đoạn sai và ghi chú sửa), ## Điểm mạnh, ## Điểm còn thiếu, ## Lời khuyên ôn tập.`,
      [{ role: "user", content: `ĐỀ THI:\n${examText || att.exam_title}\n\nBÀI LÀM:\n${att.answer}\n\nTÀI LIỆU THAM KHẢO:\n${docs}` }],
    );
    const m = feedback.match(/ĐIỂM:\s*([\d.,]+)/i);
    const score = m ? Number(m[1].replace(",", ".")) : null;
    const { error: upErr } = await sb
      .from("exam_attempts")
      .update({ feedback, score, status: "graded", updated_at: new Date().toISOString() })
      .eq("id", data.attemptId);
    if (upErr) throw new Error(upErr.message);
    return { feedback, score };
  });
