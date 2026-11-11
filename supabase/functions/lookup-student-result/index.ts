import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "طريقة الطلب غير مدعومة." }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const studentCode = typeof body.studentCode === "string" ? body.studentCode.trim() : "";
    if (!studentCode || studentCode.length > 100) {
      return json({ success: false, error: "يرجى إدخال كود الطالب بصورة صحيحة." }, 400);
    }

    const ip = req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipHash = await sha256(ip);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase server environment configuration");
      return json({ success: false, error: "خدمة النتائج غير مهيأة حالياً. يرجى التواصل مع الإدارة." }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: allowed, error: limitError } = await supabase.rpc(
      "consume_student_lookup_attempt",
      { p_ip_hash: ipHash },
    );
    if (limitError) {
      console.error("Rate-limit check failed", limitError.message);
      return json({ success: false, error: "تعذر التحقق من طلب الاستعلام. حاول لاحقاً." }, 503);
    }
    if (allowed !== true) {
      return json({ success: false, error: "تم تجاوز عدد محاولات الاستعلام المسموح بها. حاول بعد دقيقة." }, 429);
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, student_code, full_name, is_active")
      .eq("student_code", studentCode)
      .eq("is_active", true)
      .maybeSingle();

    if (studentError) {
      console.error("Student lookup failed", studentError.message);
      return json({ success: false, error: "حدث خطأ أثناء البحث. حاول مرة أخرى." }, 500);
    }
    if (!student) {
      return json({ success: false, error: "كود الطالب غير صحيح أو غير مسجل. تأكد من الكود أو تواصل مع إدارة المدرسة." });
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("student_enrollments")
      .select(`
        id, academic_year_id, stage_id, grade_id, class_id, enrollment_status,
        academic_year:academic_years(id, name, is_active),
        stage:educational_stages(id, name),
        grade:grades(id, name),
        class_item:classes(id, name)
      `)
      .eq("student_id", student.id)
      .eq("enrollment_status", "enrolled");

    if (enrollmentError) {
      console.error("Enrollment lookup failed", enrollmentError.message);
      return json({ success: false, error: "تعذر تحميل بيانات القيد الدراسي." }, 500);
    }
    const activeEnrollments = (enrollments ?? []).filter((enrollment: any) => enrollment.academic_year?.is_active === true);
    if (!activeEnrollments.length) {
      return json({ success: false, error: "لا يوجد قيد دراسي في العام الدراسي الحالي لهذا الطالب." });
    }

    const yearIds = [...new Set(activeEnrollments.map((e: any) => e.academic_year_id))];
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id, name, academic_year_id, stage_id, grade_id, class_id, term_id, exam_type, exam_date, is_published")
      .eq("is_published", true)
      .in("academic_year_id", yearIds);

    if (examsError) {
      console.error("Published exams lookup failed", examsError.message);
      return json({ success: false, error: "تعذر تحميل الامتحانات المنشورة." }, 500);
    }

    const matching = (exams ?? []).filter((exam: any) =>
      activeEnrollments.some((enrollment: any) =>
        enrollment.academic_year_id === exam.academic_year_id &&
        (!exam.stage_id || exam.stage_id === enrollment.stage_id) &&
        (!exam.grade_id || exam.grade_id === enrollment.grade_id) &&
        (!exam.class_id || exam.class_id === enrollment.class_id)
      )
    );

    if (!matching.length) {
      return json({
        success: false,
        error: `الطالب "${student.full_name}" مسجل، لكن لا توجد نتائج منشورة تخص قيده حتى الآن.`,
      });
    }

    const examIds = matching.map((exam: any) => exam.id);
    const [{ data: examSubjects, error: subjectsError }, { data: scores, error: scoresError }, { data: rules }] =
      await Promise.all([
        supabase.from("exam_subjects")
          .select("id, exam_id, subject_id, class_id, max_score, pass_score, display_order, subject:subjects(id, name)")
          .in("exam_id", examIds)
          .order("display_order"),
        supabase.from("results")
          .select("id, exam_subject_id, score")
          .eq("student_id", student.id)
          .eq("is_published", true),
        supabase.from("grading_rules")
          .select("academic_year_id, minimum_percentage, maximum_percentage, evaluation_label, is_pass")
          .in("academic_year_id", yearIds),
      ]);

    if (subjectsError || scoresError) {
      console.error("Result rows lookup failed", subjectsError?.message, scoresError?.message);
      return json({ success: false, error: "حدث خطأ أثناء تحميل درجات الطالب." }, 500);
    }

    const scoreBySubject = new Map((scores ?? []).map((r: any) => [r.exam_subject_id, Number(r.score)]));
    const response = [];

    for (const exam of matching) {
      const enrollment: any = activeEnrollments.find((e: any) =>
        e.academic_year_id === exam.academic_year_id &&
        (!exam.stage_id || exam.stage_id === e.stage_id) &&
        (!exam.grade_id || exam.grade_id === e.grade_id) &&
        (!exam.class_id || exam.class_id === e.class_id)
      );
      if (!enrollment) continue;

      const assignedSubjects = (examSubjects ?? []).filter((item: any) =>
        item.exam_id === exam.id &&
        (!item.class_id || item.class_id === enrollment.class_id)
      );
      if (!assignedSubjects.length) continue;

      const hasAnyScore = assignedSubjects.some((item: any) => scoreBySubject.has(item.id));
      if (!hasAnyScore) continue;

      const subjects_results = assignedSubjects.map((item: any) => ({
        subject_id: item.subject_id,
        subject_name: item.subject?.name ?? "مادة",
        max_score: Number(item.max_score),
        score: scoreBySubject.get(item.id) ?? 0,
        pass_score: item.pass_score === null ? undefined : Number(item.pass_score),
      }));

      const total_score = subjects_results.reduce((sum, item) => sum + item.score, 0);
      const total_max_score = subjects_results.reduce((sum, item) => sum + item.max_score, 0);
      if (!total_max_score) continue;
      const percentage = Number(((total_score / total_max_score) * 100).toFixed(2));
      const rule = (rules ?? [])
        .filter((r: any) => r.academic_year_id === exam.academic_year_id &&
          percentage >= Number(r.minimum_percentage) &&
          percentage <= Number(r.maximum_percentage))
        .sort((a: any, b: any) => Number(b.minimum_percentage) - Number(a.minimum_percentage))[0];

      response.push({
        student: { id: student.id, student_code: student.student_code, full_name: student.full_name },
        enrollment: {
          ...enrollment,
          academic_year: enrollment.academic_year,
          stage: enrollment.stage,
          grade: enrollment.grade,
          class_item: enrollment.class_item,
        },
        exam,
        subjects_results,
        total_score,
        total_max_score,
        percentage,
        evaluation: rule?.evaluation_label ?? (percentage >= 50 ? "ناجح" : "دون المستوى"),
        is_pass: rule?.is_pass ?? percentage >= 50,
      });
    }

    if (!response.length) {
      return json({ success: false, error: `الطالب "${student.full_name}" مسجل، لكن لم يتم اعتماد ونشر نتائج له حتى الآن.` }, 404);
    }

    return json({ success: true, data: response });
  } catch (error) {
    console.error("Unexpected student result lookup error", error);
    return json({ success: false, error: "حدث خطأ غير متوقع. حاول لاحقاً." }, 500);
  }
});
