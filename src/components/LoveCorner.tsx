import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarHeart, Coffee, Heart, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STUDY = 45 * 60;
const BREAK = 5 * 60;

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* ignore */ }
}

function notify(title: string, body: string) {
  beep();
  toast(title, { description: body, duration: 15000 });
  if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body });
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function Pomodoro() {
  const [mode, setMode] = useState<"study" | "break">("study");
  const [left, setLeft] = useState(STUDY);
  const [running, setRunning] = useState(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        if (modeRef.current === "study") {
          notify("💗 Nghỉ 5 phút nhé!", "Em đã học 45 phút rồi. Đứng dậy uống nước, thư giãn mắt một chút nào.");
          setMode("break"); return BREAK;
        }
        notify("📚 Quay lại học thôi!", "Hết giờ nghỉ rồi, cố lên em nhé!");
        setMode("study"); return STUDY;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
    setRunning((r) => !r);
  };

  return (
    <div className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1">
      {mode === "study" ? <Timer className="h-4 w-4 text-primary" /> : <Coffee className="h-4 w-4 text-primary" />}
      <span className="w-12 text-center font-mono text-sm font-bold tabular-nums text-accent-foreground">{fmt(left)}</span>
      <button onClick={start} aria-label={running ? "Tạm dừng" : "Bắt đầu"} className="rounded-full p-1 text-primary hover:bg-card">
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button onClick={() => { setRunning(false); setMode("study"); setLeft(STUDY); }} aria-label="Đặt lại" className="rounded-full p-1 text-primary hover:bg-card">
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Countdown() {
  const [date, setDate] = useState<string>("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setDate(localStorage.getItem("examDate") ?? "");
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const save = (v: string) => { setDate(v); localStorage.setItem("examDate", v); };
  const diff = date ? new Date(date + "T07:00:00").getTime() - now : 0;
  const days = Math.max(0, Math.floor(diff / 86400000));
  const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-accent-foreground">
          <CalendarHeart className="h-4 w-4 text-primary" />
          {date ? <span><b className="text-primary">{days}</b> ngày {hours} giờ</span> : <span>Đặt ngày thi</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="flex items-center gap-1 text-sm font-bold"><Heart className="h-4 w-4 fill-primary text-primary" /> Tiếp sức từ người yêu</p>
        <p className="mt-1 text-xs text-muted-foreground">Chọn ngày thi để đếm ngược</p>
        <Input type="date" className="mt-3" value={date} onChange={(e) => save(e.target.value)} />
        {date && <p className="mt-3 text-sm">Còn <b className="text-primary">{days} ngày</b> nữa thôi. Cố lên em nhé! 💗</p>}
        {!date && <Button variant="ghost" size="sm" className="mt-2" disabled>Chưa đặt ngày</Button>}
      </PopoverContent>
    </Popover>
  );
}
