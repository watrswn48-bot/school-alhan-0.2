// Supabase Edge Function: lookup-student-result
// Securely verifies student code and retrieves only published results
// Prevents anonymous direct SELECT access to the full students and results tables

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting map (IP -> timestamps)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 12;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const timestamps = (rateLimitMap.get(clientIp) || []).filter(t => now - t < 60000);

    if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'تم تجاوز الحد المسموح به من محاولات الاستعلام. يرجى الانتظار لمدة دقيقة واحدة والمحاولة مرة أخرى.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    timestamps.push(now);
    rateLimitMap.set(clientIp, timestamps);

    // 2. Validate input
    const { studentCode } = await req.json();
    if (!studentCode || typeof studentCode !== 'string' || !studentCode.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'يرجى إدخال كود الطالب للاستعلام.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCode = studentCode.trim();

    // 3. Connect to Supabase using service role inside Edge Function only
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Query student by exact manual code
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_code, full_name, is_active')
      .eq('student_code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'كود الطالب غير صحيح أو غير مسجل في قاعدة بيانات المدرسة. يرجى التحقق من الكود أو مراجعة إدارة الكنترول.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Query student enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select(`
        id,
        academic_year:academic_years (id, name, is_active),
        stage:educational_stages (id, name),
        grade:grades (id, name),
        class_item:classes (id, name)
      `)
      .eq('student_id', student.id);

    if (enrollError || !enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'لا يوجد قيد دراسي معتمد لهذا الطالب في العام الحالي.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Query published exam results for this student
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select(`
        id,
        score,
        exam_subject:exam_subjects (
          id,
          max_score,
          pass_score,
          subject:subjects (id, name),
          exam:exams (id, name, exam_type, exam_date, is_published, academic_year_id)
        )
      `)
      .eq('student_id', student.id);

    if (resultsError) {
      return new Response(
        JSON.stringify({ success: false, error: 'حدث خطأ أثناء جلب النتائج من قاعدة البيانات.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter only published exams
    const publishedResults = (results || []).filter(
      (r: any) => r.exam_subject?.exam?.is_published === true
    );

    if (publishedResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `الطالب "${student.full_name}" مسجل بالمدرسة، ولكن لم يتم اعتماد ونشر أي نتائج امتحانات له حتى الآن.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return sanitized response with minimal necessary fields
    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          student_code: student.student_code,
          full_name: student.full_name
        },
        enrollments,
        results: publishedResults
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'خطأ غير متوقع في الخادم.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
