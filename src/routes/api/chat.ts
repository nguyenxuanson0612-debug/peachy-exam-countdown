import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: u } = await sb.auth.getUser(auth.slice(7));
        if (!u.user) return new Response("Unauthorized", { status: 401 });

        const { messages } = (await request.json()) as {
          messages: { role: "user" | "assistant"; content: string }[];
        };
        const { data: docs } = await sb.from("documents").select("title, html").neq("category", "de-thi");
        const ctx = (docs ?? [])
          .map((d) => `### ${d.title}\n${d.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`)
          .join("\n")
          .slice(0, 50000);

        const { streamText } = await import("ai");
        const { getProvider, AI_MODEL, friendlyAiError } = await import("@/lib/ai/llm.server");
        const result = streamText({
          model: getProvider()(AI_MODEL),
          system: `Bạn là gia sư ôn thi viên chức giáo dục tận tâm, giải thích rõ ràng, ngắn gọn, bằng tiếng Việt, dùng Markdown. Ưu tiên dựa trên tài liệu của người học (nếu có), trích dẫn Điều/Chương khi phù hợp.\n\nTÀI LIỆU CỦA NGƯỜI HỌC:\n${ctx || "(chưa có)"}`,
          messages: messages.slice(-20),
          abortSignal: request.signal,
        });
        return result.toTextStreamResponse({
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
        void friendlyAiError;
      },
    },
  },
});
