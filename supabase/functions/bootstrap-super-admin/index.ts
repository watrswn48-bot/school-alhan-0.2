import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { success: false, error: "Method not allowed." });

  try {
    const { full_name, email, token } = await request.json();
    const name = typeof full_name === "string" ? full_name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const bootstrapToken = typeof token === "string" ? token.trim() : "";

    if (name.length < 3 || name.length > 120) {
      return json(400, { success: false, error: "أدخل الاسم الكامل للمسؤول." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json(400, { success: false, error: "أدخل بريدًا إلكترونيًا صحيحًا للمسؤول المدرسي المخوّل." });
    }
    if (!/^[a-f0-9]{64}$/i.test(bootstrapToken)) {
      return json(400, { success: false, error: "رمز التهيئة غير صحيح." });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) return json(500, { success: false, error: "إعدادات الخدمة غير مكتملة." });

    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: tokenAccepted, error: tokenError } = await supabase.rpc(
      "consume_admin_bootstrap_token",
      { p_token_hash: await sha256(bootstrapToken) },
    );
    if (tokenError) {
      console.error("Bootstrap token verification failed:", tokenError.message);
      return json(500, { success: false, error: "تعذر التحقق من رمز التهيئة." });
    }
    if (tokenAccepted !== true) {
      return json(403, { success: false, error: "رمز التهيئة غير صالح أو منتهي، أو تم إعداد المسؤول الرئيسي بالفعل." });
    }

    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { data: { full_name: name } },
    );
    if (inviteError || !invited.user) {
      console.error("Initial admin invitation failed:", inviteError?.message ?? "No user returned");
      return json(400, {
        success: false,
        error: "تعذر إرسال الدعوة. تأكد أن البريد غير مسجل مسبقًا في هذا المشروع، ثم اطلب إعادة تهيئة الرمز إذا لزم.",
      });
    }

    const { error: profileError } = await supabase.from("admin_profiles").insert({
      user_id: invited.user.id,
      full_name: name,
      email: normalizedEmail,
      role: "super_admin",
      is_active: true,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(invited.user.id);
      console.error("Initial admin profile creation failed:", profileError.message);
      return json(500, { success: false, error: "تعذر إكمال ملف المسؤول؛ أُلغي حساب الدعوة لحماية النظام." });
    }

    return json(200, {
      success: true,
      message: "تم إرسال دعوة تفعيل المسؤول الرئيسي إلى البريد المحدد. افتح الرسالة وأنشئ كلمة مرور، ثم سجّل الدخول من صفحة الإدارة.",
    });
  } catch (error) {
    console.error("Bootstrap request failed:", error);
    return json(400, { success: false, error: "تعذر معالجة طلب التهيئة." });
  }
});
