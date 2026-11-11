import React from 'react';
import { dataService } from '../../lib/storage';
import { AdminProfile } from '../../types/database';
import { Users, Award, BookOpen, Calendar, Plus, FileSpreadsheet, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SchoolSeal, CopticCross } from '../CopticIcons';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
  admin: AdminProfile;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab, admin }) => {
  const students = dataService.getStudents();
  const stages = dataService.getStages();
  const exams = dataService.getExams();
  const results = dataService.getResults();
  const settings = dataService.getSettings();
  const years = dataService.getAcademicYears();
  const activeYear = years.find(y => y.is_active) || years[0];

  const publishedExams = exams.filter(e => e.is_published);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0c1a30] to-[#162a4d] rounded-3xl p-8 text-white border-2 border-[#c5a059]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <div className="flex items-center gap-2 text-xs text-[#c5a059] font-bold">
            <CopticCross className="w-4 h-4 text-[#c5a059]" />
            <span>لوحة التحكم والكنترول المركزي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
            مرحباً بك يا {admin.full_name}
          </h1>
          <p className="text-xs text-slate-300">
            العام الأكاديمي النشط: <strong className="text-[#e0c588]">{activeYear?.name}</strong> · الصلاحية الحالية: <strong className="text-emerald-400 font-mono">{admin.role}</strong>
          </p>
        </div>

        <div className="shrink-0">
          {settings.logo_url ? (
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#c5a059] p-1.5 flex items-center justify-center shadow-md overflow-hidden">
              <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
          ) : (
            <SchoolSeal className="w-16 h-16" />
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">إجمالي الطلاب المقيدين</span>
            <Users className="w-5 h-5 text-[#c5a059]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0c1a30] tabular-nums">
            {students.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">أكواد مسجلة يدوياً بنسبة 100%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">المراحل والصفوف</span>
            <BookOpen className="w-5 h-5 text-[#c5a059]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0c1a30] tabular-nums">
            {stages.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">من الحضانة حتى تخصص الشمامسة</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">الامتحانات المنشورة</span>
            <Award className="w-5 h-5 text-[#c5a059]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0c1a30] tabular-nums">
            {publishedExams.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">متاحة للاستعلام بالبوابة الرسمية</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">درجات المواد المرصودة</span>
            <CheckCircle2 className="w-5 h-5 text-[#c5a059]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#0c1a30] tabular-nums">
            {results.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">سجل درجات معتمد</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0c1a30] font-amiri">إجراءات ومهام سريعة:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('students')}
            className="p-3 bg-slate-50 hover:bg-[#faf8f5] border border-slate-200 rounded-xl text-right space-y-1 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-[#0c1a30] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>إضافة طالب جديد</span>
            </div>
            <p className="text-[10px] text-slate-500">تخصيص كود يدوي وقيد المرحلة</p>
          </button>

          <button
            onClick={() => onNavigateTab('results')}
            className="p-3 bg-slate-50 hover:bg-[#faf8f5] border border-slate-200 rounded-xl text-right space-y-1 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-[#0c1a30] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>رصد درجات الامتحان</span>
            </div>
            <p className="text-[10px] text-slate-500">حساب المجاميع والنسب المئوية</p>
          </button>

          <button
            onClick={() => onNavigateTab('excel')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-200 rounded-xl text-right space-y-1 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>استيراد ملف إكسل</span>
            </div>
            <p className="text-[10px] text-emerald-800">طلاب ونتائج دفعة واحدة</p>
          </button>

          <button
            onClick={() => onNavigateTab('exams')}
            className="p-3 bg-slate-50 hover:bg-[#faf8f5] border border-slate-200 rounded-xl text-right space-y-1 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-[#0c1a30] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>إنشاء دورة امتحانات</span>
            </div>
            <p className="text-[10px] text-slate-500">تحديد المواد والعظمى والنشر</p>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Stage Breakdown & Results Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stages Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <span>توزيع المراحل الدراسية المسجلة</span>
          </h3>
          <div className="space-y-3">
            {stages.map(stg => (
              <div key={stg.id} className="p-3 rounded-xl bg-[#faf8f5] border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0c1a30] block">{stg.name}</span>
                  <span className="text-[11px] text-slate-500">{stg.description}</span>
                </div>
                <button
                  onClick={() => onNavigateTab('academic')}
                  className="text-[#b8860b] hover:text-[#0c1a30] font-bold text-[11px] cursor-pointer"
                >
                  إدارة
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Exams & Results Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c5a059]" />
              <span>حالة امتحانات ونتائج الكنترول</span>
            </h3>
            <button
              onClick={() => onNavigateTab('results')}
              className="text-xs text-[#b8860b] font-bold cursor-pointer"
            >
              شيت الرصد الكامل
            </button>
          </div>
          <div className="space-y-3">
            {exams.slice(0, 3).map(ex => (
              <div key={ex.id} className="p-3 rounded-xl bg-[#faf8f5] border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{ex.exam_date}</span>
                  <span className={ex.is_published ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {ex.is_published ? 'منشور للطلاب' : 'مسودة كنترول'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 font-amiri">{ex.name}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>نوع الامتحان: {ex.exam_type}</span>
                  <button
                    onClick={() => onNavigateTab('results')}
                    className="text-[#0c1a30] hover:text-[#c5a059] font-bold cursor-pointer"
                  >
                    رصد الدرجات ←
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
