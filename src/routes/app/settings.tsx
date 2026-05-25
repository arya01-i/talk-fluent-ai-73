import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, CEFR_LEVELS, type CefrLevel } from "@/lib/languages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Anya" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, update } = useProfile();
  const nav = useNavigate();
  const [name, setName] = useState("");
  useEffect(() => { if (profile) setName(profile.display_name ?? ""); }, [profile]);
  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="p-5 space-y-4">
        <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => update({ display_name: name })} /></div>
        <div><Label>My language</Label>
          <Select value={profile.native_lang} onValueChange={(v) => update({ native_lang: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Learning</Label>
          <Select value={profile.learning_lang} onValueChange={(v) => update({ learning_lang: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.filter((l) => l !== profile.native_lang).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Level</Label>
          <Select value={profile.level} onValueChange={(v) => update({ level: v as CefrLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>
      <Button variant="destructive" onClick={async () => { await supabase.auth.signOut(); toast.success("Logged out"); nav({ to: "/" }); }}>Log out</Button>
    </div>
  );
}