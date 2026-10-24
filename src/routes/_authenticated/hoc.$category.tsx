import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpenText, Fish, PencilLine } from "lucide-react";
import { docsQuery } from "@/lib/docs";
import { CATEGORIES, type CategoryKey } from "@/lib/docx";
import { Reader } from "@/components/Reader";
import { FishboneMode, PracticeMode } from "@/components/StudyModes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/hoc/$category")({
  validateSearch: (s: Record<string, unknown>) => ({ to: typeof s.to === "string" ? s.to : undefined }),
  beforeLoad: ({ params }) => { if (!(params.category in CATEGORIES)) throw notFound(); },
  loader: ({ context }) => context.queryClient.ensureQueryData(docsQuery),
  head: ({ params }) => {
    const c = CATEGORIES[params.category as CategoryKey];
    const title = `${c?.label ?? "Học"} — Ôn Thi Viên Chức`;
    return { meta: [
      { title }, { name: "description", content: c?.desc ?? "" },
      { property: "og:title", content: title }, { property: "og:description", content: c?.desc ?? "" },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: StudyPage,
});

function StudyPage() {
  const { category } = Route.useParams();
  const { to } = Route.useSearch();
  const { data } = useSuspenseQuery(docsQuery);
  const docs = data.filter((d) => d.category === category);
  const c = CATEGORIES[category as CategoryKey];
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{c.label}</h1>
        <p className="text-muted-foreground">{c.desc}</p>
      </div>
      <Tabs defaultValue="doc" key={category}>
        <TabsList className="mb-4 h-auto flex-wrap bg-card shadow-soft">
          <TabsTrigger value="doc" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BookOpenText className="h-4 w-4" /> Đọc tài liệu</TabsTrigger>
          <TabsTrigger value="learn" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Fish className="h-4 w-4" /> Chế độ Học thi</TabsTrigger>
          <TabsTrigger value="practice" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><PencilLine className="h-4 w-4" /> Chế độ Ôn tập</TabsTrigger>
        </TabsList>
        <TabsContent value="doc"><Reader docs={docs} category={category} target={to} /></TabsContent>
        <TabsContent value="learn"><FishboneMode category={category} /></TabsContent>
        <TabsContent value="practice"><PracticeMode category={category} /></TabsContent>
      </Tabs>
    </div>
  );
}
