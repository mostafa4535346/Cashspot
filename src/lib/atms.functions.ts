import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// AI: predict cash availability for an ATM based on recent reports
export const predictAtm = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ atmId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: reports } = await sb
      .from("reports")
      .select("kind, created_at")
      .eq("atm_id", data.atmId)
      .order("created_at", { ascending: false })
      .limit(20);

    const now = Date.now();
    let score = 50;
    let queue = 0;
    for (const r of reports ?? []) {
      const ageH = (now - new Date(r.created_at as string).getTime()) / 3600000;
      const w = Math.max(0, 1 - ageH / 24);
      if (r.kind === "cash_available" || r.kind === "cardless_working") score += 20 * w;
      else if (r.kind === "no_cash") score -= 25 * w;
      else if (r.kind === "broken") score -= 40 * w;
      else if (r.kind === "busy") { score -= 5 * w; queue += 2; }
    }
    const key = process.env.LOVABLE_API_KEY;
    let reasoning = "Based on recent community reports.";
    if (key && (reports ?? []).length > 0) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "openai/gpt-5.5-nano",
            messages: [
              { role: "system", content: "You explain ATM cash availability in one short sentence." },
              { role: "user", content: `Recent reports: ${JSON.stringify(reports?.slice(0, 5))}. Give a 1-sentence explanation.` },
            ],
          }),
        });
        if (resp.ok) {
          const j: { choices?: Array<{ message?: { content?: string } }> } = await resp.json();
          reasoning = j.choices?.[0]?.message?.content ?? reasoning;
        }
      } catch { /* ignore */ }
    }
    return {
      probability: Math.max(5, Math.min(95, Math.round(score))),
      queue,
      reasoning,
    };
  });

// Report ATM (auth + spam guard)
export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      atmId: z.string().uuid(),
      kind: z.enum(["cash_available", "no_cash", "broken", "busy", "deposit_working", "cardless_working"]),
      comment: z.string().max(500).optional(),
      photoUrl: z.string().url().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await context.supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("atm_id", data.atmId)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= 3) {
      throw new Error("Rate limit: too many reports for this ATM in the last hour.");
    }
    const { error } = await context.supabase.from("reports").insert({
      atm_id: data.atmId,
      user_id: context.userId,
      kind: data.kind,
      comment: data.comment ?? null,
      photo_url: data.photoUrl ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Toggle favorite
export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ atmId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("favorites").select("id").eq("user_id", context.userId).eq("atm_id", data.atmId).maybeSingle();
    if (existing) {
      await context.supabase.from("favorites").delete().eq("id", existing.id);
      return { favorited: false };
    }
    await context.supabase.from("favorites").insert({ user_id: context.userId, atm_id: data.atmId });
    return { favorited: true };
  });

// Create ATM
export const createAtm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      name: z.string().min(2).max(120),
      bankId: z.string().uuid().nullable(),
      lat: z.number(),
      lng: z.number(),
      address: z.string().max(200).optional(),
      city: z.string().max(80).optional(),
      country: z.string().min(2).max(3),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("atms").insert({
      name: data.name, bank_id: data.bankId, lat: data.lat, lng: data.lng,
      address: data.address ?? null, city: data.city ?? null, country: data.country,
      created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
