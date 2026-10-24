import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { GraduationCap, Loader2, RotateCcw, Send, Square } from "lucide-react";
import { authHeader } from "@/lib/docs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/hoi-dap")({
  head: () => ({ meta: [
    { title: "Hỏi đáp AI — Ôn Thi Viên Chức" },
    { name: "description", content: "Gia sư AI giải đáp, hướng dẫn ôn thi viên chức dựa trên tài liệu của bạn." },
    { property: "og:title", content: "Hỏi đáp AI 1:1" },
    { property: "og:description", content: "Gia sư AI giải đáp dựa trên tài liệu của bạn." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "chat-history";

function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
    taRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!busy) localStorage.setItem(KEY, JSON.stringify(msgs));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput(""); setBusy(true);
    const ac = new AbortController(); abortRef.current = ac;
    try {
      const res = await fetch("/api/chat", {
        method: "POST", signal: ac.signal,
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 429 ? "AI đang quá tải, thử lại sau." : res.status === 402 ? "Đã hết lượt dùng AI." : "AI gặp lỗi.");
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs([...next, { role: "assistant", content: "_(AI không trả lời được câu này)_" }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMsgs([...next, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally { setBusy(false); taRef.current?.focus(); }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] max-w-3xl flex-col rounded-2xl bg-card shadow-soft">
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></div>
        <div className="flex-1"><p className="font-bold">Gia sư AI</p><p className="text-xs text-muted-foreground">Hỏi đáp 1:1 · dựa trên tài liệu của bạn</p></div>
        <Button variant="ghost" size="sm" onClick={() => { setMsgs([]); localStorage.removeItem(KEY); }}><RotateCcw /> Cuộc trò chuyện mới</Button>
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {!msgs.length && <p className="mt-16 text-center text-muted-foreground">Hỏi gì cũng được: "Giải thích Điều 12 Luật Viên chức", "Gợi ý xử lý tình huống học sinh đánh nhau"…</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user"
              ? <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">{m.content}</div>
              : m.content ? <div className="md max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2 border-t p-3">
        <textarea ref={taRef} rows={2} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Nhập câu hỏi… (Enter để gửi)" className="flex-1 resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        {busy
          ? <Button size="icon" variant="outline" onClick={() => abortRef.current?.abort()} aria-label="Dừng"><Square /></Button>
          : <Button size="icon" onClick={send} disabled={!input.trim()} aria-label="Gửi"><Send /></Button>}
      </div>
    </div>
  );
}
