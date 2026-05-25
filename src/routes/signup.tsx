import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Anya" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      const raw = sessionStorage.getItem("pending_prefs");
      if (raw) {
        try {
          const p = JSON.parse(raw);
          await supabase.from("profiles").update({
            display_name: name || undefined,
            native_lang: p.native, learning_lang: p.target, level: p.level,
          }).eq("id", data.user!.id);
          sessionStorage.removeItem("pending_prefs");
        } catch {}
      }
      nav({ to: "/app" });
    } else {
      toast.success("Check your email to confirm your account.");
      nav({ to: "/login" });
    }
  };

  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-center text-muted-foreground">Have an account? <Link to="/login" className="text-primary underline">Log in</Link></p>
      </form>
    </AuthShell>
  );
}