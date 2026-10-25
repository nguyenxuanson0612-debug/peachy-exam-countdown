import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarMatrixCanvas } from "@/components/StarMatrixCanvas";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — Ôn Thi Viên Chức" },
      { name: "description", content: "Đăng nhập hoặc tạo tài khoản để bắt đầu ôn thi viên chức." },
      { property: "og:title", content: "Đăng nhập — Ôn Thi Viên Chức" },
      { property: "og:description", content: "Đăng nhập hoặc tạo tài khoản để bắt đầu ôn thi viên chức." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/hoc/$category", params: { category: "luat" }, search: { to: undefined } }); });
  }, [navigate]);

  const google = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { toast.error("Đăng nhập Google thất bại"); setLoading(false); return; }
    if (r.redirected) return;
    navigate({ to: "/hoc/$category", params: { category: "luat" }, search: { to: undefined } });
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error("Email hoặc mật khẩu không đúng"); return; }
    navigate({ to: "/hoc/$category", params: { category: "luat" }, search: { to: undefined } });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.");
  };

  return (
    <div className="auth-page grid min-h-screen lg:grid-cols-2">
      <div className="auth-intro relative hidden flex-col justify-between overflow-hidden p-12 text-foreground lg:flex">
        <StarMatrixCanvas className="auth-star-matrix" />
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><Heart className="h-6 w-6 fill-current" /> Ôn Thi Viên Chức</Link>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight">Tri thức vững vàng.<br /><span className="text-primary">Tương lai rộng mở.</span></h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">Không gian học tập dành riêng cho hành trình ôn thi viên chức của bạn. Mỗi ngày một bước tiến, mỗi kiến thức một nền tảng.</p>
        </div>
        <p className="text-sm opacity-80">💗 Tiếp sức từ người yêu</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="glass-surface w-full max-w-md rounded-lg p-8 shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Chào mừng bạn</h2>
          <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để tiếp tục hành trình ôn thi</p>

          <Button variant="outline" className="mt-6 h-11 w-full gap-2" onClick={google} disabled={loading}>
            <GoogleIcon /> Tiếp tục với Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> hoặc <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">Đăng nhập</TabsTrigger>
              <TabsTrigger value="up">Đăng ký</TabsTrigger>
            </TabsList>
            <TabsContent value="in">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Mật khẩu</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="h-11 w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Đăng nhập</Button>
              </form>
            </TabsContent>
            <TabsContent value="up">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <div className="space-y-1.5"><Label>Họ tên</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Mật khẩu (tối thiểu 6 ký tự)</Label><Input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="h-11 w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Tạo tài khoản</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
