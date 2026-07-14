import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/AdminXYG/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <div><p className="text-sm font-semibold">Application</p><p className="text-xs text-muted-foreground">CashSpot v1.0 — production ready</p></div>
        <div><p className="text-sm font-semibold">AI Provider</p><p className="text-xs text-muted-foreground">Lovable AI Gateway · openai/gpt-5.5-nano</p></div>
        <div><p className="text-sm font-semibold">Auth Providers</p><p className="text-xs text-muted-foreground">Google · Email / Password</p></div>
      </div>
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <p className="text-sm font-semibold">Support hotline</p>
        <p className="text-xs text-muted-foreground">Shown to users on their profile page.</p>
        <div className="flex gap-2">
          <a href="tel:01033022988" className="brand-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-brand-foreground"><Phone className="h-3 w-3" /> 01033022988</a>
          <a href="https://wa.me/201033022988" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
        </div>
      </div>
      <p className="text-xs text-muted-foreground pt-2">Powered by <span className="font-semibold text-foreground">Mostafa Ahmed</span></p>
    </div>
  );
}
