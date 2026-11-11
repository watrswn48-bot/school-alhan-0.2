import React, { useState } from 'react';
import { dataService } from '../../lib/storage';
import { AcademicYear, EducationalStage, Grade, ClassItem, Subject, SemesterTerm, ClassCategory } from '../../types/database';
import {
  Layers,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  GraduationCap,
  FolderTree,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Filter,
  Tag,
  Clock
} from 'lucide-react';

export const getTermBadge = (term?: SemesterTerm) => {
  if (term === 'term2') {
    return { text: 'الترم الثاني', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  if (term === 'both') {
    return { text: 'سنوي (طوال العام)', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
  }
  return { text: 'الترم الأول', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
};

export const getCategoryBadge = (cat?: ClassCategory) => {
  switch (cat) {
    case 'kg':
      return { text: 'كيجي', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'grade_1_2':
      return { text: 'أولى وتانية', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'grade_3_4':
      return { text: 'تالتة ورابعة', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'grade_5_6':
      return { text: 'خامسة وستة', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'prep_sec':
      return { text: 'إعدادي وثانوي', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
    case 'primary':
      return { text: 'ابتدائي', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
    case 'prep':
      return { text: 'إعدادي', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    case 'secondary':
      return { text: 'ثانوي وشباب', bg: 'bg-violet-50 text-violet-800 border-violet-200' };
    case 'graduates':
      return { text: 'شمامسة وخريجين', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
    case 'general':
      return { text: 'عام', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    default:
      return { text: 'فصل كنسي', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const AcademicManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'years' | 'stages' | 'classes' | 'subjects'>('classes');
  
  const [years, setYears] = useState<AcademicYear[]>(dataService.getAcademicYears());
  const [stages, setStages] = useState<EducationalStage[]>(dataService.getStages());
  const [grades, setGrades] = useState<Grade[]>(dataService.getGrades());
  const [classes, setClasses] = useState<ClassItem[]>(dataService.getClasses());
  const [subjects, setSubjects] = useState<Subject[]>(dataService.getSubjects());

  // Notification message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Create Forms
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('2026-09-15');
  const [newYearEnd, setNewYearEnd] = useState('2027-06-30');

  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');

  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState(stages[0]?.id || '');

  const [newClassName, setNewClassName] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState(grades[0]?.id || '');
  const [newClassTerm, setNewClassTerm] = useState<SemesterTerm>('term1');
  const [newClassCategory, setNewClassCategory] = useState<ClassCategory>('grade_1_2');

  // Filters for classes
  const [filterStageId, setFilterStageId] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [confirmApplyTwoLevelsModal, setConfirmApplyTwoLevelsModal] = useState<boolean>(false);

  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjDesc, setNewSubjDesc] = useState('');

  // Editing States
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingStage, setEditingStage] = useState<EducationalStage | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const refreshData = () => {
    setYears(dataService.getAcademicYears());
    setStages(dataService.getStages());
    setGrades(dataService.getGrades());
    setClasses(dataService.getClasses());
    setSubjects(dataService.getSubjects());
  };

  // --- Years Operations ---
  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;

    dataService.saveAcademicYear({
      id: `year-${Date.now()}`,
      name: newYearName.trim(),
      start_date: newYearStart,
      end_date: newYearEnd,
      is_active: false,
      created_at: new Date().toISOString()
    });

    setNewYearName('');
    refreshData();
    showToast('تمت إضافة العام الدراسي بنجاح');
  };

  const handleUpdateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear || !editingYear.name.trim()) return;

    dataService.saveAcademicYear(editingYear);
    setEditingYear(null);
    refreshData();
    showToast('تم تعديل بيانات العام الدراسي بنجاح');
  };

  // Deletion Target State for In-App Modal (eliminates blocked window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'year' | 'stage' | 'grade' | 'class' | 'subject';
    id: string;
    name: string;
    typeLabel: string;
    warning?: string;
  } | null>(null);

  const executeDelete = () => {
    if (!deleteTarget) return;
    const { type, id, name, typeLabel } = deleteTarget;

    if (type === 'year') {
      dataService.deleteAcademicYear(id);
    } else if (type === 'stage') {
      const stageGrades = grades.filter(g => g.stage_id === id);
      stageGrades.forEach(g => {
        classes.filter(c => c.grade_id === g.id).forEach(c => dataService.deleteClass(c.id));
        dataService.deleteGrade(g.id);
      });
      dataService.deleteStage(id);
    } else if (type === 'grade') {
      classes.filter(c => c.grade_id === id).forEach(c => dataService.deleteClass(c.id));
      dataService.deleteGrade(id);
    } else if (type === 'class') {
      dataService.deleteClass(id);
    } else if (type === 'subject') {
      dataService.deleteSubject(id);
    }

    refreshData();
    showToast(`تم حذف ${typeLabel} (${name}) بنجاح`);
    setDeleteTarget(null);
  };

  const handleDeleteYear = (year: AcademicYear) => {
    if (year.is_active && years.length <= 1) {
      showToast('لا يمكن حذف العام الدراسي النشط الوحيد بالنظام', 'error');
      return;
    }
    setDeleteTarget({
      type: 'year',
      id: year.id,
      name: year.name,
      typeLabel: 'العام الدراسي',
      warning: year.is_active ? 'تنبيه: هذا هو العام الدراسي النشط حالياً.' : undefined
    });
  };

  const handleSetActiveYear = (yearId: string) => {
    dataService.setActiveAcademicYear(yearId);
    refreshData();
    showToast('تم تعيين العام الدراسي كعام نشط');
  };

  // --- Stages Operations ---
  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    dataService.saveStage({
      id: `stage-${Date.now()}`,
      name: newStageName.trim(),
      description: newStageDesc.trim(),
      display_order: stages.length + 1
    });

    setNewStageName('');
    setNewStageDesc('');
    refreshData();
    showToast('تمت إضافة المرحلة التعليمية بنجاح');
  };

  const handleUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editingStage.name.trim()) return;

    dataService.saveStage(editingStage);
    setEditingStage(null);
    refreshData();
    showToast('تم تعديل المرحلة التعليمية بنجاح');
  };

  const handleDeleteStage = (stage: EducationalStage) => {
    const stageGrades = grades.filter(g => g.stage_id === stage.id);
    setDeleteTarget({
      type: 'stage',
      id: stage.id,
      name: stage.name,
      typeLabel: 'المرحلة التعليمية',
      warning: stageGrades.length > 0 ? `تنبيه: توجد ${stageGrades.length} صفوف دراسية وجميع فصولها التابعة لهذه المرحلة سيتم إزالتها أيضاً.` : undefined
    });
  };

  // --- Grades Operations ---
  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;

    dataService.saveGrade({
      id: `grade-${Date.now()}`,
      stage_id: newGradeStageId || stages[0]?.id || '',
      name: newGradeName.trim(),
      display_order: grades.length + 1
    });

    setNewGradeName('');
    refreshData();
    showToast('تمت إضافة الصف الدراسي بنجاح');
  };

  const handleUpdateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !editingGrade.name.trim()) return;

    dataService.saveGrade(editingGrade);
    setEditingGrade(null);
    refreshData();
    showToast('تم تعديل الصف الدراسي بنجاح');
  };

  const handleDeleteGrade = (grade: Grade) => {
    const gradeClasses = classes.filter(c => c.grade_id === grade.id);
    setDeleteTarget({
      type: 'grade',
      id: grade.id,
      name: grade.name,
      typeLabel: 'الصف الدراسي',
      warning: gradeClasses.length > 0 ? `تنبيه: يوجد ${gradeClasses.length} فصل كنسي مرتبط بهذا الصف سيتم حذفه أيضاً.` : undefined
    });
  };

  const handleApplyTwoLevelsPreset = () => {
    dataService.applyTwoLevelsFourYearsStructure();
    refreshData();
    setConfirmApplyTwoLevelsModal(false);
    showToast('تم تطبيق الهيكل المعتمد بنجاح (مستويان × ٤ سنوات × ترمين)');
  };

  // --- Classes Operations ---
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const activeYearId = years.find(y => y.is_active)?.id || years[0]?.id || '';
    dataService.saveClass({
      id: `class-${Date.now()}`,
      grade_id: newClassGradeId || grades[0]?.id || '',
      academic_year_id: activeYearId,
      name: newClassName.trim(),
      term: newClassTerm,
      category: newClassCategory
    });

    setNewClassName('');
    refreshData();
    showToast('تمت إضافة الفصل بنجاح');
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name.trim()) return;

    dataService.saveClass(editingClass);
    setEditingClass(null);
    refreshData();
    showToast(`تم تعديل الفصل (${editingClass.name}) بنجاح`);
  };

  const handleDeleteClass = (cls: ClassItem) => {
    setDeleteTarget({
      type: 'class',
      id: cls.id,
      name: cls.name,
      typeLabel: 'الفصل الكنسي'
    });
  };

  // --- Subjects Operations ---
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    dataService.saveSubject({
      id: `subj-${Date.now()}`,
      name: newSubjName.trim(),
      description: newSubjDesc.trim()
    });

    setNewSubjName('');
    setNewSubjDesc('');
    refreshData();
    showToast('تمت إضافة المادة الكنسية بنجاح');
  };

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.name.trim()) return;

    dataService.saveSubject(editingSubject);
    setEditingSubject(null);
    refreshData();
    showToast(`تم تعديل مادة (${editingSubject.name}) بنجاح`);
  };

  const handleDeleteSubject = (subj: Subject) => {
    setDeleteTarget({
      type: 'subject',
      id: subj.id,
      name: subj.name,
      typeLabel: 'المادة الكنسية'
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-md text-xs font-bold transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with 2-Level System Explanation & Preset Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-amiri text-[#0c1a30] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#c5a059]" />
              <span>إدارة الهيكل الأكاديمي والسنوات والمراحل</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              تعديل وإدارة كافة الفصول، الصفوف، المراحل، والمناهج بحرية كاملة مع دعم نظام المستويين
            </p>
          </div>

          <button
            onClick={() => setConfirmApplyTwoLevelsModal(true)}
            className="px-4 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] rounded-xl text-xs font-bold flex items-center gap-2 shadow cursor-pointer transition-all self-start md:self-auto border border-[#c5a059]/40 hover:shadow-md"
          >
            <Sparkles className="w-4 h-4 text-[#c5a059]" />
            <span>تطبيق الهيكل المعتمد (مستويين × ٤ سنوات × ترمين)</span>
          </button>
        </div>

        {/* System Architecture Badge Bar */}
        <div className="bg-[#faf8f5] border border-amber-200/80 rounded-xl p-3.5 text-xs text-slate-700 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#0c1a30] pl-2 border-l border-amber-300">
            <span className="w-2 h-2 rounded-full bg-[#c5a059]"></span>
            <span>نظام المدرسة المعتمد:</span>
          </div>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>مستويان (المستوى الأول والمستوى الثاني)</span>
          </span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>٤ سنوات لكل مستوى (السنة 1 إلى 4)</span>
          </span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>ترمين لكل سنة (الترم الأول والترم الثاني)</span>
          </span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>تقسيم الفصول: كيجي • أولى وتانية • تالتة ورابعة • خامسة وستة • إعدادي وثانوي</span>
          </span>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-3 overflow-x-auto">
          {[
            { id: 'classes', label: 'الصفوف والفصول الكنسية', count: `${grades.length} صف / ${classes.length} فصل` },
            { id: 'subjects', label: 'المواد والمناهج الكنسية', count: `${subjects.length} مادة` },
            { id: 'stages', label: 'المراحل والمستويات', count: `${stages.length} مستويات` },
            { id: 'years', label: 'السنوات والأعوام الدراسية', count: `${years.length} سنوات` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === t.id
                  ? 'bg-[#0c1a30] text-[#e0c588]'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === t.id ? 'bg-white/10 text-[#e0c588]' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Classes and Grades Tab (PRIMARY FOCUS OF USER REQUEST) */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#c5a059]" />
                  <span>الصفوف والفصول (مستويين × ٤ سنوات × ترمين)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  يمكنك تعديل اسم أي فصل أو نقله أو تغيير ترمه وفئته في أي وقت
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-[#b8860b] px-2.5 py-1 rounded-full font-bold border border-amber-200 self-start sm:self-auto">
                {classes.length} فصل مسجل
              </span>
            </div>

            {/* Filters Bar: Level, Term, Category */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <Filter className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>تصفية عرض الفصول والصفوف:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المستوى:</label>
                  <select
                    value={filterStageId}
                    onChange={(e) => setFilterStageId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="all">جميع المستويات ({stages.length})</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">الترم الدراسي:</label>
                  <select
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="all">جميع الترمات</option>
                    <option value="term1">الترم الأول فقط</option>
                    <option value="term2">الترم الثاني فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">فئة الفصل:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-bold"
                  >
                    <option value="all">جميع الفئات ({classes.length})</option>
                    <option value="kg">كيجي</option>
                    <option value="grade_1_2">أولى وتانية</option>
                    <option value="grade_3_4">تالتة ورابعة</option>
                    <option value="grade_5_6">خامسة وستة</option>
                    <option value="prep_sec">إعدادي وثانوي</option>
                    <option value="general">عام / أخرى</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grades & Classes Tree */}
            <div className="space-y-4">
              {grades
                .filter(g => filterStageId === 'all' || g.stage_id === filterStageId)
                .map(g => {
                  const stage = stages.find(s => s.id === g.stage_id);
                  const gradeClasses = classes.filter(c => {
                    if (c.grade_id !== g.id) return false;
                    if (filterTerm !== 'all' && c.term && c.term !== filterTerm && c.term !== 'both') return false;
                    if (filterCategory !== 'all' && c.category && c.category !== filterCategory) return false;
                    return true;
                  });

                  return (
                    <div key={g.id} className="p-4 bg-[#faf8f5] rounded-xl border border-slate-200 space-y-3">
                      {/* Grade Header with Edit/Delete */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">{g.name}</span>
                          <span className="text-[11px] text-[#b8860b] font-medium">{stage?.name || 'مرحلة غير محددة'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingGrade(g)}
                            title="تعديل الصف الدراسي"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0c1a30] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(g)}
                            title="حذف الصف الدراسي"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Classes in Grade */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>الفصول الكنسية المسجلة ({gradeClasses.length}):</span>
                        </div>
                        {gradeClasses.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2 bg-white/60 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                            لا توجد فصول تطابق التصفية في هذا الصف. يمكنك إضافة فصل جديد من النموذج الجانبي.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {gradeClasses.map(c => {
                              const termBadge = getTermBadge(c.term);
                              const catBadge = getCategoryBadge(c.category);

                              return (
                                <div
                                  key={c.id}
                                  className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-xs hover:border-[#c5a059] transition-all group shadow-2xs space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="space-y-1">
                                      <span className="font-bold text-slate-800 block text-xs group-hover:text-[#0c1a30]">
                                        {c.name}
                                      </span>
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${termBadge.bg}`}>
                                          {termBadge.text}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg}`}>
                                          {catBadge.text}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => setEditingClass(c)}
                                        title="تعديل اسم الفصل والترم والفئة"
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClass(c)}
                                        title="حذف الفصل"
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Add Class Form with Term & Category */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#c5a059]" />
                <span>إضافة فصل كنسي جديد</span>
              </h3>
              <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الصف / السنة التابع لها</label>
                  <select
                    value={newClassGradeId}
                    onChange={(e) => setNewClassGradeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({stages.find(s => s.id === g.stage_id)?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الترم الدراسي</label>
                    <select
                      value={newClassTerm}
                      onChange={(e) => setNewClassTerm(e.target.value as SemesterTerm)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    >
                      <option value="term1">الترم الأول</option>
                      <option value="term2">الترم الثاني</option>
                      <option value="both">سنوي (طوال العام)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">المرحلة والفئة</label>
                    <select
                      value={newClassCategory}
                      onChange={(e) => setNewClassCategory(e.target.value as ClassCategory)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    >
                      <option value="kg">كيجي</option>
                      <option value="grade_1_2">أولى وتانية</option>
                      <option value="grade_3_4">تالتة ورابعة</option>
                      <option value="grade_5_6">خامسة وستة</option>
                      <option value="prep_sec">إعدادي وثانوي</option>
                      <option value="general">عام / أخرى</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم الفصل (اسم القديس / الشفيع)</label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="مثال: فصل القديس أثناسيوس الرسولي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  حفظ وإضافة الفصل +
                </button>
              </form>
            </div>

            {/* Add Grade Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#c5a059]" />
                <span>إضافة صف دراسي جديد</span>
              </h3>
              <form onSubmit={handleCreateGrade} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المرحلة التابع لها</label>
                  <select
                    value={newGradeStageId}
                    onChange={(e) => setNewGradeStageId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم الصف الدراسي</label>
                  <input
                    type="text"
                    required
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    placeholder="مثال: الصف الثاني الإعدادي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  حفظ الصف الدراسي
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subjects Tab (USER REQUEST: تعديل المواد القديمة) */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#c5a059]" />
                  <span>المواد والمناهج الكنسية (تعديل وحذف أي مادة)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  يمكنك تعديل اسم أي مادة قديمة ومحتواها، أو إضافة مواد جديدة للامتحانات
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-[#b8860b] px-2.5 py-1 rounded-full font-bold border border-amber-200">
                {subjects.length} مادة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {subjects.map(s => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-[#faf8f5] border border-slate-200 space-y-2 hover:border-[#c5a059] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 font-amiri text-sm">{s.name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingSubject(s)}
                          title="تعديل المادة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s)}
                          title="حذف المادة"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed mt-1 text-[11px]">
                      {s.description || 'لا يوجد وصف مضاف لهذه المادة.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>كود المادة: {s.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#c5a059]" />
              <span>إضافة مادة كنسية جديدة</span>
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المادة الكنسية</label>
                <input
                  type="text"
                  required
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  placeholder="مثال: الألحان السنوية وتسبحة نصف الليل"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف المادة والمنهج الدراسي</label>
                <textarea
                  rows={4}
                  value={newSubjDesc}
                  onChange={(e) => setNewSubjDesc(e.target.value)}
                  placeholder="موضوعات المادة، المستهدف حفظه، والضوابط الطقسية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer transition-all"
              >
                إضافة المادة الكنسية
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Stages Tab */}
      {activeTab === 'stages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#c5a059]" />
                <span>المراحل التعليمية المسجلة (تعديل وحذف)</span>
              </h3>
              <span className="text-xs bg-amber-50 text-[#b8860b] px-2.5 py-1 rounded-full font-bold border border-amber-200">
                {stages.length} مراحل
              </span>
            </div>

            <div className="space-y-3">
              {stages.map((stg, idx) => (
                <div key={stg.id} className="p-4 rounded-xl bg-[#faf8f5] border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0c1a30] font-amiri">
                      {idx + 1}. {stg.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">الترتيب: {stg.display_order}</span>
                      <button
                        onClick={() => setEditingStage(stg)}
                        title="تعديل المرحلة"
                        className="p-1 text-slate-600 hover:text-[#0c1a30] hover:bg-white rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stg)}
                        title="حذف المرحلة"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{stg.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#c5a059]" />
              <span>إضافة مرحلة تعليمية</span>
            </h3>
            <form onSubmit={handleCreateStage} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المرحلة</label>
                <input
                  type="text"
                  required
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="مثال: مرحلة الماجستير الكنسي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف المرحلة</label>
                <textarea
                  rows={3}
                  value={newStageDesc}
                  onChange={(e) => setNewStageDesc(e.target.value)}
                  placeholder="الوصف والهدف من المرحلة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer transition-all"
              >
                إضافة المرحلة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Academic Years Tab */}
      {activeTab === 'years' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#c5a059]" />
                <span>سجل السنوات الدراسية (تعديل وتحديد العام النشط)</span>
              </h3>
              <span className="text-xs bg-amber-50 text-[#b8860b] px-2.5 py-1 rounded-full font-bold border border-amber-200">
                {years.length} أعوام
              </span>
            </div>

            <div className="space-y-3">
              {years.map(yr => (
                <div key={yr.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0c1a30] font-mono">{yr.name}</span>
                      {yr.is_active && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          العام الدراسي النشط
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      من: {yr.start_date} إلى: {yr.end_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!yr.is_active && (
                      <button
                        onClick={() => handleSetActiveYear(yr.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        تعيين كعام نشط
                      </button>
                    )}
                    <button
                      onClick={() => setEditingYear(yr)}
                      title="تعديل العام الدراسي"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-[#0c1a30] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteYear(yr)}
                      title="حذف العام الدراسي"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#c5a059]" />
              <span>إضافة سنة دراسية جديدة</span>
            </h3>
            <form onSubmit={handleCreateYear} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم السنة الدراسية</label>
                <input
                  type="text"
                  required
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="مثال: 2026 - 2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ البدء</label>
                <input
                  type="date"
                  required
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء</label>
                <input
                  type="date"
                  required
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer transition-all"
              >
                حفظ السنة الدراسية
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALS FOR EDITING ================= */}

      {/* 1. Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0c1a30] font-amiri flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c5a059]" />
                <span>تعديل بيانات الفصل الكنسي</span>
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الصف الدراسي التابع له الفصل</label>
                <select
                  value={editingClass.grade_id}
                  onChange={(e) => setEditingClass({ ...editingClass, grade_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({stages.find(s => s.id === g.stage_id)?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الفصل (اسم القديس)</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الترم الدراسي</label>
                  <select
                    value={editingClass.term || 'term1'}
                    onChange={(e) => setEditingClass({ ...editingClass, term: e.target.value as SemesterTerm })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="term1">الترم الأول</option>
                    <option value="term2">الترم الثاني</option>
                    <option value="both">سنوي (طوال العام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المرحلة والفئة للفصل</label>
                  <select
                    value={editingClass.category || 'grade_1_2'}
                    onChange={(e) => setEditingClass({ ...editingClass, category: e.target.value as ClassCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="kg">كيجي</option>
                    <option value="grade_1_2">أولى وتانية</option>
                    <option value="grade_3_4">تالتة ورابعة</option>
                    <option value="grade_5_6">خامسة وستة</option>
                    <option value="prep_sec">إعدادي وثانوي</option>
                    <option value="general">عام / أخرى</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0c1a30] font-amiri flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c5a059]" />
                <span>تعديل المادة الكنسية والمنهج</span>
              </h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المادة</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الوصف والمنهج</label>
                <textarea
                  rows={4}
                  value={editingSubject.description}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ تعديل المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Grade Modal */}
      {editingGrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0c1a30] font-amiri flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c5a059]" />
                <span>تعديل الصف الدراسي</span>
              </h3>
              <button
                onClick={() => setEditingGrade(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المرحلة التابع لها</label>
                <select
                  value={editingGrade.stage_id}
                  onChange={(e) => setEditingGrade({ ...editingGrade, stage_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الصف</label>
                <input
                  type="text"
                  required
                  value={editingGrade.name}
                  onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الترتيب</label>
                <input
                  type="number"
                  value={editingGrade.display_order}
                  onChange={(e) => setEditingGrade({ ...editingGrade, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ تعديل الصف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0c1a30] font-amiri flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c5a059]" />
                <span>تعديل المرحلة التعليمية</span>
              </h3>
              <button
                onClick={() => setEditingStage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المرحلة</label>
                <input
                  type="text"
                  required
                  value={editingStage.name}
                  onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف المرحلة</label>
                <textarea
                  rows={3}
                  value={editingStage.description}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الترتيب</label>
                <input
                  type="number"
                  value={editingStage.display_order}
                  onChange={(e) => setEditingStage({ ...editingStage, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ تعديل المرحلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Academic Year Modal */}
      {editingYear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0c1a30] font-amiri flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c5a059]" />
                <span>تعديل العام الدراسي</span>
              </h3>
              <button
                onClick={() => setEditingYear(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateYear} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم العام الدراسي</label>
                <input
                  type="text"
                  required
                  value={editingYear.name}
                  onChange={(e) => setEditingYear({ ...editingYear, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={editingYear.start_date}
                    onChange={(e) => setEditingYear({ ...editingYear, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    required
                    value={editingYear.end_date}
                    onChange={(e) => setEditingYear({ ...editingYear, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingYear(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer"
                >
                  حفظ تعديل العام الدراسي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. In-App Delete Confirmation Modal (Bypasses sandboxed iframe blocked window.confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500/30 space-y-4 text-right">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-amiri">تأكيد عملية الحذف</h3>
                <p className="text-xs text-slate-500">هذا الإجراء مباشر ولا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-1.5">
              <p>
                هل أنت متأكد من رغبتك في حذف <span className="font-bold text-red-700">{deleteTarget.typeLabel}</span>:
              </p>
              <p className="font-bold text-sm text-[#0c1a30] bg-white p-2.5 rounded-lg border border-red-200 font-mono">
                "{deleteTarget.name}"
              </p>
              {deleteTarget.warning && (
                <div className="flex items-start gap-1.5 text-red-700 font-medium pt-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{deleteTarget.warning}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. Apply Two-Levels Structure Preset Confirmation Modal */}
      {confirmApplyTwoLevelsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#c5a059] space-y-4 text-right">
            <div className="flex items-center gap-3 text-[#0c1a30] pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#c5a059]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0c1a30] font-amiri">تطبيق الهيكل المعتمد للمدرسة</h3>
                <p className="text-xs text-slate-500">نظام المستويين (٤ سنوات × ترمين × فصول المراحل)</p>
              </div>
            </div>

            <div className="bg-[#faf8f5] border border-amber-200/80 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-bold text-[#0c1a30]">
                سيتم ضبط وتحديث الهيكل الأكاديمي الحالي ليطابق بالضبط نظام المدرسة المعتمد:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-medium">
                <li><strong className="text-slate-800">مستويان رئيسيان:</strong> المستوى الأول والمستوى الثاني.</li>
                <li><strong className="text-slate-800">٤ سنوات لكل مستوى:</strong> السنة الأولى إلى السنة الرابعة.</li>
                <li><strong className="text-slate-800">ترمين لكل سنة:</strong> الترم الأول والترم الثاني للامتحانات والنتائج.</li>
                <li><strong className="text-slate-800">التقسيم المعتمد للفصول:</strong> كيجي • أولى وتانية • تالتة ورابعة • خامسة وستة • إعدادي وثانوي.</li>
                <li>مع الاحتفاظ بإمكانية التعديل والإضافة والحذف في أي وقت بحرية تامة.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmApplyTwoLevelsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleApplyTwoLevelsPreset}
                className="px-5 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#c5a059]" />
                <span>نعم، تطبيق الهيكل المعتمد الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
