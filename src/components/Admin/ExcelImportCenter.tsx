import React, { useState } from 'react';
import { dataService } from '../../lib/storage';
import {
  parseExcelOrCsvFile,
  downloadStudentTemplate,
  downloadResultsTemplate,
  exportValidationErrorsReport,
  ParsedSheetData,
  ValidationErrorItem,
  ValidationSummary
} from '../../lib/excelParser';
import { Student, StudentEnrollment, Result, ImportBatch } from '../../types/database';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Download, ArrowRight, ArrowLeft, RefreshCw, History, ShieldAlert } from 'lucide-react';

export const ExcelImportCenter: React.FC = () => {
  const [importType, setImportType] = useState<'students' | 'results'>('students');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // File & Parsing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // Column Mappings: Target Field -> Excel Header
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  // Validation State
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);

  // Final Report
  const [finalReport, setFinalReport] = useState<{
    successful: number;
    failed: number;
    duplicates: number;
  } | null>(null);

  const importBatches = dataService.getImportBatches();
  const currentAdmin = dataService.getActiveAdmin();

  // Reset wizard
  const resetWizard = () => {
    setSelectedFile(null);
    setParsedData(null);
    setParsingError(null);
    setColumnMappings({});
    setValidationSummary(null);
    setFinalReport(null);
    setCurrentStep(1);
  };

  // Step 1 & 2: Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setParsingError(null);

    try {
      const parsed = await parseExcelOrCsvFile(file);
      setParsedData(parsed);

      // Auto-guess column mappings based on headers
      const initialMap: Record<string, string> = {};
      if (importType === 'students') {
        parsed.headers.forEach(hdr => {
          const lower = hdr.toLowerCase();
          if (lower.includes('كود') || lower.includes('code')) initialMap['student_code'] = hdr;
          else if (lower.includes('اسم') || lower.includes('name')) initialMap['full_name'] = hdr;
          else if (lower.includes('مرحلة') || lower.includes('stage')) initialMap['stage'] = hdr;
          else if (lower.includes('صف') || lower.includes('grade')) initialMap['grade'] = hdr;
          else if (lower.includes('فصل') || lower.includes('class')) initialMap['class'] = hdr;
          else if (lower.includes('هاتف') || lower.includes('phone')) initialMap['phone'] = hdr;
          else if (lower.includes('ولي') || lower.includes('guardian')) initialMap['guardian_name'] = hdr;
          else if (lower.includes('ملاحظ') || lower.includes('notes')) initialMap['notes'] = hdr;
        });
      } else {
        parsed.headers.forEach(hdr => {
          const lower = hdr.toLowerCase();
          if (lower.includes('كود') || lower.includes('code')) initialMap['student_code'] = hdr;
          else if (lower.includes('امتحان') || lower.includes('exam')) initialMap['exam_name'] = hdr;
          else if (lower.includes('مادة') || lower.includes('subject')) initialMap['subject_name'] = hdr;
          else if (lower.includes('درجة') || lower.includes('score')) initialMap['score'] = hdr;
          else if (lower.includes('عظمى') || lower.includes('max')) initialMap['max_score'] = hdr;
        });
      }

      setColumnMappings(initialMap);
      setCurrentStep(3); // Advance to Preview & Mapping
    } catch (err: any) {
      setParsingError(err.message || 'فشل في قراءة الملف.');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Validate Data
  const runValidation = () => {
    if (!parsedData) return;

    const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('ar');
    const errors: ValidationErrorItem[] = [];
    const existingStudents = dataService.getStudents();
    const existingCodes = new Set(existingStudents.map(s => normalize(s.student_code)));
    const fileCodesSet = new Set<string>();
    const resultKeys = new Set<string>();
    const stages = dataService.getStages();
    const grades = dataService.getGrades();
    const classes = dataService.getClasses();
    const exams = dataService.getExams();
    const subjects = dataService.getSubjects();
    const enrollments = dataService.getEnrollments();

    let validCount = 0;
    let duplicateCount = 0;

    parsedData.rows.forEach((row, idx) => {
      const rowNum = row.__rowNum || idx + 2;
      let hasRowError = false;
      const addError = (field: string, value: unknown, message: string) => {
        errors.push({ rowNumber: rowNum, field, value: String(value ?? ''), message });
        hasRowError = true;
      };

      const codeHeader = columnMappings['student_code'];
      const codeVal = codeHeader ? String(row[codeHeader] ?? '').trim() : '';
      if (!codeHeader || !codeVal) {
        addError('كود الطالب', codeVal, 'يجب اختيار عمود كود الطالب وإدخال كود في كل صف.');
      } else {
        const codeKey = normalize(codeVal);
        if (importType === 'students' && fileCodesSet.has(codeKey)) {
          addError('كود الطالب', codeVal, `كود الطالب (${codeVal}) مكرر داخل الملف.`);
          duplicateCount++;
        } else if (importType === 'students') fileCodesSet.add(codeKey);

        if (importType === 'students' && existingCodes.has(codeKey)) {
          addError('كود الطالب', codeVal, `كود الطالب (${codeVal}) مسجل بالفعل في قاعدة البيانات.`);
          duplicateCount++;
        }
        if (importType === 'results' && !existingCodes.has(codeKey)) {
          addError('كود الطالب', codeVal, `كود الطالب (${codeVal}) غير موجود في سجلات المدرسة.`);
        }
      }

      if (importType === 'students') {
        const nameHeader = columnMappings['full_name'];
        const nameVal = nameHeader ? String(row[nameHeader] ?? '').trim() : '';
        if (!nameHeader || !nameVal) addError('اسم الطالب', nameVal, 'يجب اختيار عمود الاسم وإدخال اسم الطالب.');

        const stageHeader = columnMappings['stage'];
        const gradeHeader = columnMappings['grade'];
        const classHeader = columnMappings['class'];
        const stageName = stageHeader ? row[stageHeader] : '';
        const gradeName = gradeHeader ? row[gradeHeader] : '';
        const className = classHeader ? row[classHeader] : '';
        const stage = stages.find(item => normalize(item.name) === normalize(stageName));
        const grade = grades.find(item => item.stage_id === stage?.id && normalize(item.name) === normalize(gradeName));
        const classItem = classes.find(item => item.grade_id === grade?.id && normalize(item.name) === normalize(className));

        if (!stageHeader || !normalize(stageName) || !stage) addError('المستوى', stageName, 'حدد عمود المستوى واكتب اسم مستوى موجودًا في قاعدة البيانات.');
        if (!gradeHeader || !normalize(gradeName) || !grade) addError('السنة الدراسية', gradeName, 'حدد عمود السنة واكتب سنة تابعة للمستوى المختار.');
        if (!classHeader || !normalize(className) || !classItem) addError('الفصل', className, 'حدد عمود الفصل واكتب فصلًا تابعًا للسنة المختارة.');
      } else {
        const scoreHeader = columnMappings['score'];
        const score = scoreHeader ? Number(String(row[scoreHeader] ?? '').replace(',', '.')) : NaN;
        if (!scoreHeader || !Number.isFinite(score) || score < 0) {
          addError('الدرجة', scoreHeader ? row[scoreHeader] : '', 'اختر عمود الدرجة وأدخل رقمًا صحيحًا غير سالب.');
        }

        const examHeader = columnMappings['exam_name'];
        const subjectHeader = columnMappings['subject_name'];
        const examName = examHeader ? row[examHeader] : '';
        const subjectName = subjectHeader ? row[subjectHeader] : '';
        const exam = exams.find(item => normalize(item.name) === normalize(examName));
        const examSubject = exam
          ? dataService.getExamSubjects(exam.id).find(item =>
              normalize(subjects.find(subject => subject.id === item.subject_id)?.name) === normalize(subjectName)
            )
          : undefined;

        if (!examHeader || !normalize(examName) || !exam) addError('الامتحان', examName, 'حدد عمود الامتحان واكتب اسم امتحان موجودًا كما هو في النظام.');
        if (!subjectHeader || !normalize(subjectName) || !examSubject) addError('المادة', subjectName, 'حدد عمود المادة واكتب مادة مضافة لهذا الامتحان.');
        if (examSubject && Number.isFinite(score) && score > Number(examSubject.max_score)) {
          addError('الدرجة', score, `الدرجة تتجاوز النهاية العظمى للمادة (${examSubject.max_score}).`);
        }

        const student = existingStudents.find(item => normalize(item.student_code) === normalize(codeVal));
        const enrollment = student && exam ? enrollments.find(item =>
          item.student_id === student.id &&
          item.academic_year_id === exam.academic_year_id &&
          (!exam.stage_id || item.stage_id === exam.stage_id) &&
          (!exam.grade_id || item.grade_id === exam.grade_id) &&
          (!exam.class_id || item.class_id === exam.class_id)
        ) : undefined;
        if (student && exam && !enrollment) addError('القيد الدراسي', codeVal, 'الطالب غير مقيد في المستوى والسنة والفصل المحدد للامتحان.');

        if (student && examSubject && scoreHeader && Number.isFinite(score)) {
          const key = `${student.id}:${examSubject.id}`;
          if (resultKeys.has(key)) {
            addError('الدرجة', score, 'يوجد أكثر من سجل لنفس الطالب والمادة والامتحان داخل الملف.');
            duplicateCount++;
          } else resultKeys.add(key);
        }
      }

      if (!hasRowError) validCount++;
    });

    setValidationSummary({
      isValid: errors.length === 0,
      totalRows: parsedData.totalRows,
      validCount,
      invalidCount: parsedData.totalRows - validCount,
      duplicateCount,
      errors
    });
    setCurrentStep(6);
  };

  // Step 8: Commit only rows that passed validation and match real school records.
  const handleCommitImport = async () => {
    if (!parsedData || !validationSummary) return;

    setLoading(true);
    setParsingError(null);
    let successful = 0;
    let failed = 0;
    const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('ar');
    const activeYear = dataService.getAcademicYears().find(year => year.is_active)?.id || '';
    const stages = dataService.getStages();
    const grades = dataService.getGrades();
    const classes = dataService.getClasses();
    const exams = dataService.getExams();
    const subjects = dataService.getSubjects();

    try {
      const errorRows = new Set(validationSummary.errors.map(error => error.rowNumber));
      parsedData.rows.forEach((row, idx) => {
        const rowNum = row.__rowNum || idx + 2;
        if (errorRows.has(rowNum)) { failed++; return; }

        const code = String(row[columnMappings['student_code']] ?? '').trim();
        if (importType === 'students') {
          if (!activeYear) { failed++; return; }
          const stage = stages.find(item => normalize(item.name) === normalize(row[columnMappings['stage']]));
          const grade = grades.find(item => item.stage_id === stage?.id && normalize(item.name) === normalize(row[columnMappings['grade']]));
          const classItem = classes.find(item => item.grade_id === grade?.id && normalize(item.name) === normalize(row[columnMappings['class']]));
          if (!stage || !grade || !classItem) { failed++; return; }

          const studentId = `stu-imp-${Date.now()}-${idx}`;
          const newStudent: Student = {
            id: studentId,
            student_code: code,
            full_name: String(row[columnMappings['full_name']] ?? '').trim(),
            phone: columnMappings['phone'] ? String(row[columnMappings['phone']] ?? '').trim() : '',
            guardian_name: columnMappings['guardian_name'] ? String(row[columnMappings['guardian_name']] ?? '').trim() : '',
            notes: columnMappings['notes'] ? String(row[columnMappings['notes']] ?? '').trim() : '',
            is_active: true,
            created_at: new Date().toISOString()
          };
          const saved = dataService.saveStudent(newStudent);
          if (!saved.success) { failed++; return; }
          dataService.saveEnrollment({
            id: `enr-${studentId}`,
            student_id: studentId,
            academic_year_id: activeYear,
            stage_id: stage.id,
            grade_id: grade.id,
            class_id: classItem.id,
            enrollment_status: 'enrolled',
            created_at: new Date().toISOString()
          });
          successful++;
        } else {
          const student = dataService.findStudentByCode(code);
          const exam = exams.find(item => normalize(item.name) === normalize(row[columnMappings['exam_name']]));
          const examSubject = exam
            ? dataService.getExamSubjects(exam.id).find(item =>
                normalize(subjects.find(subject => subject.id === item.subject_id)?.name) === normalize(row[columnMappings['subject_name']])
              )
            : undefined;
          const score = Number(String(row[columnMappings['score']] ?? '').replace(',', '.'));
          if (!student || !examSubject || !Number.isFinite(score)) { failed++; return; }
          const saved = dataService.saveResult({
            id: `res-imp-${student.id}-${examSubject.id}`,
            student_id: student.id,
            exam_subject_id: examSubject.id,
            score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_published: false,
            published_at: null
          });
          if (saved.success) successful++;
          else failed++;
        }
      });

      const batch: ImportBatch = {
        id: `batch-${Date.now()}`,
        uploaded_by: currentAdmin?.full_name || 'مسؤول الكنترول',
        file_name: selectedFile?.name || 'ملف_إكسل.xlsx',
        import_type: importType,
        total_rows: parsedData.totalRows,
        successful_rows: successful,
        failed_rows: failed,
        created_at: new Date().toISOString()
      };
      dataService.saveImportBatch(batch);
      await dataService.flush();

      setFinalReport({ successful, failed, duplicates: validationSummary.duplicateCount });
      setCurrentStep(9);
    } catch (error) {
      setParsingError('تعذر حفظ بيانات الاستيراد في قاعدة البيانات: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-amiri text-[var(--school-primary)] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[var(--school-accent)]" />
            <span>مركز استيراد ومعالجة ملفات الإكسل (Excel Import Center)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            استيراد دفعات الطلاب والنتائج مع الحفاظ الصارم على الأكواد المانوية وفحص التكرار والأخطاء
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadStudentTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--school-accent)]" />
            <span>تحميل قالب الطلاب (.XLSX)</span>
          </button>
          <button
            onClick={downloadResultsTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--school-accent)]" />
            <span>تحميل قالب النتائج (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-[var(--school-primary)] text-white p-4 rounded-2xl flex items-center justify-between overflow-x-auto text-xs">
        {[
          { step: 1, label: '1. رفع الملف' },
          { step: 3, label: '2. المعاينة وتعيين الأعمدة' },
          { step: 6, label: '3. الفحص والتحقق' },
          { step: 7, label: '4. التأكيد والاستيراد' },
          { step: 9, label: '5. التقرير النهائي' },
        ].map((s) => (
          <div
            key={s.step}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentStep >= s.step
                ? 'bg-[#162a4d] text-[#e0c588] font-bold border-b border-[var(--school-accent)]'
                : 'text-slate-400'
            }`}
          >
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Upload File */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-center gap-4 bg-slate-100 p-1.5 rounded-xl max-w-xs mx-auto">
              <button
                onClick={() => setImportType('students')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  importType === 'students' ? 'bg-[var(--school-primary)] text-white' : 'text-slate-600'
                }`}
              >
                استيراد سجلات طلاب
              </button>
              <button
                onClick={() => setImportType('results')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  importType === 'results' ? 'bg-[var(--school-primary)] text-white' : 'text-slate-600'
                }`}
              >
                استيراد درجات ونتائج
              </button>
            </div>

            <div className="border-2 border-dashed border-[var(--school-accent)]/50 roun          {/* Mapping Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-slate-200 text-xs">
            {(importType === 'students' ? [
              ['student_code', 'كود الطالب *'],
              ['full_name', 'اسم الطالب *'],
              ['stage', 'المستوى *'],
              ['grade', 'السنة الدراسية *'],
              ['class', 'الفصل *'],
              ['phone', 'رقم الهاتف'],
              ['guardian_name', 'اسم ولي الأمر'],
              ['notes', 'ملاحظات'],
            ] : [
              ['student_code', 'كود الطالب *'],
              ['exam_name', 'اسم الامتحان *'],
              ['subject_name', 'المادة *'],
              ['score', 'الدرجة *'],
            ]).map(([field, label]) => (
              <div key={field}>
                <label className="block font-bold text-slate-700 mb-1">{label}</label>
                <select
                  value={columnMappings[field] || ''}
                  onChange={(e) => setColumnMappings({ ...columnMappings, [field]: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">-- اختر العمود --</option>
                  {parsedData.headers.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>
            ))}
          </div>

            <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم الطالب <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={columnMappings['full_name'] || ''}
                    onChange={(e) => setColumnMappings({ ...columnMappings, full_name: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">-- اختر عمود الاسم --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <select
                    value={columnMappings['phone'] || ''}
                    onChange={(e) => setColumnMappings({ ...columnMappings, phone: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">-- اختياري --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الطالب المطابق</label>
                  <select
                    value={columnMappings['student_code'] || ''}
                    onChange={(e) => setColumnMappings({ ...columnMappings, student_code: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">-- اختر عمود الكود --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدرجة الحاصل عليها</label>
                  <select
                    value={columnMappings['score'] || ''}
                    onChange={(e) => setColumnMappings({ ...columnMappings, score: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">-- اختر عمود الدرجة --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Preview First 5 Rows */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              معاينة أولية للصفوف الأولى من الملف:
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="py-2.5 px-3">رقم الصف</th>
                    {parsedData.headers.map(h => (
                      <th key={h} className="py-2.5 px-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {parsedData.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-sans">{idx + 2}</td>
                      {parsedData.headers.map(h => (
                        <td key={h} className="py-2 px-3 text-slate-800">{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6 & 7: Validation Errors Review & Confirmation */}
      {currentStep === 6 && validationSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-amiri text-[var(--school-primary)]">
                الخطوة 3: نتائج فحص وتدقيق البيانات
              </h3>
              <p className="text-xs text-slate-500">
                تم فحص تطابق الأكواد وصحة الحقول المطلوبة قبل الحفظ النهائي في قاعدة البيانات
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg cursor-pointer"
              >
                تعديل التعيينات
              </button>
              {validationSummary.errors.length > 0 && (
                <button
                  onClick={() => exportValidationErrorsReport(validationSummary.errors)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير تقرير الأخطاء (Excel)</span>
                </button>
              )}
            </div>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">إجمالي الصفوف</span>
              <span className="text-2xl font-bold font-mono text-slate-900">{validationSummary.totalRows}</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-700 block">صفوف سليمة وجاهزة</span>
              <span className="text-2xl font-bold font-mono text-emerald-800">{validationSummary.validCount}</span>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-xs text-amber-700 block">أكواد مكررة</span>
              <span className="text-2xl font-bold font-mono text-amber-800">{validationSummary.duplicateCount}</span>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
              <span className="text-xs text-red-700 block">صفوف تحوي أخطاء</span>
              <span className="text-2xl font-bold font-mono text-red-800">{validationSummary.invalidCount}</span>
            </div>
          </div>

          {/* Error List */}
          {validationSummary.errors.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>تفاصيل الأخطاء المرصودة ({validationSummary.errors.length} خطأ):</span>
              </h4>
              <div className="max-h-60 overflow-y-auto border border-red-200 rounded-xl divide-y divide-red-100 bg-red-50/40 text-xs">
                {validationSummary.errors.map((err, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-red-900">صف {err.rowNumber}: </span>
                      <span className="text-slate-700 font-semibold">{err.field} – </span>
                      <span className="text-red-700">{err.message}</span>
                    </div>
                    {err.value && (
                      <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {String(err.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>جميع الصفوف في الملف صالحة ومطابقة لشروط الكنترول 100%! لا توجد أكواد مكررة.</span>
            </div>
          )}

          {/* Final Confirmation Banner */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              سيتم استيراد <strong>{validationSummary.validCount}</strong> سجل وحفظ الأكواد المانوية بدقة دون توليد عشوائي.
            </span>

            <button
              onClick={handleCommitImport}
              disabled={validationSummary.validCount === 0}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد واستيراد السجلات الصالحة</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: Detailed Final Report */}
      {currentStep === 9 && finalReport && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-amiri text-[var(--school-primary)]">
              اكتملت عملية الاستيراد بنجاح!
            </h3>
            <p className="text-xs text-slate-500">
              تم تحديث قاعدة بيانات المدرسة بسجلات الملف المستورد
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-xs">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="block text-emerald-700">تم استيراده بنجاح</span>
              <span className="text-xl font-bold font-mono text-emerald-900">{finalReport.successful}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="block text-amber-700">أكواد مكررة تم رفضها</span>
              <span className="text-xl font-bold font-mono text-amber-900">{finalReport.duplicates}</span>
            </div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <span className="block text-red-700">سجلات غير مكتملة</span>
              <span className="text-xl font-bold font-mono text-red-900">{finalReport.failed}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={resetWizard}
              className="px-6 py-2.5 bg-[var(--school-primary)] text-white text-xs font-bold rounded-xl cursor-pointer shadow"
            >
              استيراد ملف جديد
            </button>
          </div>
        </div>
      )}

      {/* Import History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-sm text-[var(--school-primary)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--school-accent)]" />
          <span>سجل عمليات الاستيراد السابقة (Import Audit Log)</span>
        </h3>

        {importBatches.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">لا توجد عمليات استيراد سابقة مسجلة.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-3">اسم الملف</th>
                  <th className="py-2.5 px-3">النوع</th>
                  <th className="py-2.5 px-3">القائم بالاستيراد</th>
                  <th className="py-2.5 px-3 text-center">الناجح</th>
                  <th className="py-2.5 px-3 text-center">المرفوض</th>
                  <th className="py-2.5 px-3">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{b.file_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{b.import_type === 'students' ? 'طلاب' : 'نتائج'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{b.uploaded_by}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{b.successful_rows}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-red-600">{b.failed_rows}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{new Date(b.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
