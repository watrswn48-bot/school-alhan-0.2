import React, { useState } from 'react';
import { dataService } from '../../lib/storage';
import { Exam, ExamSubject, ExamType, SemesterTerm } from '../../types/database';
import { Award, Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Calendar, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>(dataService.getExams());
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>(dataService.getExamSubjects());
  const years = dataService.getAcademicYears();
  const stages = dataService.getStages();
  const subjects = dataService.getSubjects();
  const classes = dataService.getClasses();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formYearId, setFormYearId] = useState(years.find(y => y.is_active)?.id || years[0]?.id || '');
  const [formStageId, setFormStageId] = useState(stages[0]?.id || '');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formTerm, setFormTerm] = useState<SemesterTerm>('term1');
  const [formType, setFormType] = useState<ExamType>('final');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<{ subject_id: string; max_score: number; pass_score: number }[]>([]);

  const refreshData = () => {
    setExams(dataService.getExams());
    setExamSubjects(dataService.getExamSubjects());
  };

  const openAddModal = () => {
    setEditingExam(null);
    setFormName('');
    const activeYear = years.find(y => y.is_active)?.id || years[0]?.id || '';
    setFormYearId(activeYear);
    setFormStageId(stages[0]?.id || '');
    setFormClassId(classes[0]?.id || '');
    setFormTerm('term1');
    setFormType('midterm');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormIsPublished(false);
    setSelectedSubjectIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormName(exam.name);
    setFormYearId(exam.academic_year_id);
    setFormStageId(exam.stage_id || stages[0]?.id || '');
    setFormClassId(exam.class_id || classes[0]?.id || '');
    setFormTerm(exam.term || 'term1');
    setFormType(exam.exam_type);
    setFormDate(exam.exam_date);
    setFormNotes(exam.notes || '');
    setFormIsPublished(exam.is_published);

    const existingExamSubjects = examSubjects.filter(es => es.exam_id === exam.id);
    if (existingExamSubjects.length > 0) {
      setSelectedSubjectIds(existingExamSubjects.map(es => ({
        subject_id: es.subject_id,
        max_score: es.max_score,
        pass_score: es.pass_score || es.max_score / 2
      })));
    } else {
      setSelectedSubjectIds([]);
    }
    setIsModalOpen(true);
  };

  const handleTogglePublish = (exam: Exam) => {
    const updated = { ...exam, is_published: !exam.is_published };
    dataService.saveExam(updated);
    refreshData();
  };

  const handleDeleteExam = (exam: Exam) => {
    setExamToDelete(exam);
  };

  const confirmDeleteExam = () => {
    if (!examToDelete) return;
    dataService.deleteExam(examToDelete.id);
    refreshData();
    setExamToDelete(null);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClassId || selectedSubjectIds.length === 0) return;

    const examId = editingExam ? editingExam.id : `exam-${Date.now()}`;
    const examObj: Exam = {
      id: examId,
      name: formName.trim(),
      academic_year_id: formYearId,
      stage_id: formStageId,
      grade_id: classes.find(cls => cls.id === formClassId)?.grade_id,
      class_id: formClassId,
      term: formTerm,
      exam_type: formType,
      exam_date: formDate,
      is_published: formIsPublished,
      notes: formNotes.trim(),
      created_at: editingExam ? editingExam.created_at : new Date().toISOString()
    };

    dataService.saveExam(examObj);

    // Save exam subjects
    selectedSubjectIds.forEach((item, index) => {
      const esId = `es-${examId}-${item.subject_id}`;
      const examSubjectObj: ExamSubject = {
        id: esId,
        exam_id: examId,
        subject_id: item.subject_id,
        class_id: formClassId,
        max_score: Number(item.max_score),
        pass_score: Number(item.pass_score),
        display_order: index + 1
      };
      dataService.saveExamSubject(examSubjectObj);
    });

    refreshData();
    setIsModalOpen(false);
  };

  const addSubjectRow = () => {
    if (!subjects.length) return;
    setSelectedSubjectIds([...selectedSubjectIds, { subject_id: subjects[0].id, max_score: 50, pass_score: 25 }]);
  };

  const removeSubjectRow = (index: number) => {
    if (selectedSubjectIds.length <= 1) return;
    const list = [...selectedSubjectIds];
    list.splice(index, 1);
    setSelectedSubjectIds(list);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-amiri text-[var(--school-primary)] flex items-center gap-2">
            <Award className="w-6 h-6 text-[var(--school-accent)]" />
            <span>إدارة الاختبارات والامتحانات والكنترول</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء دورات الامتحانات (نصف العام، النهائي، العملي)، توزيع المواد، وتحديد النهايات العظمى وحالة النشر للطلاب
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[var(--school-primary)] hover:bg-[#162a4d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-[var(--school-accent)]" />
          <span>إنشاء امتحان جديد</span>
        </button>
      </div>

      {/* Exams Grid / Table */}
      {!subjects.length && <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">أضف المواد أولاً من قسم الهيكل الأكاديمي قبل إنشاء الامتحانات.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => {
          const year = years.find(y => y.id === exam.academic_year_id);
          const stage = stages.find(s => s.id === exam.stage_id);
          const thisExamSubjects = examSubjects.filter(es => es.exam_id === exam.id);
          const totalMax = thisExamSubjects.reduce((acc, curr) => acc + curr.max_score, 0);

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      exam.is_published
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {exam.is_published ? 'منشور للطلاب (معتمد)' : 'مسودة كنترول (مخفي)'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      exam.term === 'term2'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : exam.term === 'both'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {exam.term === 'term2' ? 'الترم الثاني' : exam.term === 'both' ? 'سنوي' : 'الترم الأول'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {exam.exam_date}
                  </span>
                </div>

                <h3 className="font-bold text-base font-amiri text-[var(--school-primary)] line-clamp-2">
                  {exam.name}
                </h3>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">العام الدراسي:</span>
                    <span className="font-semibold text-slate-800">{year?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المرحلة:</span>
                    <span className="font-semibold text-slate-800">{stage?.name || 'جميع المراحل'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">عدد المواد:</span>
                    <span className="font-bold font-mono text-[var(--school-primary)]">{thisExamSubjects.length} مواد (المجموع: {totalMax})</span>
                  </div>
                </div>

                {/* Subject Pills */}
                <div className="pt-2 flex flex-wrap gap-1">
                  {thisExamSubjects.map(es => {
                    const subj = subjects.find(s => s.id === es.subject_id);
                    return (
                      <span key={es.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {subj?.name} ({es.max_score})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleTogglePublish(exam)}
                  className={`flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                    exam.is_published ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  {exam.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{exam.is_published ? 'إخفاء عن الطلاب' : 'نشر واعتماد النتيجة'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(exam)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-[var(--school-primary)] hover:bg-slate-100 cursor-pointer"
                    title="تعديل الامتحان"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="حذف الامتحان"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative text-right my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold font-amiri text-[var(--school-primary)]">
                {editingExam ? 'تعديل بيانات الامتحان' : 'إنشاء امتحان جديد وتعيين المواد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  عنوان أو اسم الامتحان <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: امتحان نصف العام الدراسي - دور يناير 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[var(--school-accent)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العام الدراسي</label>
                  <select
                    value={formYearId}
                    onChange={(e) => setFormYearId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(نشط)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المرحلة المخصصة</label>
                  <select
                    value={formStageId}
                    onChange={(e) => setFormStageId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الفصل الدراسي المحدد</label>
                <select required value={formClassId} onChange={e => setFormClassId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900">
                  <option value="">اختر الفصل</option>
                  {classes.filter(cls => cls.academic_year_id === formYearId && (formTerm === 'both' || cls.term === formTerm)).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الترم / الفصل الدراسي</label>
                  <select
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value as SemesterTerm)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="term1">الترم الأول (الفصل الدراسي الأول)</option>
                    <option value="term2">الترم الثاني (الفصل الدراسي الثاني)</option>
                    <option value="both">سنوي (شامل العام كاملاً)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الاختبار</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExamType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="monthly">امتحان شهري دوري</option>
                    <option value="midterm">امتحان نصف العام</option>
                    <option value="final">امتحان نهاية العام النهائي</option>
                    <option value="practical">تقييم عملي وخورس</option>
                    <option value="custom">مسابقة أو اختبار خاص</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ إجراء الامتحان</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Subject Breakdown & Max Scores */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    المواد والدرجات العظمى للامتحان:
                  </label>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="text-[11px] font-bold text-[#b8860b] hover:text-[var(--school-primary)] cursor-pointer"
                  >
                    + إضافة مادة أخرى
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedSubjectIds.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#faf8f5] p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={item.subject_id}
                        onChange={(e) => {
                          const updated = [...selectedSubjectIds];
                          updated[idx].subject_id = e.target.value;
                          setSelectedSubjectIds(updated);
                        }}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="العظمى"
                          value={item.max_score}
                          onChange={(e) => {
                            const updated = [...selectedSubjectIds];
                            updated[idx].max_score = Number(e.target.value);
                            updated[idx].pass_score = Number(e.target.value) / 2;
                            setSelectedSubjectIds(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-center font-mono"
                        />
                      </div>

                      {selectedSubjectIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubjectRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publishToggle"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded text-[var(--school-primary)] focus:ring-[var(--school-accent)]"
                />
                <label htmlFor="publishToggle" className="font-bold text-slate-800 cursor-pointer">
                  نشر الامتحان واعتماده في بوابة استعلام نتائج الطلاب
                </label>
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
                  className="px-6 py-2 bg-[var(--school-primary)] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ الامتحان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Exam Delete Modal */}
      {examToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500/30 space-y-4 text-right">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-amiri">تأكيد حذف الامتحان</h3>
                <p className="text-xs text-slate-500">سيتم مسح الامتحان وجميع الدرجات والنتائج المسجلة به</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>هل أنت متأكد من رغبتك في حذف هذا الامتحان نهائياً؟</p>
              <div className="p-2.5 bg-white rounded-lg border border-red-200">
                <div className="font-bold text-sm text-[var(--school-primary)]">{examToDelete.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">تاريخ الامتحان: {examToDelete.exam_date}</div>
              </div>
              <div className="flex items-start gap-1.5 text-red-700 font-medium pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>تحذير: نتائج ودرجات الطلاب المرتبطة بهذا الامتحان ستُحذف أيضاً ولا يمكن استرجاعها.</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteExam}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف الامتحان</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
