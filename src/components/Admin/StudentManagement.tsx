import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { Student, StudentEnrollment } from '../../types/database';
import { UserPlus, Search, Filter, Edit, Trash2, CheckCircle2, AlertCircle, AlertTriangle, FileSpreadsheet, KeyRound, User, Phone, Shield } from 'lucide-react';

interface StudentManagementProps {
  onOpenExcelImport: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onOpenExcelImport }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const refreshData = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const [studentsResult, enrollmentsResult, yearsResult, stagesResult, gradesResult, classesResult] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('full_name'),
      supabase.from('student_enrollments').select('*').eq('enrollment_status', 'enrolled'),
      supabase.from('academic_years').select('*').order('name'),
      supabase.from('educational_stages').select('*').order('display_order'),
      supabase.from('grades').select('*').order('display_order'),
      supabase.from('classes').select('*').order('name'),
    ]);
    if (studentsResult.error) setModalError(studentsResult.error.message);
    setStudents(studentsResult.data ?? []);
    setEnrollments(enrollmentsResult.data ?? []);
    setYears(yearsResult.data ?? []);
    setStages(stagesResult.data ?? []);
    setGrades(gradesResult.data ?? []);
    setClasses(classesResult.data ?? []);
  };

  useEffect(() => { void refreshData(); }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formYearId, setFormYearId] = useState('');
  const [formStageId, setFormStageId] = useState('');
  const [formGradeId, setFormGradeId] = useState('');
  const [formClassId, setFormClassId] = useState('');



  const openAddModal = () => {
    setEditingStudent(null);
    setFormCode('');
    setFormName('');
    setFormPhone('');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setFormNotes('');
    const activeYear = years.find(y => y.is_active)?.id || years[0]?.id || '';
    setFormYearId(activeYear);
    const firstStage = stages[0]?.id || '';
    setFormStageId(firstStage);
    const firstGrade = grades.find(g => g.stage_id === firstStage)?.id || '';
    setFormGradeId(firstGrade);
    const firstClass = classes.find(c => c.grade_id === firstGrade)?.id || classes[0]?.id || '';
    setFormClassId(firstClass);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormCode(student.student_code);
    setFormName(student.full_name);
    setFormPhone(student.phone || '');
    setFormGuardianName(student.guardian_name || '');
    setFormGuardianPhone(student.guardian_phone || '');
    setFormNotes(student.notes || '');

    const enrollment = enrollments.find(e => e.student_id === student.id);
    if (enrollment) {
      setFormYearId(enrollment.academic_year_id);
      setFormStageId(enrollment.stage_id);
      setFormGradeId(enrollment.grade_id);
      setFormClassId(enrollment.class_id);
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleStageChange = (newStageId: string) => {
    setFormStageId(newStageId);
    const availableGrades = grades.filter(g => g.stage_id === newStageId);
    if (availableGrades.length > 0) {
      setFormGradeId(availableGrades[0].id);
      const availableClasses = classes.filter(c => c.grade_id === availableGrades[0].id);
      if (availableClasses.length > 0) setFormClassId(availableClasses[0].id);
    }
  };

  const handleGradeChange = (newGradeId: string) => {
    setFormGradeId(newGradeId);
    const availableClasses = classes.filter(c => c.grade_id === newGradeId);
    if (availableClasses.length > 0) {
      setFormClassId(availableClasses[0].id);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const code = formCode.trim();
    if (!code) { setModalError('يجب إدخال كود الطالب يدوياً.'); return; }
    if (!formName.trim()) { setModalError('يرجى إدخال اسم الطالب بالكامل.'); return; }
    if (!formYearId || !formStageId || !formGradeId || !formClassId) {
      setModalError('اختر العام والمستوى والسنة والفصل قبل حفظ الطالب.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) { setModalError('تعذر الاتصال بقاعدة بيانات المدرسة.'); return; }
    const studentId = editingStudent?.id || crypto.randomUUID();
    const studentObj: Student = {
      id: studentId, student_code: code, full_name: formName.trim(),
      phone: formPhone.trim(), guardian_name: formGuardianName.trim(),
      guardian_phone: formGuardianPhone.trim(), notes: formNotes.trim(),
      is_active: true, created_at: editingStudent?.created_at || new Date().toISOString(),
    };

    const { error: studentError } = await supabase.from('students').upsert(studentObj);
    if (studentError) {
      setModalError(studentError.code === '23505' ? 'كود الطالب مستخدم بالفعل. أدخل كوداً مختلفاً.' : studentError.message);
      return;
    }

    const enrollmentObj: StudentEnrollment = {
      id: crypto.randomUUID(), student_id: studentId, academic_year_id: formYearId,
      stage_id: formStageId, grade_id: formGradeId, class_id: formClassId,
      enrollment_status: 'enrolled', created_at: new Date().toISOString(),
    };
    const { error: enrollmentError } = await supabase.from('student_enrollments').upsert(
      enrollmentObj, { onConflict: 'student_id,academic_year_id' }
    );
    if (enrollmentError) {
      setModalError('تم حفظ بيانات الطالب لكن تعذر حفظ القيد الدراسي: ' + enrollmentError.message);
      return;
    }

    await refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('students').update({ is_active: false }).eq('id', studentToDelete.id);
    if (error) setModalError('تعذر إيقاف سجل الطالب: ' + error.message);
    else await refreshData();
    setStudentToDelete(null);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = student.full_name.toLowerCase().includes(q) ||
                         student.student_code.toLowerCase().includes(q) ||
                         (student.phone && student.phone.includes(q));

    const enrollment = enrollments.find(e => e.student_id === student.id);
    if (!enrollment) return matchesQuery;

    const matchesYear = selectedYear === 'all' || enrollment.academic_year_id === selectedYear;
    const matchesStage = selectedStage === 'all' || enrollment.stage_id === selectedStage;
    const matchesGrade = selectedGrade === 'all' || enrollment.grade_id === selectedGrade;

    return matchesQuery && matchesYear && matchesStage && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Important Manual Code Note */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-amiri text-[#0c1a30] flex items-center gap-2">
            <User className="w-6 h-6 text-[#c5a059]" />
            <span>سجل الطلاب وقيد المراحل التعليمية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بيانات الطلاب، تخصيص الأكواد يدوياً، وتوزيعهم على الفصول والصفوف الدراسية
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenExcelImport}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد من إكسل (XLSX)</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#c5a059]" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Manual Code Rule Indicator */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
        <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>ضابط الكنترول:</strong> كود الطالب يتم إدخاله يدوياً بمعرفة مسؤول المدرسة ويجب أن يكون فريداً لكل طالب. النظام يمنع تكرار أي كود.
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو الهاتف..."
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c5a059] focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الأعوام الدراسية</option>
            {years.map(y => (
              <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(الحالي)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c5a059] focus:outline-none cursor-pointer"
          >
            <option value="all">جميع المراحل التعليمية</option>
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c5a059] focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الصفوف</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            عدد الطلاب المطابقين: <span className="text-[#0c1a30] font-mono tabular-nums">{filteredStudents.length}</span>
          </span>
          <span className="text-xs text-slate-400">إجمالي طلاب المدرسة: {students.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0c1a30] text-white">
                <th className="py-3 px-4">كود الطالب (يدوي)</th>
                <th className="py-3 px-4">اسم الطالب</th>
                <th className="py-3 px-4">المرحلة الدراسية</th>
                <th className="py-3 px-4">الصف والفصل</th>
                <th className="py-3 px-4">ولي الأمر والهاتف</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا يوجد طلاب مطابقين لخيارات البحث أو الفلترة.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const enr = enrollments.find(e => e.student_id === st.id);
                  const stage = stages.find(s => s.id === enr?.stage_id);
                  const grade = grades.find(g => g.id === enr?.grade_id);
                  const cls = classes.find(c => c.id === enr?.class_id);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {st.student_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-amiri text-sm">
                        {st.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {stage?.name || 'غير محدد'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{grade?.name || '—'}</div>
                        <div className="text-[11px] text-slate-400">{cls?.name || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{st.guardian_name || '—'}</div>
                        <div dir="ltr" className="text-right font-mono text-[11px] text-slate-400">{st.guardian_phone || st.phone || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0c1a30] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="تعديل بيانات الطالب"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative text-right my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold font-amiri text-[#0c1a30] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#c5a059]" />
                <span>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              {/* Student Code (MANUAL ENTRY ONLY) */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                <label className="block font-bold text-amber-950 mb-1">
                  كود الطالب (إدخال يدوي إلزامي وغير قابل للتكرار) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="مثال: ETCH-1005"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                />
                <span className="text-[10px] text-amber-800 block mt-1">
                  ملاحظة: أدخل الكود المعتمد في السجلات الورقية للمدرسة. لا يتم توليد الكود آلياً.
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم الطالب بالكامل (ثلاثي أو رباعي) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: دانيال مايكل مرقص بطرس"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                />
              </div>

              {/* Academic Placement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العام الدراسي</label>
                  <select
                    value={formYearId}
                    onChange={(e) => setFormYearId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                  >
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(نشط)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستوى التعليمي</label>
                  <select
                    value={formStageId}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السنة الدراسية (الصف)</label>
                  <select
                    value={formGradeId}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                  >
                    {grades.filter(g => g.stage_id === formStageId).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفصل الكنسي</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                  >
                    {classes.filter(c => c.grade_id === formGradeId).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.term === 'term2' ? '(الترم الثاني)' : c.term === 'both' ? '(سنوي)' : '(الترم الأول)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={formGuardianName}
                    onChange={(e) => setFormGuardianName(e.target.value)}
                    placeholder="مثال: مايكل مرقص بطرس"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">هاتف ولي الأمر / واتساب</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="01234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-right"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الكنترول / موهبة اللحن</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ملاحظات الحضور أو الصوت أو رتبة الشماسية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ في السجلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Student Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500/30 space-y-4 text-right">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-amiri">تأكيد حذف الطالب</h3>
                <p className="text-xs text-slate-500">سيتم مسح سجل الطالب ودرجاته المرتبطة</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>هل أنت متأكد من رغبتك في حذف الطالب:</p>
              <div className="p-2.5 bg-white rounded-lg border border-red-200">
                <div className="font-bold text-sm text-[#0c1a30]">{studentToDelete.full_name}</div>
                <div className="text-slate-500 font-mono mt-0.5">كود الطالب: {studentToDelete.student_code}</div>
              </div>
              <div className="flex items-start gap-1.5 text-red-700 font-medium pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>تحذير: سيتم إزالة هذا الطالب من قيد الصفوف وقوائم النتائج نهائياً.</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف الطالب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
