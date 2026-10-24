import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { docsQuery } from "@/lib/docs";
import { CATEGORIES, type CategoryKey } from "@/lib/docx";

type Entry = { category: string; to: string; title: string; text: string; heading: boolean };

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function SearchBox() {
  const { data: docs = [] } = useQuery(docsQuery);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  const index = useMemo<Entry[]>(() => {
    if (typeof DOMParser === "undefined") return [];
    const out: Entry[] = [];
    for (const d of docs) {
      if (!(d.category in CATEGORIES)) continue;
      const dom = new DOMParser().parseFromString(`<div>${d.html}</div>`, "text/html");
      let currentHeading = d.title;
      dom.querySelectorAll("p,h1,h2,h3,li").forEach((el, i) => {
        const text = (el.textContent ?? "").trim();
        if (!text) return;
        const heading = el.hasAttribute("data-toc");
        if (heading) currentHeading = text.slice(0, 100);
        out.push({ category: d.category, to: `${d.id}:${i}`, title: heading ? text.slice(0, 100) : currentHeading, text, heading });
      });
    }
    return out;
  }, [docs]);

  const results = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const hits = index.filter((e) => norm(e.text).includes(n));
    hits.sort((a, b) => Number(b.heading) - Number(a.heading));
    return hits.slice(0, 30);
  }, [q, index]);

  const go = (e: Entry) => {
    setOpen(false); setQ("");
    navigate({ to: "/hoc/$category", params: { category: e.category }, search: { to: e.to } });
  };

  const snippet = (t: string) => {
    const i = norm(t).indexOf(norm(q.trim()));
    return (i > 40 ? "…" : "") + t.slice(Math.max(0, i - 40), i + 90);
  };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Tìm từ khóa, Điều luật, tình huống…"
        className="h-10 w-full rounded-full border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[60vh] overflow-auto rounded-xl border bg-popover p-1 shadow-soft">
          {results.length === 0 && <p className="p-3 text-sm text-muted-foreground">Không tìm thấy kết quả</p>}
          {results.map((r, i) => (
            <button key={i} onMouseDown={() => go(r)} className="block w-full rounded-lg p-2.5 text-left hover:bg-accent">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 font-semibold text-accent-foreground">
                  {CATEGORIES[r.category as CategoryKey]?.label}
                </span>
                <span className="truncate font-semibold">{r.title}</span>
              </div>
              {!r.heading && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet(r.text)}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
