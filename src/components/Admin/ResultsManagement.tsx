import React, { useState } from 'react';
import { dataService } from '../../lib/storage';
import { getSupabaseClient } from '../../lib/supabase';
import { Exam, ExamSubject, Student, Result } from '../../types/database';
import { Award, Save, Search, CheckCircle2, AlertCircle, FileSpreadsheet, Eye, Printer } from 'lucide-react';
import { SchoolSeal, CopticCross } from '../CopticIcons';

interface ResultsManagementProps {
  onOpenExcelImport: () => void;
}

export const ResultsManagement: React.FC<ResultsManagementProps> = ({ onOpenExcelImport }) => {
  const exams = dataService.getExams();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  
  const [results, setResults] = useState<Result[]>(dataService.getResults());
  const [students, setStudents] = useState<Student[]>(dataService.getStudents());
  const subjects = dataService.getSubjects();
  const examSubjects = dataService.getExamSubjects(selectedExamId);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const enrollments = dataService.getEnrollments();
  const activeAdmin = dataService.getActiveAdmin();
  const canPublishResults = activeAdmin?.role === 'super_admin';

  // Local draft scores: key = `${studentId}_${examSubjectId}` -> score
  const [scoresDraft, setScoresDraft] = useState<Record<string, number>>(() => {
    const draft: Record<string, number> = {};
    results.forEach(r => {
      draft[`${r.student_id}_${r.exam_subject_id}`] = r.score;
    });
    return draft;
  });

  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  const handleScoreChange = (studentId: string, examSubjectId: string, val: string, maxScore: number) => {
    const num = parseFloat(val);
    const key = `${studentId}_${examSubjectId}`;

    if (val === '') {
      const updated = { ...scoresDraft };
      delete updated[key];
      setScoresDraft(updated);
      return;
    }

    if (isNaN(num) || num < 0) {
      return;
    }

    setScoresDraft(prev => ({
      ...prev,
      [key]: num > maxScore ? maxScore : num
    }));
  };

  const handleSaveAllResults = async () => {
    if (!selectedExam || !examSubjects.length) {
      setStatusMessage({ type: 'error', text: 'اختر امتحانًا وأضف مواده أولاً.' });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatusMessage({ type: 'error', text: 'تعذر الاتصال بقاعدة البيانات.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const examSubjectIds = examSubjects.map(item => item.id);
      const subjectIdSet = new Set(examSubjectIds);
      const enrolledStudentIds = new Set(filteredStudents.map(student => student.id));
      const changedRows = Object.entries(scoresDraft).flatMap(([key, score]) => {
        const [studentId, examSubjectId] = key.split('_');
        if (!studentId || !subjectIdSet.has(examSubjectId) || !enrolledStudentIds.has(studentId)) return [];
        const previous = results.find(item => item.student_id === studentId && item.exam_subject_id === examSubjectId);
        if (previous && Number(previous.score) === Number(score)) return [];
        return [{
          student_id: studentId,
          exam_subject_id: examSubjectId,
          score: Number(score),
          is_published: false,
          published_at: null,
          updated_at: new Date().toISOString(),
        }];
      });
      const rowsToDelete = results.filter(item =>
        subjectIdSet.has(item.exam_subject_id) &&
        enrolledStudentIds.has(item.student_id) &&
        scoresDraft[`${item.student_id}_${item.exam_subject_id}`] === undefined
      );

      if (!changedRows.length && !rowsToDelete.length) {
        setStatusMessage({ type: 'success', text: 'لا توجد تغييرات جديدة لحفظها.' });
        return;
      }

      // Any edit withdraws the complete exam result set until the super admin approves it again.
      const { error: withdrawError } = await supabase.from('results')
        .update({ is_published: false, published_at: null })
        .in('exam_subject_id', examSubjectIds)
        .eq('is_published', true);
      if (withdrawError) throw withdrawError;

      if (rowsToDelete.length) {
        const { error } = await supabase.from('results')
          .delete().in('id', rowsToDelete.map(item => item.id));
        if (error) throw error;
      }

      if (changedRows.length) {
        const { error } = await supabase.from('results')
          .upsert(changedRows, { onConflict: 'student_id,exam_subject_id' });
        if (error) throw error;
      }

      const { data, error } = await supabase.from('results').select('*');
      if (error) throw error;
      setResults(data ?? []);
      setStatusMessage({
        type: 'success',
        text: `تم حفظ ${changedRows.length} درجة وحذف ${rowsToDelete.length} كمسودة. يجب على المسؤول الرئيسي إعادة اعتماد نتائج الامتحان قبل ظهورها للطلاب.`
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'تعذر حفظ الدرجات: ' + (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishResults = async () => {
    if (!canPublishResults || !selectedExam || !examSubjects.length) return;
    if (!allAssignedStudents.length) {
      setStatusMessage({ type: 'error', text: 'لا يوجد طلاب مقيدون في نطاق هذا الامتحان.' });
      return;
    }
    if (missingScoreCount > 0) {
      setStatusMessage({ type: 'error', text: `لا يمكن اعتماد النتائج قبل رصد جميع الدرجات. الدرجات الناقصة: ${missingScoreCount}.` });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatusMessage({ type: 'error', text: 'تعذر الاتصال بقاعدة البيانات.' });
      return;
    }

    setPublishing(true);
    setStatusMessage(null);
    try {
      const examSubjectIds = examSubjects.map(item => item.id);
      const { data: publishedRows, error: publishError } = await supabase.from('results')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .in('exam_subject_id', examSubjectIds)
        .select('id');
      if (publishError) throw publishError;
      if (!publishedRows?.length) {
        setStatusMessage({ type: 'error', text: 'لا توجد درجات محفوظة لهذا الامتحان لاعتمادها.' });
        return;
      }

      const { error: examError } = await supabase.from('exams')
        .update({ is_published: true })
        .eq('id', selectedExam.id);
      if (examError) throw examError;

      const { data, error } = await supabase.from('results').select('*');
      if (error) throw error;
      setResults(data ?? []);
      setStatusMessage({ type: 'success', text: `تم اعتماد ونشر ${publishedRows.length} درجة للطلاب بنجاح.` });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'تعذر اعتماد النتائج: ' + (error as Error).message });
    } finally {
      setPublishing(false);
    }
  };

  // Filtered students
  const assignedStudentIds = new Set(enrollments.filter(enrollment =>
    enrollment.academic_year_id === selectedExam?.academic_year_id &&
    (!selectedExam?.stage_id || enrollment.stage_id === selectedExam.stage_id) &&
    (!selectedExam?.grade_id || enrollment.grade_id === selectedExam.grade_id) &&
    (!selectedExam?.class_id || enrollment.class_id === selectedExam.class_id)
  ).map(enrollment => enrollment.student_id));
  const allAssignedStudents = students.filter(student => student.is_active && assignedStudentIds.has(student.id));
  const missingScoreCount = allAssignedStudents.reduce((missing, student) =>
    missing + examSubjects.filter(es => !results.some(result => result.student_id === student.id && result.exam_subject_id === es.id)).length,
    0
  );
  const filteredStudents = allAssignedStudents.filter(student => {
    const q = searchQuery.toLowerCase();
    return student.full_name.toLowerCase().includes(q) || student.student_code.toLowerCase().includes(q);
  });

  const totalMaxScore = examSubjects.reduce((acc, curr) => acc + curr.max_score, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-amiri text-[var(--school-primary)] flex items-center gap-2">
            <Award className="w-6 h-6 text-[var(--school-accent)]" />
            <span>رصد درجات الطلاب والكنترول الإلكتروني</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدخال وتعديل درجات المواد، حساب المجاميع والنسب المئوية والتقديرات تلقائياً
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenExcelImport}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد درجات من إكسل</span>
          </button>
          <button
            onClick={handleSaveAllResults}
            disabled={saving || !selectedExam}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[var(--school-primary)] hover:bg-[#162a4d] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4 text-[var(--school-accent)]" />
            <span>{saving ? 'جارٍ حفظ المسودة...' : 'حفظ الدرجات كمسودة'}</span>
          </button>
          {canPublishResults && (
            <button
              onClick={handlePublishResults}
              disabled={publishing || !selectedExam || !allAssignedStudents.length || missingScoreCount > 0}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{publishing ? 'جارٍ الاعتماد...' : missingScoreCount > 0 ? `درجات ناقصة (${missingScoreCount})` : 'اعتماد ونشر للطلاب'}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          <span className="font-bold">{statusMessage.text}</span>
        </div>
      )}

      {selectedExam?.is_published && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          تعديل أي درجة محفوظة سيسحب نشر نتائج الامتحان بالكامل مؤقتًا، ولن تظهر مرة أخرى إلا بعد اعتماد المسؤول الرئيسي.
        </div>
      )}

      {/* Selector and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-bold text-slate-700 mb-1">اختر دورة الامتحان للرصد:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-accent)] focus:outline-none cursor-pointer"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.name} {ex.is_published ? '(منشور)' : '(مسودة)'}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-xs font-bold text-slate-700 mb-1">بحث عن طالب:</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
              className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[var(--school-accent)] focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Main Grade Entry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[var(--school-primary)] text-white">
                <th className="py-3.5 px-4">كود الطالب</th>
                <th className="py-3.5 px-4">اسم الطالب ثلاثي</th>
                {examSubjects.map(es => {
                  const s = subjects.find(sub => sub.id === es.subject_id);
                  return (
                    <th key={es.id} className="py-3.5 px-3 text-center">
                      <div>{s?.name}</div>
                      <div className="text-[10px] text-[var(--school-accent)] font-mono">(العظمى: {es.max_score})</div>
                    </th>
                  );
                })}
                <th className="py-3.5 px-3 text-center font-bold">المجموع</th>
                <th className="py-3.5 px-3 text-center font-bold">النسبة %</th>
                <th className="py-3.5 px-3 text-center font-bold">التقدير</th>
                <th className="py-3.5 px-3 text-center">معاينة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student) => {
                let totalObtained = 0;
                let hasAnyScore = false;

                examSubjects.forEach(es => {
                  const key = `${student.id}_${es.id}`;
                  const score = scoresDraft[key];
                  if (score !== undefined) {
                    totalObtained += score;
                    hasAnyScore = true;
                  }
                });

                const percentage = totalMaxScore > 0 ? Number(((totalObtained / totalMaxScore) * 100).toFixed(2)) : 0;
                const evalInfo = hasAnyScore ? dataService.calculateEvaluation(percentage) : null;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {student.student_code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-amiri text-sm">
                      {student.full_name}
                    </td>

                    {/* Subject Inputs */}
                    {examSubjects.map(es => {
                      const key = `${student.id}_${es.id}`;
                      const currentVal = scoresDraft[key] !== undefined ? scoresDraft[key] : '';

                      return (
                        <td key={es.id} className="py-3 px-2 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={es.max_score}
                            value={currentVal}
                            onChange={(e) => handleScoreChange(student.id, es.id, e.target.value, es.max_score)}
                            placeholder="—"
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[var(--school-accent)] focus:outline-none"
                          />
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {hasAnyScore ? totalObtained : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {hasAnyScore ? `${percentage}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {evalInfo ? (
                        <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: evalInfo.color }}>
                          {evalInfo.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setPreviewStudent(student)}
                        className="p-1 rounded text-slate-500 hover:text-[var(--school-primary)] hover:bg-slate-100 cursor-pointer"
                        title="معاينة شهادة الطالب"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Student Certificate Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative text-right my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base font-amiri text-[var(--school-primary)]">
                شهادة الطالب: {previewStudent.full_name} ({previewStudent.student_code})
              </h3>
              <button
                onClick={() => setPreviewStudent(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#faf8f5] rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span>الامتحان: <strong>{selectedExam?.name}</strong></span>
                <span>كود الطالب: <strong className="font-mono">{previewStudent.student_code}</strong></span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                {examSubjects.map(es => {
                  const s = subjects.find(sub => sub.id === es.subject_id);
                  const score = scoresDraft[`${previewStudent.id}_${es.id}`] ?? 0;
                  return (
                    <div key={es.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span>{s?.name}</span>
                      <span className="font-mono font-bold">{score} / {es.max_score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[var(--school-primary)] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[var(--school-accent)]" />
                <span>طباعة الشهادة الرسمية</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
