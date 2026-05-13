// Edge function: operações administrativas que exigem service_role.
// Ações:
//   - "delete_user": apaga uma conta auth (e em cascata profiles/user_roles).
//   - "purge_non_master": apaga TODAS as contas exceto o master admin.
//   - "create_manager": cria um usuário gerente vinculado ao salão do owner autenticado.
//   - "approve_salon": ativa o salão e define o plano em uma operação.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MASTER_EMAIL = "leandropfonseca20@gmail.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) return json({ error: "unauthenticated" }, 401);

    const isMaster =
      caller.email?.toLowerCase() === MASTER_EMAIL ||
      (await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "master_admin")
        .maybeSingle()).data != null;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ---- Master-only ----
    if (action === "delete_user" || action === "purge_non_master" || action === "approve_salon") {
      if (!isMaster) return json({ error: "forbidden" }, 403);

      if (action === "delete_user") {
        const target = body.user_id as string;
        if (!target) return json({ error: "user_id required" }, 400);
        if (target === caller.id) return json({ error: "cannot delete self" }, 400);
        const { error } = await admin.auth.admin.deleteUser(target);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      if (action === "purge_non_master") {
        // Lista todos os usuários e apaga quem não for o master.
        const { data: list, error: lerr } = await admin.auth.admin.listUsers({ perPage: 200 });
        if (lerr) return json({ error: lerr.message }, 400);
        const targets = list.users.filter(
          (u) => (u.email ?? "").toLowerCase() !== MASTER_EMAIL,
        );
        const results: { id: string; ok: boolean; error?: string }[] = [];
        for (const u of targets) {
          const { error } = await admin.auth.admin.deleteUser(u.id);
          results.push({ id: u.id, ok: !error, error: error?.message });
        }
        return json({ ok: true, deleted: results.length, results });
      }

      if (action === "create_salon") {
        const payload = body.salon;
        const { data: newSalon, error: salonErr } = await admin.from("salons").insert(payload).select().single();
        if (salonErr) return json({ error: salonErr.message }, 400);
        return json({ ok: true, salon: newSalon });
      }

      if (action === "approve_salon") {
        const salon_id = body.salon_id as string;
        const plan = (body.plan as "studio" | "elite") ?? "studio";
        if (!salon_id) return json({ error: "salon_id required" }, 400);
        const { error } = await admin
          .from("salons")
          .update({ is_active: true, activation_status: "active", plan })
          .eq("id", salon_id);
        if (error) return json({ error: error.message }, 400);
        await admin.from("audit_log").insert({
          action: "master.approve_salon",
          salon_id,
          actor_id: caller.id,
          meta: { plan },
        });
        return json({ ok: true });
      }
    }

    // ---- Owner: criar gerente vinculado ao próprio salão ----
    if (action === "create_manager") {
      // Owner do próprio salão (ou master).
      const { data: prof } = await admin
        .from("profiles")
        .select("salon_id")
        .eq("id", caller.id)
        .maybeSingle();
      const salonId = prof?.salon_id;
      if (!salonId && !isMaster) return json({ error: "no salon" }, 400);

      const { data: ownerRole } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "owner")
        .maybeSingle();
      if (!ownerRole && !isMaster) return json({ error: "forbidden" }, 403);

      const targetSalon = (body.salon_id as string) || salonId;
      const email = (body.email as string)?.trim().toLowerCase();
      const password = body.password as string;
      const fullName = (body.full_name as string)?.trim();
      if (!email || !password || password.length < 8 || !fullName) {
        return json({ error: "invalid payload" }, 400);
      }

      // Limite Studio: 6 usuários (5 prof + 1 manager) verificado pelo trigger.
      const { data: created, error: cerr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, manager_for_salon: targetSalon },
      });
      if (cerr) return json({ error: cerr.message }, 400);

      // O trigger handle_new_user cria um salão para o novo usuário; precisamos
      // realocar esse usuário para o salão do owner E trocar a role para manager.
      const newId = created.user!.id;

      // 1) descobre o salão criado para esse usuário e apaga (cascade-friendly).
      const { data: newProfile } = await admin
        .from("profiles")
        .select("salon_id")
        .eq("id", newId)
        .maybeSingle();
      const orphanSalon = newProfile?.salon_id;

      // 2) Atualiza profile para apontar ao salão correto.
      await admin
        .from("profiles")
        .update({ salon_id: targetSalon, full_name: fullName })
        .eq("id", newId);

      // 3) Remove roles auto-criadas (owner do salão órfão) e cria role manager.
      await admin.from("user_roles").delete().eq("user_id", newId);
      const { error: rerr } = await admin
        .from("user_roles")
        .insert({ user_id: newId, role: "manager", salon_id: targetSalon });
      if (rerr) {
        // Se o trigger de limite recusou, desfaz a criação do usuário.
        await admin.auth.admin.deleteUser(newId);
        return json({ error: rerr.message }, 400);
      }

      // 4) Apaga o salão órfão (não tem mais membros).
      if (orphanSalon && orphanSalon !== targetSalon) {
        await admin.from("salons").delete().eq("id", orphanSalon);
      }

      return json({ ok: true, user_id: newId });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
