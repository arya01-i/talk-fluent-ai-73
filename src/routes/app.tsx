import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sparkles, LayoutDashboard, MessageSquare, Mic, Phone, Video, BookOpen, ListChecks, Settings, LogOut, GraduationCap, Menu, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AuthLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/learn/lessons", label: "Lessons", icon: GraduationCap },
  { to: "/app/activities", label: "Activities", icon: PartyPopper },
  { to: "/app/learn/text", label: "Text chat", icon: MessageSquare },
  { to: "/app/learn/voice", label: "Voice practice", icon: Mic },
  { to: "/app/learn/voice-call", label: "Voice call", icon: Phone },
  { to: "/app/learn/video-call", label: "Video avatar", icon: Video },
  { to: "/app/vocabulary", label: "Vocabulary", icon: BookOpen },
  { to: "/app/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function AuthLayout() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) nav({ to: "/login" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) nav({ to: "/login" });
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [nav]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const logout = async () => { await supabase.auth.signOut(); nav({ to: "/" }); };

  // Onboarding (language selection) is a full-screen flow — no sidebar/header.
  if (path.startsWith("/app/onboarding")) {
    return <div className="min-h-screen bg-background"><Outlet /></div>;
  }

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex-1 px-3 space-y-1">
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = n.exact ? path === n.to : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to as never} onClick={onNav} className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
            active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/80",
          )}>
            <Icon className="size-4" />{n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <Link to="/app" className="flex items-center gap-2 font-bold text-xl px-5 py-5">
          <Sparkles className="size-5 text-primary" /> Lingvo
        </Link>
        <NavLinks />
        <div className="p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}><LogOut className="size-4 mr-2" /> Log out</Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost"><Menu className="size-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">
                <VisuallyHidden><SheetTitle>Navigation</SheetTitle></VisuallyHidden>
                <Link to="/app" onClick={() => setOpen(false)} className="flex items-center gap-2 font-bold text-xl px-5 py-5">
                  <Sparkles className="size-5 text-primary" /> Lingvo
                </Link>
                <NavLinks onNav={() => setOpen(false)} />
                <div className="p-3 border-t">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setOpen(false); logout(); }}>
                    <LogOut className="size-4 mr-2" /> Log out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/app" className="flex items-center gap-2 font-bold"><Sparkles className="size-5 text-primary" /> Lingvo</Link>
          </div>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut className="size-4" /></Button>
        </header>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}