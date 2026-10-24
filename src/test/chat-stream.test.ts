// @vitest-environment node
import { describe, expect, it } from "vitest";
import { streamChat } from "@/lib/chat-stream";

const encoder = new TextEncoder();
const event = (data: unknown) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

describe("Chat SSE streaming", () => {
  it("delivers partial Vietnamese text before the response finishes", async () => {
    let writer: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; } });
    let firstText: (value: string) => void = () => {};
    const first = new Promise<string>((resolve) => { firstText = resolve; });
    const updates: string[] = [];
    let finished = false;
    const pending = streamChat([{ role: "user", content: "Học luật" }], {}, new AbortController().signal,
      (text) => { updates.push(text); if (text) firstText(text); },
      async () => new Response(body, { headers: { "Content-Type": "text/event-stream" } }),
    ).then((text) => { finished = true; return text; });
    if (!writer) throw new Error("Missing stream controller");
    writer.enqueue(event({ type: "start", messageId: "answer" }));
    writer.enqueue(event({ type: "text-start", id: "text" }));
    writer.enqueue(event({ type: "text-delta", id: "text", delta: "Viên chức" }));
    expect(await first).toBe("Viên chức");
    expect(finished).toBe(false);
    // Split an SSE frame, including its Vietnamese UTF-8 bytes.
    const delta = event({ type: "text-delta", id: "text", delta: " giáo dục" });
    for (const byte of delta) writer.enqueue(new Uint8Array([byte]));
    writer.enqueue(event({ type: "text-end", id: "text" }));
    writer.enqueue(event({ type: "finish", finishReason: "stop" }));
    writer.close();
    expect(await pending).toBe("Viên chức giáo dục");
    expect(updates).toContain("Viên chức");
  });

  it("surfaces an SSE error without replacing already received text", async () => {
    const updates: string[] = [];
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(event({ type: "start", messageId: "answer" }));
      controller.enqueue(event({ type: "text-start", id: "text" }));
      controller.enqueue(event({ type: "text-delta", id: "text", delta: "Điều 12" }));
      controller.enqueue(event({ type: "error", errorText: "AI tạm ngừng" }));
      controller.close();
    } });
    await expect(streamChat([], {}, new AbortController().signal, (text) => updates.push(text),
      async () => new Response(body),
    )).rejects.toThrow("AI tạm ngừng");
    expect(updates).toContain("Điều 12");
  });
});