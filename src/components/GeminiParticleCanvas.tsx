import { useEffect, useRef } from "react";

const PALETTE = ["#EC4899", "#D946EF", "#F43F5E", "#FB7185", "#F9A8D4"].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);

function colorAt(t: number) {
  const n = PALETTE.length;
  const x = ((t % n) + n) % n;
  const a = PALETTE[Math.floor(x)] ?? PALETTE[0]!;
  const b = PALETTE[(Math.floor(x) + 1) % n] ?? PALETTE[0]!;
  const f = x - Math.floor(x);
  const [ar = 0, ag = 0, ab = 0] = a;
  const [br = 0, bg = 0, bb = 0] = b;
  return `rgb(${Math.round(ar + (br - ar) * f)},${Math.round(ag + (bg - ag) * f)},${Math.round(ab + (bb - ab) * f)})`;
}

type P = { bx: number; by: number; z: number; ang: number; dist: number; size: number; star: boolean; hue: number; speed: number; phase: number; op: number; glow: number; ox: number; oy: number };

export function GeminiParticleCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const parts: P[] = Array.from({ length: 250 }, () => ({
      bx: Math.random(), by: Math.random(), z: Math.random(),
      ang: Math.random() * Math.PI * 2, dist: 0,
      size: 1.2 + Math.random() * 2.6, star: Math.random() < 0.14,
      hue: Math.random() * 5, speed: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2, op: 0.5 + Math.random() * 0.4,
      glow: 0, ox: 0, oy: 0,
    }));

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      mouse.vx = x - mouse.x; mouse.vy = y - mouse.y;
      mouse.x = x; mouse.y = y;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    const star = (x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s * 2.6);
      ctx.quadraticCurveTo(x, y, x + s * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y + s * 2.6);
      ctx.quadraticCurveTo(x, y, x - s * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y - s * 2.6);
      ctx.fill();
    };

    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const burst = reduced ? 1 : Math.min(1, t / 1.8);
      const ease = 1 - Math.pow(1 - burst, 3);
      ctx.clearRect(0, 0, w, h);
      ctx.shadowBlur = 12;
      const cx = w / 2, cy = h / 2;
      for (const p of parts) {
        const depth = 0.6 + p.z * 0.8;
        const tx = p.bx * w + Math.sin(t * p.speed + p.by * 6 + p.phase) * 40 * depth;
        const ty = p.by * h + Math.sin(t * p.speed * 1.3 + p.bx * 8) * 28 * depth + Math.cos(t * 0.4 + p.z * 5) * 14;
        let x = cx + (tx - cx) * ease;
        let y = cy + (ty - cy) * ease;
        const dx = x - mouse.x, dy = y - mouse.y;
        const d = Math.hypot(dx, dy);
        const near = d < 140 ? 1 - d / 140 : 0;
        p.glow += (near - p.glow) * 0.12;
        p.ox += ((dx / (d || 1)) * near * 26 + mouse.vx * near * 0.4 + Math.sin(t * 6 + p.phase) * near * 8 - p.ox) * 0.1;
        p.oy += ((dy / (d || 1)) * near * 26 + mouse.vy * near * 0.4 - p.oy) * 0.1;
        x += p.ox; y += p.oy;
        const c = colorAt(p.hue + t * 0.35);
        const s = p.size * depth * (1 + p.glow * 0.8);
        ctx.globalAlpha = Math.min(1, p.op + p.glow * 0.3) * (0.3 + 0.7 * ease);
        ctx.fillStyle = c; ctx.shadowColor = c;
        ctx.shadowBlur = 12 + p.glow * 18;
        if (p.star) star(x, y, s * (0.8 + 0.3 * Math.sin(t * 3 + p.phase)));
        else { ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); }
      }
      mouse.vx *= 0.9; mouse.vy *= 0.9;
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`gemini-particles pointer-events-none ${className}`} />;
}
