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

    const errors: ValidationErrorItem[] = [];
    const existingStudents = dataService.getStudents();
    const existingCodes = new Set(existingStudents.map(s => s.student_code.trim().toLowerCase()));
    const fileCodesSet = new Set<string>();

    let validCount = 0;
    let duplicateCount = 0;

    parsedData.rows.forEach((row, idx) => {
      const rowNum = row.__rowNum || idx + 2;
      let hasRowError = false;

      if (importType === 'students') {
        const codeHeader = columnMappings['student_code'];
        const nameHeader = columnMappings['full_name'];

        const codeVal = codeHeader ? String(row[codeHeader] || '').trim() : '';
        const nameVal = nameHeader ? String(row[nameHeader] || '').trim() : '';

        // Validation 1: Student Code is required
        if (!codeVal) {
          errors.push({
            rowNumber: rowNum,
            field: 'كود الطالب',
            value: codeVal,
            message: 'كود الطالب فارغ. كود الطالب إلزامي ويجب تحديده يدوياً.'
          });
          hasRowError = true;
        } else {
          // Validation 2: Code uniqueness within file
          const codeKey = codeVal.toLowerCase();
          if (fileCodesSet.has(codeKey)) {
            errors.push({
              rowNumber: rowNum,
              field: 'كود الطالب',
              value: codeVal,
              message: `كود الطالب (${codeVal}) مكرر أكثر من مرة داخل نفس ملف الإكسل.`
            });
            duplicateCount++;
            hasRowError = true;
          } else {
            fileCodesSet.add(codeKey);
          }

          // Validation 3: Code uniqueness in database
          if (existingCodes.has(codeKey)) {
            errors.push({
              rowNumber: rowNum,
              field: 'كود الطالب',
              value: codeVal,
              message: `كود الطالب (${codeVal}) مسجل مسبقاً في قاعدة بيانات المدرسة. يُمنع الكتابة فوق سجلات الطلاب القائمة.`
            });
            duplicateCount++;
            hasRowError = true;
          }
        }

        // Validation 4: Student Name is required
        if (!nameVal) {
          errors.push({
            rowNumber: rowNum,
            field: 'اسم الطالب',
            value: nameVal,
            message: 'اسم الطالب فارغ. يجب إدخال اسم ثلاثي أو رباعي للطالب.'
          });
          hasRowError = true;
        }

      } else {
        // Results Validation
        const codeHeader = columnMappings['student_code'];
        const scoreHeader = columnMappings['score'];

        const codeVal = codeHeader ? String(row[codeHeader] || '').trim() : '';
        const scoreVal = scoreHeader ? parseFloat(String(row[scoreHeader])) : NaN;

        if (!codeVal) {
          errors.push({
            rowNumber: rowNum,
            field: 'كود الطالب',
            value: codeVal,
            message: 'كود الطالب فارغ في سجل الدرجة.'
          });
          hasRowError = true;
        } else if (!existingCodes.has(codeVal.toLowerCase())) {
          errors.push({
            rowNumber: rowNum,
            field: 'كود الطالب',
            value: codeVal,
            message: `كود الطالب (${codeVal}) غير موجود في سجلات المدرسة.`
          });
          hasRowError = true;
        }

        if (isNaN(scoreVal) || scoreVal < 0) {
          errors.push({
            rowNumber: rowNum,
            field: 'الدرجة',
            value: row[scoreHeader],
            message: 'الدرجة غير صحيحة أو سالبة.'
          });
          hasRowError = true;
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

    setCurrentStep(6); // Advance to Validation Review
  };

  // Step 8: Commit Valid Records
  const handleCommitImport = () => {
    if (!parsedData || !validationSummary) return;

    let successful = 0;
    let failed = 0;
    const activeYear = dataService.getAcademicYears().find(y => y.is_active)?.id || '';
    const stages = dataService.getStages();
    const grades = dataService.getGrades();
    const classes = dataService.getClasses();

    if (importType === 'students') {
      const codeHdr = columnMappings['student_code'];
      const nameHdr = columnMappings['full_name'];
      const phoneHdr = columnMappings['phone'];
      const guardianHdr = columnMappings['guardian_name'];
      const notesHdr = columnMappings['notes'];

      // Row numbers that failed validation
      const errorRows = new Set(validationSummary.errors.map(e => e.rowNumber));

      parsedData.rows.forEach((row, idx) => {
        const rowNum = row.__rowNum || idx + 2;
        if (errorRows.has(rowNum)) {
          failed++;
          return;
        }

        const code = String(row[codeHdr]).trim();
        const name = String(row[nameHdr]).trim();
        const phone = phoneHdr ? String(row[phoneHdr] || '').trim() : '';
        const guardian = guardianHdr ? String(row[guardianHdr] || '').trim() : '';
        const notes = notesHdr ? String(row[notesHdr] || '').trim() : '';

        const studentId = `stu-imp-${Date.now()}-${idx}`;
        const newStudent: Student = {
          id: studentId,
          student_code: code, // Strictly preserve manual code from Excel
          full_name: name,
          phone,
          guardian_name: guardian,
          notes,
          is_active: true,
          created_at: new Date().toISOString()
        };

        const res = dataService.saveStudent(newStudent);
        if (res.success) {
          // Default enrollment into primary stage / class 1
          dataService.saveEnrollment({
            id: `enr-${studentId}`,
            student_id: studentId,
            academic_year_id: activeYear,
            stage_id: stages[1]?.id || stages[0]?.id || '',
            grade_id: grades[2]?.id || grades[0]?.id || '',
            class_id: classes[0]?.id || '',
            enrollment_status: 'enrolled',
            created_at: new Date().toISOString()
          });
          successful++;
        } else {
          failed++;
        }
      });
    } else {
      // Results Import logic
      const codeHdr = columnMappings['student_code'];
      const scoreHdr = columnMappings['score'];
      const exams = dataService.getExams();
      const firstExam = exams[0];
      const examSubjects = dataService.getExamSubjects(firstExam?.id);
      const firstSubject = examSubjects[0];

      const errorRows = new Set(validationSummary.errors.map(e => e.rowNumber));

      parsedData.rows.forEach((row, idx) => {
        const rowNum = row.__rowNum || idx + 2;
        if (errorRows.has(rowNum)) {
          failed++;
          return;
        }

        const code = String(row[codeHdr]).trim();
        const student = dataService.findStudentByCode(code);
        const score = parseFloat(String(row[scoreHdr]));

        if (student && firstSubject) {
          dataService.saveResult({
            id: `res-imp-${student.id}-${firstSubject.id}`,
            student_id: student.id,
            exam_subject_id: firstSubject.id,
            score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          successful++;
        } else {
          failed++;
        }
      });
    }

    // Save batch record to history
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

    setFinalReport({
      successful,
      failed,
      duplicates: validationSummary.duplicateCount
    });

    setCurrentStep(9); // Detailed Report Step
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

            <div className="border-2 border-dashed border-[var(--school-accent)]/50 rounded-2xl p-8 hover:bg-[#faf8f5] transition-colors relative cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#b8860b] flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--school-primary)]">
                    اضغط هنا لاختيار ملف الإكسل أو اسحبه داخل هذا المربع
                  </p>
                  <p className="text-xs text-slate-500 mt-1">يدعم ملفات (.xlsx, .csv)</p>
                </div>
              </div>
            </div>

            {parsingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{parsingError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Preview Table and Column Mapping */}
      {currentStep === 3 && parsedData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-amiri text-[var(--school-primary)]">
                الخطوة 2: معاينة البيانات وتعيين أعمدة الإكسل
              </h3>
              <p className="text-xs text-slate-500">
                تمت قراءة <strong className="font-mono">{parsedData.totalRows}</strong> صف من الملف. طابق أعمدة الملف مع حقول قاعدة البيانات.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetWizard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer"
              >
                إلغاء واختيار ملف آخر
              </button>
              <button
                onClick={runValidation}
                className="px-5 py-2 bg-[var(--school-primary)] hover:bg-[#162a4d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
              >
                <span>فحص البيانات والتحقق</span>
                <ArrowLeft className="w-4 h-4 text-[var(--school-accent)]" />
              </button>
            </div>
          </div>

          {/* Mapping Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-slate-200 text-xs">
            {importType === 'students' ? (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    كود الطالب <span className="text-red-600">* (يدوي وفريد)</span>
                  </label>
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
