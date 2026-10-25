import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, BookOpen, Brain, Clock, Heart, MessageCircle, Scale, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import cinematicStudy from "@/assets/cinematic-study.jpg";
import { GeminiParticleCanvas } from "@/components/GeminiParticleCanvas";
import { StarMatrixCanvas } from "@/components/StarMatrixCanvas";
import flashcardsStudy from "@/assets/flashcards-study.jpg";
import studyPlanner from "@/assets/study-planner.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ôn Thi Viên Chức — Học luật, tình huống, thi thử có AI chấm" },
      { name: "description", content: "Nền tảng ôn thi viên chức độc quyền: lộ trình kiến thức toàn diện, luyện thi 180 phút và gia sư AI đồng hành." },
      { property: "og:title", content: "Ôn Thi Viên Chức" },
      { property: "og:description", content: "Học luật, tình huống sư phạm, thi thử 180 phút có AI chấm điểm chi tiết." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Scale, title: "Luật chia chương, điều", text: "Nắm vững nền tảng pháp luật. Hệ thống hóa kiến thức theo từng chương, từng điều.", label: "NỀN TẢNG" },
  { icon: Users, title: "Tình huống sư phạm", text: "Rèn tư duy xử lý tình huống, vững vàng trước những bài toán thực tế của nghề giáo.", label: "THỰC TIỄN" },
  { icon: Brain, title: "Sơ đồ xương cá", text: "Kết nối ý chính và từ khóa. Hiểu sâu bản chất, ghi nhớ kiến thức một cách có hệ thống.", label: "TƯ DUY" },
  { icon: MessageCircle, title: "Hỏi đáp 1:1 với AI", text: "Một người đồng hành riêng, sẵn sàng giải đáp và cùng bạn tháo gỡ từng câu hỏi.", label: "ĐỒNG HÀNH" },
  { icon: Clock, title: "Thi thử 180 phút", text: "Trải nghiệm phòng thi, rèn bản lĩnh thời gian và nhận đánh giá chi tiết từ AI.", label: "BỨT PHÁ" },
  { icon: BookOpen, title: "Ôn tập đa dạng", text: "Củng cố từng phần kiến thức qua trắc nghiệm, câu hỏi nhiều lựa chọn và tự luận.", label: "CỦNG CỐ" },
];

function Index() {
  const reducedMotion = useReducedMotion();
  const entrance = reducedMotion ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.85, ease: "easeOut" as const } };
  return (
    <div className="landing-page min-h-screen">
      <header className="landing-header">
        <Link to="/" className="flex items-center gap-2.5 font-display text-base font-extrabold text-foreground"><span className="brand-symbol"><Sparkles className="size-5" /></span> Ôn Thi Viên Chức</Link>
        <nav className="flex items-center gap-6" aria-label="Điều hướng chính">
          <a href="#hanh-trinh" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Hành trình ôn thi</a>
          <Button variant="outline" asChild className="rounded-full border-primary/25 bg-card/60 px-5"><Link to="/auth">Đăng nhập <ArrowUpRight /></Link></Button>
        </nav>
      </header>
      <section className="cinematic-hero">
        <img src={cinematicStudy} width={1920} height={1024} alt="Cuốn sách mở giữa không gian kính và dải lụa hồng ngập ánh sáng" className="hero-image" fetchPriority="high" />
        <div className="hero-veil" />
        <GeminiParticleCanvas />
        <motion.div {...entrance} className="hero-content">
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase text-accent-foreground"><Sparkles className="size-4" /> Nền tảng ôn thi viên chức độc quyền</p>
          <h1 className="hero-title font-display">Ôn Thi Viên Chức<span className="relative isolate mt-2 block text-primary"><span className="hero-aurora" aria-hidden="true" />Tri thức vững vàng.<br />Tương lai rộng mở.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">Một hành trình học tập được chăm chút cho bạn: kiến thức có hệ thống, luyện thi chuyên sâu và trí tuệ nhân tạo đồng hành — để mỗi ngày ôn tập là một bước tiến tự tin.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button size="lg" className="h-12 rounded-full px-7 shadow-elegant" asChild><Link to="/auth">Bắt đầu hành trình <ArrowUpRight /></Link></Button>
            <a href="#hanh-trinh" className="flex items-center gap-2 text-sm font-semibold text-foreground">Khám phá <ArrowDown className="size-4" /></a>
          </div>
          <p className="mt-9 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Heart className="size-3.5 text-primary" /> Tiếp sức từ người yêu</p>
        </motion.div>
        <div className="hero-caption"><span className="h-px w-8 bg-primary/50" /> Học sâu. Nhớ lâu. Tự tin bước tới.</div>
      </section>
      <div className="landing-continuation">
      <StarMatrixCanvas />
      <section id="hanh-trinh" className="feature-section">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-3 text-xs font-semibold uppercase text-primary">ĐƯỢC THIẾT KẾ CHO HÀNH TRÌNH CỦA BẠN</p><h2 className="font-display text-3xl font-bold">Từng bước nhỏ. Một mục tiêu lớn.</h2></div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Từ nền tảng kiến thức đến bản lĩnh phòng thi,<br className="hidden sm:block" /> tất cả trong một không gian học tập.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <motion.div className="feature-card h-full" whileHover={reducedMotion ? {} : { y: -7, scale: 1.015 }} transition={{ type: "spring", stiffness: 260, damping: 19 }}>
                <Link to="/auth" className="block h-full p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center justify-between"><span className={`feature-icon feature-icon-${i % 3}`}><f.icon className="size-5" /></span><span className="text-xs font-medium text-muted-foreground">0{i + 1}</span></div>
                  <p className="mt-5 text-[10px] font-semibold text-primary">{f.label}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-bold">{f.title}</h3><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="study-showcase" aria-label="Flash Card và lộ trình học tập">
        <article className="showcase-row">
          <img src={flashcardsStudy} width={1024} height={768} loading="lazy" alt="Bộ thẻ ghi nhớ hồng trắng với dấu trang san hô" />
          <div><p className="mb-3 text-xs font-semibold uppercase text-primary">FLASH CARD</p><h2 className="font-display text-3xl font-bold leading-tight">Ghi nhớ thông minh,<br />nhanh chóng với Flash Card</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Từ tài liệu của bạn đến những thẻ kiến thức trọng tâm. Ôn lại từng chủ đề, đánh dấu phần đã nhớ và tập trung vào phần cần củng cố.</p><Button asChild className="mt-6"><Link to="/hoc/$category" params={{ category: "luat" }} search={{ to: undefined, mode: "flashcard" }}>Khám phá Flash Card <ArrowUpRight /></Link></Button></div>
        </article>
        <article className="showcase-row showcase-reverse">
          <img src={studyPlanner} width={1024} height={768} loading="lazy" alt="Sổ kế hoạch học tập với dấu hoàn thành và các bậc tiến bộ" />
          <div><p className="mb-3 text-xs font-semibold uppercase text-primary">LỘ TRÌNH CỦA RIÊNG BẠN</p><h2 className="font-display text-3xl font-bold leading-tight">Cá nhân hóa<br />lộ trình học tập</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Sắp xếp mục tiêu theo từng môn, chọn ngày học phù hợp và nhìn thấy tiến độ của mình. Hành trình rõ ràng, nhịp học vừa sức.</p><Button asChild variant="outline" className="mt-6"><Link to="/lo-trinh">Tạo lộ trình của bạn <ArrowUpRight /></Link></Button></div>
        </article>
      </section>
      <footer className="landing-footer"><span className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Ôn Thi Viên Chức</span><span>Tri thức hôm nay. Vững bước ngày mai.</span></footer>
      </div>
    </div>
  );
}
