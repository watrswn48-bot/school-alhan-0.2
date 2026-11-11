import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!url || !serviceKey || !token) return reply({ error: "Unauthorized" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return reply({ error: "جلسة الدخول غير صالحة." }, 401);

  const { data: caller } = await admin.from("admin_profiles")
    .select("id, role, is_active")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (!caller?.is_active || caller.role !== "super_admin") {
    return reply({ error: "هذه العملية متاحة للمسؤول الرئيسي فقط." }, 403);
  }

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await admin.from("admin_profiles")
        .select("id, user_id, full_name, email, role, is_active, created_at, admin_permissions(*)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return reply({ success: true, admins: data ?? [] });
    }

    if (action === "invite") {
      const fullName = String(body.full_name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const role = String(body.role ?? "results_manager");
      const allowedRoles = ["admin", "results_manager", "content_manager", "teacher"];
      if (!fullName || !email || !email.includes("@") || !allowedRoles.includes(role)) {
        return reply({ error: "بيانات المسؤول أو نوع الصلاحية غير صحيح." }, 400);
      }

      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });
      if (inviteError || !inviteData.user) throw inviteError ?? new Error("لم يتم إنشاء دعوة الحساب.");

      const { data: profile, error: profileError } = await admin.from("admin_profiles").insert({
        user_id: inviteData.user.id, full_name: fullName, email, role, is_active: true,
      }).select("id, user_id, full_name, email, role, is_active, created_at").single();
      if (profileError) throw profileError;

      const scopes = Array.isArray(body.permissions) ? body.permissions : [];
      if (scopes.length) {
        const rows = scopes.map((scope: any) => ({
          admin_profile_id: profile.id,
          permission_key: scope.permission_key,
          academic_year_id: scope.academic_year_id || null,
          stage_id: scope.stage_id || null,
          grade_id: scope.grade_id || null,
          class_id: scope.class_id || null,
          term_id: scope.term_id || null,
          subject_id: scope.subject_id || null,
        }));
        const { error: permissionError } = await admin.from("admin_permissions").insert(rows);
        if (permissionError) throw permissionError;
      }
      return reply({ success: true, admin: profile, message: "تم إرسال دعوة تفعيل الحساب إلى البريد الإلكتروني." });
    }

    if (action === "set-active") {
      const id = String(body.id ?? "");
      const isActive = body.is_active === true;
      if (!id) return reply({ error: "معرّف المسؤول مطلوب." }, 400);
      if (id === caller.id && !isActive) return reply({ error: "لا يمكن للمسؤول تعطيل حسابه الحالي." }, 400);
      const { data, error } = await admin.from("admin_profiles")
        .update({ is_active: isActive }).eq("id", id)
        .select("id, user_id, full_name, email, role, is_active, created_at").single();
      if (error) throw error;
      return reply({ success: true, admin: data });
    }

    if (action === "set-permissions") {
      const id = String(body.id ?? "");
      const scopes = Array.isArray(body.permissions) ? body.permissions : [];
      if (!id) return reply({ error: "معرّف المسؤول مطلوب." }, 400);
      const { error: deleteError } = await admin.from("admin_permissions").delete().eq("admin_profile_id", id);
      if (deleteError) throw deleteError;
      if (scopes.length) {
        const rows = scopes.map((scope: any) => ({
          admin_profile_id: id,
          permission_key: scope.permission_key,
          academic_year_id: scope.academic_year_id || null,
          stage_id: scope.stage_id || null,
          grade_id: scope.grade_id || null,
          class_id: scope.class_id || null,
          term_id: scope.term_id || null,
          subject_id: scope.subject_id || null,
        }));
        const { error } = await admin.from("admin_permissions").insert(rows);
        if (error) throw error;
      }
      return reply({ success: true });
    }

    return reply({ error: "العملية المطلوبة غير معروفة." }, 400);
  } catch (error) {
    console.error("admin-management error", error);
    return reply({ error: "تعذر تنفيذ العملية الإدارية. تحقق من البيانات وحاول مرة أخرى." }, 500);
  }
});
