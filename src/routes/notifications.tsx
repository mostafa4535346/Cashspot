import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { Bell } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type N = Database["public"]["Tables"]["notifications"]["Row"];

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState<N[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100).then(({ data }) => setItems(data ?? []));
  }, [user]);
  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <h1 className="font-display text-xl font-bold">{t("notifications")}</h1>
      </header>
      <div className="mx-auto max-w-lg p-4 space-y-2">
        {items.length === 0 && (
          <div className="py-16 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p></div>
        )}
        {items.map((n) => (
          <div key={n.id} className={`rounded-2xl border p-4 ${n.read ? "bg-card" : "bg-accent"}`}>
            <p className="font-medium text-sm">{n.title}</p>
            {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
            <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
