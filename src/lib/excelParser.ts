import * as XLSX from 'xlsx';
import { Student, Result, StudentEnrollment } from '../types/database';

export interface ParsedSheetData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ColumnMapping {
  excelColumn: string;
  targetField: string;
}

export interface ValidationErrorItem {
  rowNumber: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  errors: ValidationErrorItem[];
}

/**
 * Parse uploaded file (.xlsx or .csv)
 */
export async function parseExcelOrCsvFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات بعد العناوين.');
        }

        const headers = (rawJson[0] as any[]).map(h => String(h).trim()).filter(Boolean);
        const rows: Record<string, any>[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const rowData = rawJson[i];
          if (!rowData || rowData.length === 0 || rowData.every((cell: any) => cell === '' || cell == null)) {
            continue; // Skip empty row
          }
          const rowObj: Record<string, any> = { __rowNum: i + 1 };
          headers.forEach((hdr, idx) => {
            rowObj[hdr] = rowData[idx] !== undefined ? String(rowData[idx]).trim() : '';
          });
          rows.push(rowObj);
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length
        });
      } catch (err: any) {
        reject(new Error(err.message || 'فشل في قراءة ملف الإكسل. يرجى التأكد من سلامة صيغة الملف (.xlsx أو .csv).'));
      }
    };

    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة الملف من الجهاز.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Generate download templates for students and results
 */
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'كود الطالب (إلزامي وفريد)': 'ETCH-3001',
      'اسم الطالب بالكامل': 'بيتر ماهر سمير غبريال',
      'رقم هاتف الطالب': '01234567890',
      'اسم ولي الأمر': 'ماهر سمير غبريال',
      'هاتف ولي الأمر': '01234567899',
      'المرحلة الدراسية': 'مرحلة الابتدائي (فرسان المذبح)',
      'الصف الدراسي': 'الصف الثالث والرابع الابتدائي',
      'الفصل': 'فصل القديس أثناسيوس الرسولي',
      'ملاحظات': 'شماس منتظم ومواظب على الحضور'
    },
    {
      'كود الطالب (إلزامي وفريد)': 'ETCH-3002',
      'اسم الطالب بالكامل': 'مريم ناصر عزيز عوض',
      'رقم هاتف الطالب': '01011223344',
      'اسم ولي الأمر': 'ناصر عزيز عوض',
      'هاتف ولي الأمر': '01011223355',
      'المرحلة الدراسية': 'مرحلة الحضانة (براعم الألحان)',
      'الصف الدراسي': 'حضانة كبرى (KG1 & KG2)',
      'الفصل': 'فصل رئيس الملائكة ميخائيل',
      'ملاحظات': 'تحفظ المردات القصيرة ببراعة'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج_بيانات_الطلاب');
  XLSX.writeFile(wb, 'نموذج_استيراد_طلاب_مدرسة_الألحان.xlsx');
}

export function downloadResultsTemplate() {
  const sampleData = [
    {
      'كود الطالب': 'ETCH-1001',
      'اسم الطالب (للتأكيد)': 'أبانوب جميل يوسف بطرس',
      'اسم الامتحان': 'امتحان نصف العام الدراسي - دور يناير 2026',
      'المادة': 'الألحان الكنسية',
      'الدرجة الحاصل عليها': 48,
      'الدرجة العظمى': 50
    },
    {
      'كود الطالب': 'ETCH-1001',
      'اسم الطالب (للتأكيد)': 'أبانوب جميل يوسف بطرس',
      'اسم الامتحان': 'امتحان نصف العام الدراسي - دور يناير 2026',
      'المادة': 'الطقس الكنسي',
      'الدرجة الحاصل عليها': 24,
      'الدرجة العظمى': 25
    },
    {
      'كود الطالب': 'ETCH-1002',
      'اسم الطالب (للتأكيد)': 'مينا عماد غالي سركيس',
      'اسم الامتحان': 'امتحان نصف العام الدراسي - دور يناير 2026',
      'المادة': 'الألحان الكنسية',
      'الدرجة الحاصل عليها': 44,
      'الدرجة العظمى': 50
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج_النتائج');
  XLSX.writeFile(wb, 'نموذج_استيراد_نتائج_الامتحانات.xlsx');
}

/**
 * Download validation errors report as Excel
 */
export function exportValidationErrorsReport(errors: ValidationErrorItem[], fileName = 'تقرير_أخطاء_الاستيراد.xlsx') {
  const rows = errors.map(e => ({
    'رقم الصف': e.rowNumber,
    'الحقل': e.field,
    'القيمة الخاطئة': String(e.value ?? ''),
    'وصف الخطأ': e.message
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الأخطاء');
  XLSX.writeFile(wb, fileName);
}
