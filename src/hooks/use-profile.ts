import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CefrLevel } from "@/lib/languages";

export type Profile = {
  id: string;
  display_name: string | null;
  native_lang: string;
  learning_lang: string;
  level: CefrLevel;
  xp: number;
  streak: number;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = async (patch: Partial<Pick<Profile, "native_lang" | "learning_lang" | "level" | "display_name">>) => {
    if (!profile) return;
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", profile.id).select().single();
    if (!error && data) setProfile(data as Profile);
    return { data, error };
  };

  return { profile, loading, refresh, update };
}