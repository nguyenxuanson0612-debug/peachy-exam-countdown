import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Fish, Loader2, Sparkles, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { generateFishbone, generateQuiz, gradeEssay, type Fishbone, type Question } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FishboneMode({ category }: { category: string }) {
  const fn = useServerFn(generateFishbone);
  const [focus, setFocus] = useState("");
  const [data, setData] = useState<Fishbone | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setData(await fn({ data: { category, focus } })); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };
  const top = data?.bones.filter((_, i) => i % 2 === 0) ?? [];
  const bottom = data?.bones.filter((_, i) => i % 2 === 1) ?? [];
  const Bone = ({ b }: { b: Fishbone["bones"][number] }) => (
    <div className="rounded-xl border-2 border-primary/30 bg-card p-4">
      <p className="font-bold text-primary">{b.title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {b.keywords.map((k) => <span key={k} className="rounded-full bg-highlight px-2 py-0.5 text-xs font-bold">{k}</span>)}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{b.meaning}</p>
    </div>
  );
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Chủ đề muốn tập trung (VD: Chương II, quyền của viên chức…) — để trống để lấy toàn bộ" value={focus} onChange={(e) => setFocus(e.target.value)} />
        <Button onClick={run} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Fish />} Tạo sơ đồ xương cá</Button>
      </div>
      {data && (
        <div className="mt-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{top.map((b) => <Bone key={b.title} b={b} />)}</div>
          <div className="relative my-6 flex items-center">
            <div className="h-1.5 flex-1 rounded-full bg-gradient-primary" />
            <div className="ml-[-2px] rounded-r-full rounded-l-md bg-primary px-5 py-3 font-display text-lg font-bold text-primary-foreground shadow-soft">{data.head}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{bottom.map((b) => <Bone key={b.title} b={b} />)}</div>
        </div>
      )}
      {!data && !loading && <p className="mt-10 text-center text-muted-foreground">AI sẽ biên soạn sơ đồ xương cá với từ khóa gợi nhớ từ tài liệu của mục này.</p>}
    </div>
  );
}

function QuestionCard({ q, i, category }: { q: Question; i: number; category: string }) {
  const grade = useServerFn(gradeEssay);
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [essay, setEssay] = useState("");
  const [fb, setFb] = useState("");
  const [loading, setLoading] = useState(false);

  if (q.type === "essay") {
    return (
      <div className="rounded-xl border p-4">
        <p className="font-bold">Câu {i + 1}. {q.question}</p>
        <Textarea className="mt-3 min-h-32" placeholder="Gõ câu trả lời của bạn…" value={essay} onChange={(e) => setEssay(e.target.value)} />
        <Button className="mt-2" disabled={loading || !essay.trim()} onClick={async () => {
          setLoading(true);
          try { setFb(await grade({ data: { category, question: q.question, answer: essay } })); }
          catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
        }}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} AI chấm bài</Button>
        {fb && <div className="prose prose-sm mt-3 max-w-none rounded-lg bg-muted p-4"><ReactMarkdown>{fb}</ReactMarkdown></div>}
        {fb && <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Xem đáp án gợi ý</summary><p className="mt-1">{q.sample}</p></details>}
      </div>
    );
  }
  const correct = done && picked.length === q.answer.length && picked.every((p) => q.answer.includes(p));
  return (
    <div className="rounded-xl border p-4">
      <p className="font-bold">Câu {i + 1}. {q.question} {q.type === "multi" && <span className="text-xs font-normal text-primary">(chọn nhiều đáp án)</span>}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, j) => {
          const on = picked.includes(j);
          const state = done ? (q.answer.includes(j) ? "border-success bg-success/10" : on ? "border-destructive bg-destructive/10" : "") : on ? "border-primary bg-primary-soft" : "";
          return (
            <button key={j} disabled={done} onClick={() => setPicked(q.type === "single" ? [j] : on ? picked.filter((p) => p !== j) : [...picked, j])}
              className={`rounded-lg border-2 px-3 py-2 text-left text-sm ${state}`}>
              <b>{String.fromCharCode(65 + j)}.</b> {o}
            </button>
          );
        })}
      </div>
      {!done ? (
        <Button className="mt-3" size="sm" disabled={!picked.length} onClick={() => setDone(true)}>Kiểm tra</Button>
      ) : (
        <p className={`mt-3 flex items-start gap-2 text-sm ${correct ? "text-success" : "text-destructive"}`}>
          {correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          <span><b>{correct ? "Chính xác!" : "Chưa đúng."}</b> <span className="text-foreground">{q.explain}</span></span>
        </p>
      )}
    </div>
  );
}

export function PracticeMode({ category }: { category: string }) {
  const fn = useServerFn(generateQuiz);
  const [kind, setKind] = useState<"single" | "multi" | "essay">("single");
  const [qs, setQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setQs(await fn({ data: { category, kind, count: kind === "essay" ? 3 : 10 } })); }
    catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };
  const kinds = [
    { k: "single", l: "Trắc nghiệm 1 đáp án" },
    { k: "multi", l: "Chọn nhiều đáp án" },
    { k: "essay", l: "Tự luận" },
  ] as const;
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft md:p-8">
      <div className="flex flex-wrap gap-2">
        {kinds.map((x) => (
          <Button key={x.k} variant={kind === x.k ? "default" : "outline"} onClick={() => setKind(x.k)}>{x.l}</Button>
        ))}
        <Button variant="secondary" onClick={run} disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Tạo đề ôn tập
        </Button>
      </div>
      <div className="mt-6 space-y-4">
        {qs.map((q, i) => <QuestionCard key={`${kind}-${i}-${q.question}`} q={q} i={i} category={category} />)}
        {!qs.length && !loading && <p className="py-10 text-center text-muted-foreground">Chọn dạng bài và bấm "Tạo đề ôn tập" — câu hỏi được tạo từ tài liệu của mục này.</p>}
      </div>
    </div>
  );
}
