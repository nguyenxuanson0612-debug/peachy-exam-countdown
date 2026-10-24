import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env['SUPABASE_URL'];
        const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
        if (!url || !key) return new Response("Thiếu cấu hình đăng nhập.", { status: 500 });
        const sb = createClient(url, key, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: u } = await sb.auth.getUser(auth.slice(7));
        if (!u.user) return new Response("Unauthorized", { status: 401 });

        const { validateUIMessages, convertToModelMessages, streamText } = await import("ai");
        let messages;
        try {
          const body = await request.json();
          messages = await validateUIMessages({ messages: body.messages });
        } catch {
          return new Response("Câu hỏi không hợp lệ.", { status: 400 });
        }
        const { data: docs } = await sb.from("documents").select("title, html").neq("category", "de-thi");
        const ctx = (docs ?? [])
          .map((d) => `### ${d.title}\n${d.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`)
          .join("\n")
          .slice(0, 50000);

        const { getProvider, AI_MODEL, friendlyAiError } = await import("@/lib/ai/llm.server");
        const { withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/gateway.server");
        const provider = getProvider();
        const result = streamText({
          model: provider(AI_MODEL) as unknown as import("ai").LanguageModel,
          system: `Bạn là gia sư ôn thi viên chức giáo dục tận tâm, giải thích rõ ràng, ngắn gọn, bằng tiếng Việt, dùng Markdown. Ưu tiên dựa trên tài liệu của người học (nếu có), trích dẫn Điều/Chương khi phù hợp.\n\nTÀI LIỆU CỦA NGƯỜI HỌC:\n${ctx || "(chưa có)"}`,
          messages: await convertToModelMessages(messages.slice(-20)),
          abortSignal: request.signal,
        });
        return withLovableAiGatewayRunIdHeader(result.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: friendlyAiError,
          headers: {
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        }), provider);
      },
    },
  },
});
