import { useEffect, useRef } from "react";

/** Decorative, container-sized wave grid; reads its palette from the design tokens. */
export function StarMatrixCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return;
    const styles = getComputedStyle(canvas);
    const palette = ["--star-blush", "--star-pink", "--star-violet", "--star-coral"].map((token) => {
      probe.fillStyle = styles.getPropertyValue(token).trim();
      probe.fillRect(0, 0, 1, 1);
      return Array.from(probe.getImageData(0, 0, 1, 1).data).slice(0, 3);
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frameId = 0, visible = true, last = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; });
    intersection.observe(canvas);
    resize();
    const draw = (now: number) => {
      if ((visible && !document.hidden && now - last > 32) || reduced.matches) {
        last = now;
        const time = reduced.matches ? 0 : now / 1000;
        ctx.clearRect(0, 0, width, height);
        const spacing = width < 600 ? 20 : 22;
        const rows = Math.ceil(height / spacing) + 4;
        const cols = Math.ceil(width / spacing) + 4;
        for (let row = -2; row < rows; row++) {
          for (let col = -2; col < cols; col++) {
            const wave = Math.sin(col * .12 + row * .13 - time * .7);
            const swell = Math.cos(row * .15 - col * .045 + time * .45);
            const x = col * spacing + Math.sin(row * .12 + time * .4) * 9;
            const y = row * spacing + wave * 14 + swell * 7;
            const size = 1.1 + (wave + 1) * .75;
            const hue = ((col * .022 + row * .035 + time * .18) % palette.length + palette.length) % palette.length;
            const a = palette[Math.floor(hue)] ?? [249, 168, 212];
            const b = palette[(Math.floor(hue) + 1) % palette.length] ?? a;
            const mix = hue % 1;
            const rgb = a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * mix));
            ctx.fillStyle = `rgb(${rgb.join(",")})`;
            ctx.globalAlpha = .22 + (wave + 1) * .16;
            ctx.beginPath();
            ctx.moveTo(x, y - size * 1.8);
            ctx.quadraticCurveTo(x + size * .2, y - size * .2, x + size * 1.8, y);
            ctx.quadraticCurveTo(x + size * .2, y + size * .2, x, y + size * 1.8);
            ctx.quadraticCurveTo(x - size * .2, y + size * .2, x - size * 1.8, y);
            ctx.quadraticCurveTo(x - size * .2, y - size * .2, x, y - size * 1.8);
            ctx.fill();
          }
        }
      }
      if (!reduced.matches) frameId = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frameId); frameId = requestAnimationFrame(draw); };
    reduced.addEventListener("change", restart);
    restart();
    return () => { cancelAnimationFrame(frameId); observer.disconnect(); intersection.disconnect(); reduced.removeEventListener("change", restart); };
  }, []);
  return <canvas ref={ref} className={`star-matrix pointer-events-none ${className}`} aria-hidden="true" />;
}