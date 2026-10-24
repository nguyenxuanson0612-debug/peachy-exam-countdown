import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloatingChat } from "@/components/FloatingChat";

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

function ChatPage() {
  const { show } = useFloatingChat();
  useEffect(() => { show(); }, [show]);
  return <section><h1 className="font-display text-3xl font-bold">Hỏi đáp AI</h1><Button className="mt-4" onClick={show}><MessageCircle /> Gia sư AI</Button></section>;
}
