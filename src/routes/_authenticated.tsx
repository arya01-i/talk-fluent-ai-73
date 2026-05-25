import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, MessageSquare, Mic, Phone, Video, BookOpen, ListChecks, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
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

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <Link to="/app" className="flex items-center gap-2 font-bold text-xl px-5 py-5">
          <Sparkles className="size-5 text-primary" /> Anya
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to as never} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/80",
              )}>
                <Icon className="size-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}><LogOut className="size-4 mr-2" /> Log out</Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
          <Link to="/app" className="flex items-center gap-2 font-bold"><Sparkles className="size-5 text-primary" /> Anya</Link>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut className="size-4" /></Button>
        </header>
        <main className="flex-1 overflow-auto"><Outlet /></main>
        <nav className="md:hidden grid grid-cols-5 border-t bg-card text-xs">
          {NAV.slice(0, 5).map((n) => {
            const Icon = n.icon;
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to as never} className={cn("flex flex-col items-center gap-1 py-2", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="size-4" />{n.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}