import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { GraduationCap, Loader2, MessageCircle, RotateCcw, Send, Square, X } from "lucide-react";
import { authHeader } from "@/lib/docs";
import { Button } from "@/components/ui/button";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";

const FloatingChatContext = createContext({ open: false, show: () => {} });
export const useFloatingChat = () => useContext(FloatingChatContext);

export function FloatingChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true })); };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && open) close(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return <FloatingChatContext.Provider value={{ open, show: () => setOpen(true) }}>
    {children}
    <aside className="floating-chat" data-open={open}>
      <Button ref={triggerRef} size="icon" variant="chat" className="chat-bubble" hidden={open}
        aria-label="Mở Hỏi đáp AI" title="Hỏi đáp AI" aria-expanded={open} aria-controls="floating-ai-chat" onClick={() => setOpen(true)}>
        <MessageCircle className="size-7" />
      </Button>
      <div id="floating-ai-chat" className="chat-window" hidden={!open} role="dialog" aria-modal="false" aria-label="Hỏi đáp AI">
        <ChatPanel open={open} close={close} />
      </div>
    </aside>
  </FloatingChatContext.Provider>;
}

type Msg = ChatMessage;
const KEY = "chat-history";

function ChatPanel({ open, close }: { open: boolean; close: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (open) taRef.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => {
    if (!busy) localStorage.setItem(KEY, JSON.stringify(msgs));
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || abortRef.current) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput(""); setBusy(true); setError("");
    const ac = new AbortController(); abortRef.current = ac;
    try {
      const acc = await streamChat(next, await authHeader(), ac.signal, (content) => {
        setMsgs([...next, { role: "assistant", content }]);
      });
      if (!acc) setMsgs([...next, { role: "assistant", content: "_(AI không trả lời được câu này)_" }]);
    } catch (e) {
      if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Không thể kết nối AI. Vui lòng thử lại.");
    } finally {
      abortRef.current = null;
      setBusy(false);
      if (open) taRef.current?.focus({ preventScroll: true });
    }
  };

  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 items-center gap-2 border-b bg-chat-soft px-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chat-peach text-chat-foreground"><GraduationCap className="size-5" /></div>
      <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Gia sư AI</h2><p className="text-[11px] text-muted-foreground">Đồng hành cùng bạn ôn thi</p></div>
      <Button variant="ghost" size="icon-sm" disabled={busy} title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới" onClick={() => { setMsgs([]); setError(""); localStorage.removeItem(KEY); }}><RotateCcw /></Button>
      <Button variant="ghost" size="icon-sm" title="Đóng" aria-label="Đóng Hỏi đáp AI" onClick={close}><X /></Button>
    </div>
    <Conversation className="min-h-0" aria-label="Nội dung trò chuyện">
      <ConversationContent className="gap-4 p-3">
        {!msgs.length && <div className="py-7 text-center"><GraduationCap className="mx-auto mb-3 size-8 text-primary" /><p className="font-semibold">Chào bạn, mình sẵn sàng!</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Bạn muốn ôn Điều luật hay tình huống sư phạm nào hôm nay?</p></div>}
        {msgs.map((m, i) => <Message from={m.role} key={i} className="max-w-full">
          <MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground whitespace-pre-wrap break-words px-3 py-2" : "w-full break-words"}>
            {m.role === "user" ? m.content : m.content ? <MessageResponse className="md text-sm" isAnimating={busy && i === msgs.length - 1}>{m.content}</MessageResponse> : busy && i === msgs.length - 1 ? <Loader2 aria-label="Đang trả lời" className="size-4 animate-spin text-primary" /> : null}
          </MessageContent>
        </Message>)}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </ConversationContent>
      <ConversationScrollButton aria-label="Đến câu trả lời mới nhất" />
    </Conversation>
    <div className="shrink-0 border-t bg-card p-3">
      <PromptInput onSubmit={() => send()}>
        <PromptInputTextarea ref={taRef} rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi…" aria-label="Câu hỏi cho AI" className="min-h-14 max-h-24 text-sm" />
        <PromptInputFooter className="justify-end pb-2">
          <PromptInputSubmit status={busy ? "streaming" : "ready"} onStop={() => abortRef.current?.abort()} disabled={!busy && !input.trim()} aria-label={busy ? "Dừng" : "Gửi"} title={busy ? "Dừng trả lời" : "Gửi câu hỏi"}>{busy ? <Square /> : <Send />}</PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>
    </div>
  </div>;
}
