import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertRole(context: any, allowed: string[]) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.some((r: string) => allowed.includes(r));
  if (!ok) throw new Error("Forbidden");
  return roles;
}

export const ADMIN_SECTIONS = ["users", "atms", "reports", "banks", "analytics", "logs", "settings"] as const;

export const getAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role, permissions").eq("user_id", context.userId);
    const rows = (data ?? []) as { role: string; permissions: string[] | null }[];
    const roles = rows.map((r) => r.role);
    const isOwner = roles.includes("owner");
    const permsSet = new Set<string>();
    rows.forEach((r) => (r.permissions ?? []).forEach((p) => permsSet.add(p)));
    return {
      isStaff: roles.some((r) => ["owner", "admin", "moderator"].includes(r)),
      isOwner,
      roles,
      permissions: isOwner ? [...ADMIN_SECTIONS] : Array.from(permsSet),
    };
  });

export const getAdminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, ["owner", "admin", "moderator"]);
    const [users, atms, reports, banks] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("atms").select("id", { count: "exact", head: true }),
      context.supabase.from("reports").select("id", { count: "exact", head: true }),
      context.supabase.from("banks").select("id", { count: "exact", head: true }),
    ]);
    const { data: recentReports } = await context.supabase
      .from("reports").select("id, kind, created_at, atm_id").order("created_at", { ascending: false }).limit(10);
    return {
      counts: {
        users: users.count ?? 0,
        atms: atms.count ?? 0,
        reports: reports.count ?? 0,
        banks: banks.count ?? 0,
      },
      recentReports: recentReports ?? [],
    };
  });

export const listAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ table: z.enum(["profiles", "atms", "reports", "banks", "activity_logs", "notifications"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner", "admin", "moderator"]);
    const { data: rows } = await context.supabase.from(data.table).select("*").order("created_at", { ascending: false }).limit(200);
    return { rows: rows ?? [] };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["admin", "moderator", "user"]),
    action: z.enum(["grant", "revoke"]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner"]); // only owner manages roles
    if (data.action === "grant") {
      await context.supabase.from("user_roles").upsert({ user_id: data.userId, role: data.role, granted_by: context.userId }, { onConflict: "user_id,role" });
    } else {
      await context.supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    }
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: `role.${data.action}`, target_type: "user", target_id: data.userId, metadata: { role: data.role },
    });
    return { ok: true };
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner", "admin"]);
    await context.supabase.from("profiles").update({ suspended: data.suspended }).eq("id", data.userId);
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: data.suspended ? "user.suspend" : "user.unsuspend", target_type: "user", target_id: data.userId,
    });
    return { ok: true };
  });

export const moderateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ reportId: z.string().uuid(), approved: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner", "admin", "moderator"]);
    await context.supabase.from("reports").update({ approved: data.approved, flagged: !data.approved }).eq("id", data.reportId);
    return { ok: true };
  });

export const deleteAtm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ atmId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner", "admin"]);
    await context.supabase.from("atms").delete().eq("id", data.atmId);
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: "atm.delete", target_type: "atm", target_id: data.atmId,
    });
    return { ok: true };
  });

export const broadcastNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(1000),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users } = await supabaseAdmin.from("profiles").select("id");
    const rows = (users ?? []).map((u: { id: string }) => ({
      user_id: u.id,
      title: data.title,
      body: data.body,
    }));
    if (rows.length) await supabaseAdmin.from("notifications").insert(rows);
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: "broadcast.send", target_type: "all_users",
      metadata: { title: data.title, recipients: rows.length },
    });
    return { ok: true, recipients: rows.length };
  });

export const addAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    email: z.string().email(),
    role: z.enum(["admin", "moderator"]).default("admin"),
    permissions: z.array(z.enum(ADMIN_SECTIONS)).min(1).default([...ADMIN_SECTIONS]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("id, email").ilike("email", data.email).maybeSingle();
    if (!profile) throw new Error("No user found with that email. Ask them to sign up first.");
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: profile.id, role: data.role, granted_by: context.userId, permissions: data.permissions },
      { onConflict: "user_id,role" },
    );
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: `role.grant`, target_type: "user",
      target_id: profile.id, metadata: { role: data.role, permissions: data.permissions, via: "email" },
    });
    return { ok: true, email: profile.email };
  });

export const setAdminPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["admin", "moderator"]),
    permissions: z.array(z.enum(ADMIN_SECTIONS)),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles")
      .update({ permissions: data.permissions })
      .eq("user_id", data.userId).eq("role", data.role);
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: "role.permissions", target_type: "user",
      target_id: data.userId, metadata: { role: data.role, permissions: data.permissions },
    });
    return { ok: true };
  });

export const getAdminAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, ["owner", "admin", "moderator"]);
    const { data: atms } = await context.supabase
      .from("atms").select("id, city, country, status, created_at");
    const rows = (atms ?? []) as { id: string; city: string | null; country: string; status: string; created_at: string }[];
    const byCity = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byStatus = new Map<string, number>();
    const byDay = new Map<string, number>();
    for (const a of rows) {
      const c = (a.city ?? "Unknown").trim() || "Unknown";
      byCity.set(c, (byCity.get(c) ?? 0) + 1);
      byCountry.set(a.country, (byCountry.get(a.country) ?? 0) + 1);
      byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
      const d = new Date(a.created_at).toISOString().slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + 1);
    }
    const { count: reportsCount } = await context.supabase
      .from("reports").select("id", { count: "exact", head: true });
    const { count: usersCount } = await context.supabase
      .from("profiles").select("id", { count: "exact", head: true });
    const sortEntries = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    return {
      totals: { atms: rows.length, reports: reportsCount ?? 0, users: usersCount ?? 0, governorates: byCity.size },
      byCity: sortEntries(byCity),
      byCountry: sortEntries(byCountry),
      byStatus: sortEntries(byStatus),
      byDay: Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })),
    };
  });

export const adminCreateAtm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    name: z.string().min(2).max(120),
    bankId: z.string().uuid().nullable().optional(),
    lat: z.number(),
    lng: z.number(),
    address: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    country: z.string().min(2).max(3),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertRole(context, ["owner", "admin"]);
    const { data: row, error } = await context.supabase.from("atms").insert({
      name: data.name, bank_id: data.bankId ?? null, lat: data.lat, lng: data.lng,
      address: data.address ?? null, city: data.city ?? null, country: data.country,
      created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("activity_logs").insert({
      actor_id: context.userId, action: "atm.create", target_type: "atm", target_id: row.id,
      metadata: { name: data.name, city: data.city, country: data.country },
    });
    return { id: row.id };
  });
