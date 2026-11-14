import React, { useState } from 'react';
import { StudentFullResultLookup } from '../../types/database';
import { getSupabaseClient } from '../../lib/supabase';
import { useSchoolSettings } from '../../lib/schoolSettingsCache';
import { CopticCross, SchoolSeal } from '../CopticIcons';
import { Search, Printer, CheckCircle2, AlertCircle, Award, ShieldCheck } from 'lucide-react';

export const StudentResults: React.FC = () => {
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultsList, setResultsList] = useState<StudentFullResultLookup[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const { settings } = useSchoolSettings();

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || studentCodeInput).trim();
    if (!code) {
      setErrorMessage('يرجى إدخال كود الطالب الخاص بك الممنوح لك من إدارة المدرسة.');
      setResultsList(null);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage('خدمة النتائج غير متاحة حالياً. يرجى المحاولة لاحقاً.');
      setResultsList(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResultsList(null);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-student-result', {
        body: { studentCode: code },
      });
      if (error || !data?.success || !Array.isArray(data?.data) || data.data.length === 0) {
        let serverErrorMsg: string | undefined = data?.error;
        if (!serverErrorMsg && error && typeof (error as any).context?.json === 'function') {
          try {
            const errBody = await (error as any).context.json();
            serverErrorMsg = errBody?.error;
          } catch {
            // Ignore JSON parse errors
          }
        }
        setErrorMessage(serverErrorMsg || 'تعذر العثور على نتائج منشورة مطابقة لكود الطالب المدخل.');
        return;
      }
      setResultsList(data.data as StudentFullResultLookup[]);
      setSelectedExamIndex(0);
    } catch {
      setErrorMessage('تعذر الاتصال بخدمة النتائج. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const currentResult = resultsList ? resultsList[selectedExamIndex] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Title & Introduction */}
      <div className="text-center mb-8 no-print">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-[var(--school-accent)]/50 shadow-md mb-3 w-16 h-16 overflow-hidden">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain mix-blend-multiply" />
          ) : (
            <Award className="w-8 h-8 text-[var(--school-primary)]" />
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-amiri text-[var(--school-primary)] mb-2">
          بوابة الاستعلام عن نتائج الطلاب
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          أدخل كود الطالب المخصص لك من قبل إدارة المدرسة واضغط على «عرض النتيجة» للاطلاع على كشف الدرجات المعتمد وطباعة الشهادة الرسمية.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-[var(--school-accent)]/30 shadow-md p-6 sm:p-8 mb-8 no-print">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-4"
        >
          <label htmlFor="studentCode" className="block text-sm font-bold text-[var(--school-primary)]">
            كود الطالب المسجل بالكنترول <span className="text-red-600">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="studentCode"
                type="text"
                dir="ltr"
                value={studentCodeInput}
                onChange={(e) => setStudentCodeInput(e.target.value)}
                placeholder="مثال: ETCH-1001"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--school-accent)] focus:bg-white text-slate-900"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[var(--school-primary)] to-[#162a4d] text-white hover:from-[#162a4d] hover:to-[var(--school-primary)] font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>جاري البحث في السجلات...</span>
              ) : (
                <>
                  <Award className="w-5 h-5 text-[var(--school-accent)]" />
                  <span>عرض النتيجة</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy & Security Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>تنبيه الخصوصية والأمان:</strong> الاستعلام يتم عبر كود الطالب فقط. الأكواد مخصصة يدوياً بواسطة إدارة الكنترول لمنع التخمين العشوائي. يُرجى الحفاظ على سرية كودك الخاص.
            </p>
          </div>
        </form>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm no-print">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-base">تعذر عرض النتيجة</h3>
            <p className="text-sm text-red-800 leading-relaxed">{errorMessage}</p>
            <p className="text-xs text-red-700 pt-1">
              إذا كنت متأكداً من الكود، يرجى التواصل مع مسؤول الكنترول بالمدرسة على الرقم: {settings.phone_number}
            </p>
          </div>
        </div>
      )}

      {/* Results Display Area & Printable Certificate */}
      {currentResult && (
        <div className="space-y-6">
          {/* Multiple Exams Switcher (if student has more than 1 exam) */}
          {resultsList && resultsList.length > 1 && (
            <div className="bg-slate-100 p-2 rounded-xl flex items-center gap-2 no-print overflow-x-auto">
              <span className="text-xs font-bold text-slate-700 px-2 whitespace-nowrap">الامتحانات المسجلة:</span>
              {resultsList.map((res, idx) => (
                <button
                  key={res.exam.id}
                  onClick={() => setSelectedExamIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedExamIndex === idx
                      ? 'bg-[var(--school-primary)] text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {res.exam.name}
                </button>
              ))}
            </div>
          )}

          {/* Action Header for Print */}
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2 text-sm text-emerald-800 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>تم التحقق من الكود واعتماد النتيجة رسمياً</span>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[var(--school-primary)] hover:bg-[#162a4d] text-white text-xs font-bold rounded-lg shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[var(--school-accent)]" />
              <span>طباعة كشف الدرجات / الشهادة الرسمية</span>
            </button>
          </div>

          {/* The Certificate / Report Card (PRINT AREA) */}
          <div className="print-area bg-white rounded-2xl border-2 border-[var(--school-accent)] shadow-xl p-6 sm:p-10 relative overflow-hidden">
            {/* Watermark in background - Updated to Custom School Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt=""
                  className="w-80 h-80 sm:w-[460px] sm:h-[460px] object-contain opacity-[0.06] mix-blend-multiply filter contrast-125 select-none pointer-events-none"
                />
              ) : (
                <CopticCross size={420} className="text-[var(--school-primary)] opacity-[0.03]" />
              )}
            </div>

            {/* Certificate Header */}
            <div className="border-b-2 border-[var(--school-accent)]/40 pb-6 mb-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
                {/* School & Church Branding */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-[var(--school-accent)] flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt={settings.school_name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <CopticCross className="w-10 h-10 text-[var(--school-primary)]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-amiri text-[var(--school-primary)]">
                      {settings.school_name}
                    </h2>
                    <p className="text-xs text-[var(--school-accent)] font-semibold">{settings.church_name}</p>
                    <p className="text-[11px] text-slate-500">{settings.parish_name}</p>
                  </div>
                </div>

                {/* Certificate Badge */}
                <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    كود الاستعلام: {currentResult.student.student_code}
                  </span>
                  <div className="mt-1 px-3 py-1 bg-amber-50 border border-[var(--school-accent)] rounded-md text-xs font-bold text-[#800020]">
                    شهادة تقييم ألحان كنسية معتمدة
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-[#faf8f5] rounded-xl border border-slate-200 mb-6 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">اسم الطالب ثلاثي:</span>
                <span className="font-bold text-base text-[var(--school-primary)]">{currentResult.student.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">المستوى والمرحلة:</span>
                <span className="font-semibold text-slate-800">{currentResult.enrollment.stage.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">السنة الدراسية والفصل:</span>
                <span className="font-semibold text-slate-800">
                  {currentResult.enrollment.grade.name} · {currentResult.enrollment.class_item.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">العام الدراسي:</span>
                <span className="font-semibold text-slate-800">{currentResult.enrollment.academic_year.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">الامتحان والترم:</span>
                <span className="font-semibold text-slate-800">
                  {currentResult.exam.name}
                  {currentResult.exam.term === 'term1' ? ' (الترم الأول)' : currentResult.exam.term === 'term2' ? ' (الترم الثاني)' : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">تاريخ الامتحان:</span>
                <span className="font-semibold text-slate-800">{currentResult.exam.exam_date}</span>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--school-primary)] text-white text-xs">
                    <th className="py-3 px-4 rounded-r-lg">م</th>
                    <th className="py-3 px-4">المادة الدراسية / الفرع الكنسي</th>
                    <th className="py-3 px-4 text-center">الدرجة العظمى</th>
                    <th className="py-3 px-4 text-center">الدرجة الصغرى (النجاح)</th>
                    <th className="py-3 px-4 text-center rounded-l-lg">الدرجة الحاصل عليها</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {currentResult.subjects_results.map((sub, index) => {
                    const isPassingSubject = sub.pass_score ? sub.score >= sub.pass_score : sub.score >= sub.max_score / 2;
                    return (
                      <tr key={sub.subject_id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-slate-500 text-xs font-mono">{index + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.subject_name}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">{sub.max_score}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">{sub.pass_score ?? sub.max_score / 2}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono tabular-nums">
                          <span className={isPassingSubject ? 'text-emerald-700' : 'text-red-600'}>
                            {sub.score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50/70 border-t-2 border-[var(--school-accent)] font-bold text-sm text-slate-900">
                    <td colSpan={2} className="py-3.5 px-4 text-base">المجموع الكلي للدرجات</td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-base">{currentResult.total_max_score}</td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-500">
                      {(currentResult.total_max_score / 2).toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-lg text-[var(--school-primary)]">
                      {currentResult.total_score}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Overall Score & Evaluation Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--school-primary)] to-[#162a4d] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md mb-8">
              <div className="text-center sm:text-right space-y-1">
                <span className="text-xs text-[var(--school-accent)] font-semibold tracking-wider block">النسبة المئوية الإجمالية</span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  {currentResult.percentage}%
                </div>
                <p className="text-xs text-slate-300">
                  الحالة: {currentResult.is_pass ? 'ناجح ومنقول للمستوى الأعلى' : 'يحتاج إلى مراجعة وتدريب تكميلي'}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-r border-slate-700/80 pt-4 sm:pt-0 sm:pr-8 text-center sm:text-right">
                <span className="text-xs text-slate-300 block mb-1">التقدير العام المعتمد:</span>
                <div className="text-xl sm:text-2xl font-bold font-amiri text-[#e0c588]">
                  {currentResult.evaluation}
                </div>
              </div>

              <div className="shrink-0">
                {settings.logo_url ? (
                  <div className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-[var(--school-accent)] flex items-center justify-center shadow-lg">
                    <img
                      src={settings.logo_url}
                      alt={settings.school_name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <SchoolSeal className="w-20 h-20" />
                )}
              </div>
            </div>

            {/* Official Signatures & Seal Section */}
            <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-700 pt-8 border-t border-slate-200">
              <div className="space-y-4">
                <p className="font-bold">مسؤول الكنترول والرصد</p>
                <div className="h-8 flex items-center justify-center font-amiri text-slate-500 italic">
                  الشماس كيرلس يوسف
                </div>
                <div className="border-t border-dashed border-slate-400 w-24 mx-auto pt-1 text-[10px] text-slate-400">التوقيع</div>
              </div>
              <div className="space-y-4">
                <p className="font-bold">خاتم المدرسة والكنترول</p>
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[var(--school-accent)] bg-white flex items-center justify-center p-1.5 overflow-hidden shadow-2xs">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt=""
                      className="w-full h-full object-contain mix-blend-multiply opacity-90"
                    />
                  ) : (
                    <span className="text-[9px] text-[var(--school-accent)] font-bold">خاتم رسمي</span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="font-bold">رعاية الآباء الكهنة</p>
                <div className="h-8 flex items-center justify-center font-amiri text-slate-500 italic">
                  القمص متى زكريا
                </div>
                <div className="border-t border-dashed border-slate-400 w-24 mx-auto pt-1 text-[10px] text-slate-400">الاعتماد</div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 text-center">
              {settings.results_disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
