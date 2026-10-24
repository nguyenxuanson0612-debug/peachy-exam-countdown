import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Clock, History, Loader2, Play, Save, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { docsQuery } from "@/lib/docs";
import { gradeExam } from "@/lib/ai.functions";
import { UploadButton } from "@/components/Reader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/thi")({
  loader: ({ context }) => context.queryClient.ensureQueryData(docsQuery),
  head: () => ({ meta: [
    { title: "Phòng thi 180 phút — Ôn Thi Viên Chức" },
    { name: "description", content: "Thi thử 180 phút theo đề tải lên, lưu nháp và AI chấm điểm chi tiết." },
    { property: "og:title", content: "Phòng thi 180 phút" },
    { property: "og:description", content: "Thi thử, lưu nháp và AI chấm điểm chi tiết." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ExamPage,
});

type Attempt = {
  id: string; exam_doc_id: string | null; exam_title: string; answer: string; seconds_left: number;
  status: string; score: number | null; feedback: string | null; updated_at: string;
};

const attemptsQuery = {
  queryKey: ["attempts"],
  queryFn: async (): Promise<Attempt[]> => {
    const { data, error } = await supabase.from("exam_attempts").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Attempt[];
  },
};

const fmt = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function ExamRoom({ attempt, examHtml, onExit }: { attempt: Attempt; examHtml: string; onExit: () => void }) {
  const qc = useQueryClient();
  const grade = useServerFn(gradeExam);
  const [answer, setAnswer] = useState(attempt.answer);
  const [left, setLeft] = useState(attempt.seconds_left);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const stateRef = useRef({ answer, left });
  stateRef.current = { answer, left };

  const save = async (silent = false) => {
    const { error } = await supabase.from("exam_attempts").update({
      answer: stateRef.current.answer, seconds_left: stateRef.current.left, updated_at: new Date().toISOString(),
    }).eq("id", attempt.id);
    if (error) toast.error("Lưu nháp thất bại");
    else if (!silent) toast.success("Đã lưu bản nháp");
    qc.invalidateQueries({ queryKey: ["attempts"] });
  };

  const submit = async () => {
    setBusy(true);
    await save(true);
    try {
      const r = await grade({ data: { attemptId: attempt.id } });
      setResult(r.feedback);
      qc.invalidateQueries({ queryKey: ["attempts"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    const autosave = setInterval(() => save(true), 60000);
    return () => { clearInterval(t); clearInterval(autosave); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (left === 0 && !result && !busy) { toast("Hết giờ! Bài thi đang được nộp."); submit(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  if (result) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-soft md:p-10">
        <h2 className="font-display text-2xl font-bold">Kết quả chấm — {attempt.exam_title}</h2>
        <div className="md mt-4"><ReactMarkdown>{result}</ReactMarkdown></div>
        <Button className="mt-6" onClick={onExit}>Về phòng thi</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-32 z-30 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-bold ${left < 600 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          <Clock className="h-5 w-5" /> {fmt(left)}
        </div>
        <span className="truncate font-semibold">{attempt.exam_title}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={async () => { await save(); onExit(); }}><Save /> Lưu nháp & thoát</Button>
          <Button onClick={() => confirm("Nộp bài để AI chấm điểm?") && submit()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} Nộp bài
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="max-h-[75vh] overflow-auto rounded-2xl bg-card p-6 shadow-soft">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Đề thi</p>
          <div className="doc-reader" dangerouslySetInnerHTML={{ __html: examHtml || "<p>(Đề tự do)</p>" }} />
        </div>
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Gõ bài làm của bạn tại đây…"
          className="min-h-[75vh] rounded-2xl bg-card p-6 text-base leading-relaxed shadow-soft" />
      </div>
    </div>
  );
}

function ExamPage() {
  const qc = useQueryClient();
  const { data: docs } = useSuspenseQuery(docsQuery);
  const { data: attempts = [] } = useQuery(attemptsQuery);
  const exams = docs.filter((d) => d.category === "de-thi");
  const [active, setActive] = useState<Attempt | null>(null);
  const [view, setView] = useState<Attempt | null>(null);

  const start = async (docId: string, title: string) => {
    const { data, error } = await supabase.from("exam_attempts").insert({ exam_doc_id: docId, exam_title: title }).select().single();
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["attempts"] });
    setActive(data as Attempt);
  };

  if (active) {
    const html = docs.find((d) => d.id === active.exam_doc_id)?.html ?? "";
    return <ExamRoom attempt={active} examHtml={html} onExit={() => setActive(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Phòng thi 180 phút</h1>
        <p className="text-muted-foreground">Tải đề thi (.docx), làm bài trong 180 phút, AI chấm và nhận xét chi tiết.</p>
      </div>
      <section className="rounded-2xl bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Đề thi của bạn</h2>
          <UploadButton category="de-thi" label="Tải đề thi" />
        </div>
        {!exams.length && <p className="text-sm text-muted-foreground">Chưa có đề thi nào.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-xl border p-3">
              <span className="flex-1 truncate font-semibold">{e.title}</span>
              <Button size="sm" onClick={() => start(e.id, e.title)}><Play /> Vào thi</Button>
              <button aria-label="Xóa đề" className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
                if (!confirm("Xóa đề này?")) return;
                await supabase.from("documents").delete().eq("id", e.id);
                qc.invalidateQueries({ queryKey: ["documents"] });
              }}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-soft">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5 text-primary" /> Lịch sử thi & bản nháp</h2>
        {!attempts.length && <p className="text-sm text-muted-foreground">Chưa có bài thi nào.</p>}
        <div className="divide-y">
          {attempts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.exam_title}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleString("vi-VN")}</p>
              </div>
              {a.status === "graded" ? (
                <>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-accent-foreground">{a.score ?? "?"}/100</span>
                  <Button size="sm" variant="outline" onClick={() => setView(view?.id === a.id ? null : a)}>Xem nhận xét</Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">Nháp · còn {fmt(a.seconds_left)}</span>
                  <Button size="sm" onClick={() => setActive(a)}>Làm tiếp</Button>
                </>
              )}
              {view?.id === a.id && a.feedback && <div className="md w-full rounded-xl bg-muted p-4"><ReactMarkdown>{a.feedback}</ReactMarkdown></div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
