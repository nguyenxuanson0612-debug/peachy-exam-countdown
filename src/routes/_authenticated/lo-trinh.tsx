import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Map, Plus, Trash2, Pencil, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type CategoryKey } from "@/lib/docx";
import { useStudyStorage } from "@/hooks/use-study-storage";
import { taskProgress, type StudyTask } from "@/lib/study-tools";

export const Route = createFileRoute("/_authenticated/lo-trinh")({
  head: () => ({ meta: [
    { title: "Lộ trình cá nhân — Ôn Thi Viên Chức" },
    { name: "description", content: "Sắp xếp mục tiêu, ngày học và theo dõi tiến độ ôn thi viên chức của riêng bạn." },
    { property: "og:title", content: "Lộ trình cá nhân — Ôn Thi Viên Chức" },
    { property: "og:description", content: "Quản lý kế hoạch học tập và tiến độ ôn thi cá nhân." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: StudyPlan,
});

function StudyPlan() {
  const { value: tasks, update, ready } = useStudyStorage<StudyTask[]>("plan", []);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("luat");
  const [date, setDate] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const reset = () => { setTitle(""); setDate(""); setEditing(null); };
  const progress = taskProgress(tasks);
  return <div className="mx-auto max-w-4xl">
    <div className="study-heading mb-7"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Map className="size-4" /> Hành trình của bạn</p><h1 className="font-display text-3xl font-bold">Lộ trình học tập cá nhân hóa</h1><p className="mt-2 text-muted-foreground">Mỗi mục tiêu hoàn thành là một bước tiến.</p></div>
    <div className="mb-8"><div className="mb-2 flex justify-between text-sm"><span>{tasks.filter((task) => task.done).length}/{tasks.length} mục tiêu hoàn thành</span><b className="text-primary">{progress}%</b></div><progress className="study-progress h-2 w-full" max={100} value={progress} aria-label="Tiến độ học tập" /></div>
    <form className="grid items-end gap-4 border-y py-6 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault(); if (!title.trim() || !ready) return;
      if (editing) update(tasks.map((task) => task.id === editing ? { ...task, title: title.trim(), category, date } : task));
      else update([...tasks, { id: crypto.randomUUID(), title: title.trim(), category, date, done: false }]);
      reset();
    }}>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="goal-title">Mục tiêu học tập</Label><Input id="goal-title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Ôn quyền và nghĩa vụ của viên chức" /></div>
      <div className="space-y-2"><Label htmlFor="goal-category">Môn học</Label><select id="goal-category" className="study-select w-full rounded-md border bg-card px-3 py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value as CategoryKey)}>{Object.entries(CATEGORIES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="goal-date">Ngày dự kiến</Label><Input id="goal-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={!ready || !title.trim()} type="submit"><Plus />{editing ? "Lưu mục tiêu" : "Thêm mục tiêu"}</Button>{editing && <Button type="button" variant="ghost" onClick={reset}><X />Hủy</Button>}</div>
    </form>
    <div className="mt-6 divide-y">{[...tasks].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")).map((task) => <div key={task.id} className="flex items-start gap-3 py-5">
      <Button variant={task.done ? "default" : "outline"} size="icon" aria-label={`Hoàn thành: ${task.title}`} aria-pressed={task.done} onClick={() => update(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}><Check /></Button>
      <div className="min-w-0 flex-1"><p className={`break-words font-semibold ${task.done ? "text-muted-foreground line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{CATEGORIES[task.category as CategoryKey]?.label} · {task.date ? task.date.split("-").reverse().join("/") : "Chưa đặt ngày"}</p><Link to="/hoc/$category" params={{ category: task.category }} search={{ to: undefined }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">Vào học <ArrowUpRight className="size-3" /></Link></div>
      <Button variant="ghost" size="icon" aria-label={`Sửa: ${task.title}`} onClick={() => { setEditing(task.id); setTitle(task.title); setCategory(task.category as CategoryKey); setDate(task.date); }}><Pencil /></Button>
      <Button variant="ghost" size="icon" aria-label={`Xóa: ${task.title}`} onClick={() => { update(tasks.filter((item) => item.id !== task.id)); if (editing === task.id) reset(); }}><Trash2 /></Button>
    </div>)}</div>
    {!tasks.length && <p className="py-10 text-center text-muted-foreground">Chưa có mục tiêu học tập.</p>}
    <p className="mt-6 text-xs text-muted-foreground">Lộ trình được lưu trên thiết bị này cho tài khoản của bạn.</p>
  </div>;
}