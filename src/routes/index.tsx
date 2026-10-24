import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Brain, Clock, Heart, MessageCircle, Scale, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ôn Thi Viên Chức — Học luật, tình huống, thi thử có AI chấm" },
      { name: "description", content: "Ôn thi viên chức giáo dục: luật chia Chương–Điều, sơ đồ xương cá, trắc nghiệm, thi thử 180 phút và AI chấm điểm." },
      { property: "og:title", content: "Ôn Thi Viên Chức" },
      { property: "og:description", content: "Học luật, tình huống sư phạm, thi thử 180 phút có AI chấm điểm chi tiết." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Scale, title: "Luật chia Chương → Điều", text: "Tải file Word, mục lục tự tạo, bấm là cuộn tới đúng Điều." },
  { icon: Users, title: "Tình huống sư phạm", text: "Mỗi tình huống một mục riêng, đọc liền mạch không bị cắt." },
  { icon: Brain, title: "Sơ đồ xương cá", text: "Từ khóa gợi nhớ, ý nghĩa từng câu — học nhanh nhớ lâu." },
  { icon: BookOpen, title: "Ôn tập đa dạng", text: "Tự luận, chọn nhiều đáp án, trắc nghiệm một đáp án." },
  { icon: Clock, title: "Thi thử 180 phút", text: "Lưu nháp làm tiếp, AI chấm điểm, chỉ rõ chỗ sai." },
  { icon: MessageCircle, title: "Hỏi đáp 1:1 với AI", text: "Gia sư AI giải đáp dựa trên tài liệu của bạn." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <div className="flex items-center gap-2 font-bold text-primary"><Heart className="h-5 w-5 fill-current" /> Ôn Thi Viên Chức</div>
        <Button asChild><Link to="/auth">Đăng nhập</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
        <p className="mb-4 inline-block rounded-full bg-primary-soft px-4 py-1 text-sm font-semibold text-accent-foreground">💗 Tiếp sức từ người yêu</p>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">Ôn thi viên chức <span className="text-primary">nhẹ nhàng</span> mà chắc chắn</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Một nơi cho tất cả: luật, chuyên môn, tình huống sư phạm, phòng thi 180 phút và gia sư AI luôn bên bạn.</p>
        <Button size="lg" className="mt-8 h-12 px-8 text-base shadow-soft" asChild><Link to="/auth">Bắt đầu ôn thi</Link></Button>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl bg-card p-6 shadow-soft">
            <f.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
