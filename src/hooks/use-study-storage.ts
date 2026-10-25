import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Browser-only, account-scoped study preferences; no cloud sync is implied. */
export function useStudyStorage<T>(name: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      const storageKey = `study:${data.user.id}:${name}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setValue(JSON.parse(saved) as T);
      } catch { /* Unavailable browser storage leaves this session usable. */ }
      setKey(storageKey);
    });
    return () => { active = false; };
  }, [name]);
  const update = (next: T) => {
    setValue(next);
    if (key) { try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Session still works. */ } }
  };
  return { value, update, ready: key !== null };
}