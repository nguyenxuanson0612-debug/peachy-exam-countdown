import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Scale,
  Lightbulb,
  Users,
  Map,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Countdown, Pomodoro } from "@/components/LoveCorner";
import { SearchBox } from "@/components/SearchBox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FloatingChatProvider, useFloatingChat } from "@/components/FloatingChat";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});

const NAV = [
  { cat: "luat", label: "Luật", icon: Scale },
  { cat: "chuyen-mon", label: "Chuyên môn & Bài giảng", icon: BookOpen },
  { cat: "tinh-huong", label: "Tình huống sư phạm", icon: Users },
  { cat: "tips", label: "Tip ôn thi", icon: Lightbulb },
] as const;

function NavLinks({ onClick }: { onClick?: () => void }) {
  const chat = useFloatingChat();
  const cls =
    "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-primary-soft hover:text-accent-foreground";
  const active = {
    className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
  };
  return (
    <>
      {NAV.map((n) => (
        <Link
          key={n.cat}
          to="/hoc/$category"
          params={{ category: n.cat }}
          search={{ to: undefined }}
          className={cls}
          activeProps={active}
          onClick={onClick}
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
      <Link to="/thi" className={cls} activeProps={active} onClick={onClick}>
        <ClipboardList className="h-4 w-4" /> Thi 180 phút
      </Link>
      <Link to="/lo-trinh" className={cls} activeProps={active} onClick={onClick}><Map className="h-4 w-4" /> Lộ trình học tập</Link>
      <Button
        variant="ghost"
        className={`${cls} ${chat.open ? active.className : ""}`}
        aria-expanded={chat.open}
        aria-controls="floating-ai-chat"
        onClick={() => {
          onClick?.();
          chat.show();
        }}
      >
        <MessageCircle className="h-4 w-4" /> Hỏi đáp AI
      </Button>
    </>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <FloatingChatProvider>
      <div className="min-h-screen">
        <header className="app-header sticky top-0 z-40 border-b">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-2.5 md:px-5">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="rounded-md p-2 lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col gap-1 pt-12">
                <NavLinks onClick={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link
              to="/"
              className="flex items-center gap-1.5 font-display text-lg font-bold text-primary"
            >
              <Heart className="h-5 w-5 fill-current" />
              <span className="hidden sm:inline">Ôn Thi Viên Chức</span>
            </Link>
            <div className="order-last w-full md:order-none md:mx-4 md:w-auto md:flex-1">
              <SearchBox />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs font-semibold text-primary xl:inline">
                💗 Tiếp sức từ người yêu
              </span>
              <Countdown />
              <Pomodoro />
              <button
                aria-label="Đăng xuất"
                className="rounded-full p-2 text-muted-foreground hover:bg-primary-soft"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-5 pb-2 lg:flex">
            <NavLinks />
          </nav>
        </header>
        <main className="study-workspace mx-auto max-w-7xl px-3 py-7 md:px-5">
          <Outlet />
        </main>
      </div>
    </FloatingChatProvider>
  );
}
