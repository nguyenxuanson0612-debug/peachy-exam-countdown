import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** The SDK decodes SSE frames and emits each partial message immediately. */
export async function streamChat(
  messages: ChatMessage[],
  headers: Record<string, string>,
  signal: AbortSignal,
  onText: (text: string) => void,
  fetcher?: typeof fetch,
) {
  const transport = new DefaultChatTransport({ api: "/api/chat", headers, ...(fetcher ? { fetch: fetcher } : {}) });
  const history: UIMessage[] = messages.map((message, i) => ({
    id: `message-${i}`,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  }));
  const stream = await transport.sendMessages({
    trigger: "submit-message", chatId: "chat-history", messageId: undefined, messages: history, abortSignal: signal,
  });
  let text = "";
  for await (const message of readUIMessageStream({ stream, terminateOnError: true })) {
    text = message.parts.flatMap((part) => part.type === "text" ? [part.text] : []).join("");
    onText(text);
  }
  return text;
}