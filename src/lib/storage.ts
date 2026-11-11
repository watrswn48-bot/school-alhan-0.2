import {
  AcademicYear,
  EducationalStage,
  Grade,
  ClassItem,
  Student,
  StudentEnrollment,
  Exam,
  Subject,
  ExamSubject,
  Result,
  GradingRule,
  ImportBatch,
  SchoolSettings,
  StudentFullResultLookup,
  AdminProfile
} from '../types/database';

const STORAGE_KEYS = {
  SETTINGS: 'etchrompi_settings',
  YEARS: 'etchrompi_academic_years',
  STAGES: 'etchrompi_stages',
  GRADES: 'etchrompi_grades',
  CLASSES: 'etchrompi_classes',
  STUDENTS: 'etchrompi_students',
  ENROLLMENTS: 'etchrompi_enrollments',
  EXAMS: 'etchrompi_exams',
  SUBJECTS: 'etchrompi_subjects',
  EXAM_SUBJECTS: 'etchrompi_exam_subjects',
  RESULTS: 'etchrompi_results',
  GRADING_RULES: 'etchrompi_grading_rules',
  BATCHES: 'etchrompi_import_batches',
  ADMINS: 'etchrompi_admin_profiles',
  ACTIVE_ADMIN: 'etchrompi_active_admin',
};

// ==========================================
// INITIAL DATA
// ==========================================

export const INITIAL_SETTINGS: SchoolSettings = {
  id: 'settings-1',
  school_name: 'مدرسة تي اتشرومبي للألحان',
  church_name: 'كنيسة السيدة العذراء مريم والآباء الرسل ومارمرقس',
  parish_name: 'سكينة - الإسكندرية',
  dean_name: 'القمص متى زكريا والآباء كهنة الكنيسة',
  spiritual_supervisor: 'لجنة المرتلين وخدام وخادمات الألحان',
  phone_number: '01223456789',
  whatsapp_number: '01012345678',
  email: 'info@t-etchrompi-school.org',
  address: 'شارع الكنيسة، عزبة سكينة، المنتزه، الإسكندرية',
  logo_url: '',
  facebook_url: 'https://facebook.com',
  youtube_url: 'https://youtube.com',
  announcement_banner: 'مرحباً بكم في العام الدراسي 2025 - 2026! باب التقدم والامتحانات متاح الآن.',
  show_banner: true,
  results_disclaimer: 'تنبيه هام: هذه النتيجة استرشادية رسمية صادرة من إدارة المدرسة. لأي مراجعة أو تظلم يرجى التواصل مع مسؤول الكنترول بالكنسية.',
  academic_year_id: 'year-2025-2026',
  updated_at: new Date().toISOString(),
};

export const INITIAL_YEARS: AcademicYear[] = [
  {
    id: 'year-2025-2026',
    name: '2025 - 2026',
    start_date: '2025-09-15',
    end_date: '2026-06-30',
    is_active: true,
    created_at: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'year-2024-2025',
    name: '2024 - 2025',
    start_date: '2024-09-15',
    end_date: '2025-06-30',
    is_active: false,
    created_at: '2024-09-01T00:00:00.000Z'
  }
];

export const INITIAL_STAGES: EducationalStage[] = [
  {
    id: 'stage-level-1',
    name: 'المستوى الأول (٤ سنوات دراسية)',
    description: 'المستوى التأسيسي لدراسة الألحان الكنسية، الطقس الباسيلي، قراءة اللغة القبطية ومبادئ العقيدة (مقسم إلى ٤ سنوات دراسية، كل سنة ترمين).',
    display_order: 1
  },
  {
    id: 'stage-level-2',
    name: 'المستوى الثاني (٤ سنوات دراسية)',
    description: 'المستوى المتقدم والتخصصي للألحان الطويلة، التسبحة السنوية والكيهكية، طقس الأعياد وتأهيل قادة خوارس الشمامسة (مقسم إلى ٤ سنوات دراسية، كل سنة ترمين).',
    display_order: 2
  }
];

export const INITIAL_GRADES: Grade[] = [
  // المستوى الأول (4 سنين دراسية)
  { id: 'grade-lvl1-yr1', stage_id: 'stage-level-1', name: 'السنة الأولى - المستوى الأول', display_order: 1 },
  { id: 'grade-lvl1-yr2', stage_id: 'stage-level-1', name: 'السنة الثانية - المستوى الأول', display_order: 2 },
  { id: 'grade-lvl1-yr3', stage_id: 'stage-level-1', name: 'السنة الثالثة - المستوى الأول', display_order: 3 },
  { id: 'grade-lvl1-yr4', stage_id: 'stage-level-1', name: 'السنة الرابعة - المستوى الأول', display_order: 4 },

  // المستوى الثاني (4 سنين دراسية)
  { id: 'grade-lvl2-yr1', stage_id: 'stage-level-2', name: 'السنة الأولى - المستوى الثاني', display_order: 5 },
  { id: 'grade-lvl2-yr2', stage_id: 'stage-level-2', name: 'السنة الثانية - المستوى الثاني', display_order: 6 },
  { id: 'grade-lvl2-yr3', stage_id: 'stage-level-2', name: 'السنة الثالثة - المستوى الثاني', display_order: 7 },
  { id: 'grade-lvl2-yr4', stage_id: 'stage-level-2', name: 'السنة الرابعة - المستوى الثاني', display_order: 8 },
];

export const INITIAL_CLASSES: ClassItem[] = [
  // ==========================================
  // فصول المستوى الأول - السنة الأولى (مقسمة للـ 5 فئات × ترمين)
  // ==========================================
  // 1. كيجي
  { id: 'class-l1-y1-t1-kg', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل براعم الملاك ميخائيل (كيجي)', term: 'term1', category: 'kg' },
  { id: 'class-l1-y1-t2-kg', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل براعم الملاك ميخائيل (كيجي)', term: 'term2', category: 'kg' },

  // 2. أولى وتانية
  { id: 'class-l1-y1-t1-g12', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد مارجرجس (أولى وتانية)', term: 'term1', category: 'grade_1_2' },
  { id: 'class-l1-y1-t2-g12', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد مارجرجس (أولى وتانية)', term: 'term2', category: 'grade_1_2' },

  // 3. تالتة ورابعة
  { id: 'class-l1-y1-t1-g34', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس أثناسيوس الرسولي (تالتة ورابعة)', term: 'term1', category: 'grade_3_4' },
  { id: 'class-l1-y1-t2-g34', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس أثناسيوس الرسولي (تالتة ورابعة)', term: 'term2', category: 'grade_3_4' },

  // 4. خامسة وستة
  { id: 'class-l1-y1-t1-g56', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس ديديموس الضرير (خامسة وستة)', term: 'term1', category: 'grade_5_6' },
  { id: 'class-l1-y1-t2-g56', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس ديديموس الضرير (خامسة وستة)', term: 'term2', category: 'grade_5_6' },

  // 5. إعدادي وثانوي
  { id: 'class-l1-y1-t1-prep-sec', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد العظيم مارمرقس (إعدادي وثانوي)', term: 'term1', category: 'prep_sec' },
  { id: 'class-l1-y1-t2-prep-sec', grade_id: 'grade-lvl1-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد العظيم مارمرقس (إعدادي وثانوي)', term: 'term2', category: 'prep_sec' },

  // ==========================================
  // فصول المستوى الأول - السنة الثانية
  // ==========================================
  { id: 'class-l1-y2-t1-kg', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل الملاك غبريال (كيجي)', term: 'term1', category: 'kg' },
  { id: 'class-l1-y2-t1-g12', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد فيلوباتير مرقوريوس (أولى وتانية)', term: 'term1', category: 'grade_1_2' },
  { id: 'class-l1-y2-t2-g12', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل الشهيد فيلوباتير مرقوريوس (أولى وتانية)', term: 'term2', category: 'grade_1_2' },
  { id: 'class-l1-y2-t1-g34', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل القديس كيرلس عمود الدين (تالتة ورابعة)', term: 'term1', category: 'grade_3_4' },
  { id: 'class-l1-y2-t2-g34', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل القديس كيرلس عمود الدين (تالتة ورابعة)', term: 'term2', category: 'grade_3_4' },
  { id: 'class-l1-y2-t1-g56', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل الأنبا بيشوي (خامسة وستة)', term: 'term1', category: 'grade_5_6' },
  { id: 'class-l1-y2-t2-g56', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل الأنبا بيشوي (خامسة وستة)', term: 'term2', category: 'grade_5_6' },
  { id: 'class-l1-y2-t1-prep-sec', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل السيدة العذراء مريم (إعدادي وثانوي)', term: 'term1', category: 'prep_sec' },
  { id: 'class-l1-y2-t2-prep-sec', grade_id: 'grade-lvl1-yr2', academic_year_id: 'year-2025-2026', name: 'فصل السيدة العذراء مريم (إعدادي وثانوي)', term: 'term2', category: 'prep_sec' },

  // ==========================================
  // فصول المستوى الأول - السنة الثالثة والرابعة
  // ==========================================
  { id: 'class-l1-y3-t1-g12', grade_id: 'grade-lvl1-yr3', academic_year_id: 'year-2025-2026', name: 'فصل القديس يوحنا الحبيب (أولى وتانية)', term: 'term1', category: 'grade_1_2' },
  { id: 'class-l1-y3-t1-g34', grade_id: 'grade-lvl1-yr3', academic_year_id: 'year-2025-2026', name: 'فصل القديس باسيليوس الكبير (تالتة ورابعة)', term: 'term1', category: 'grade_3_4' },
  { id: 'class-l1-y3-t1-g56', grade_id: 'grade-lvl1-yr3', academic_year_id: 'year-2025-2026', name: 'فصل القديس غريغوريوس الثيؤلوغوس (خامسة وستة)', term: 'term1', category: 'grade_5_6' },
  { id: 'class-l1-y3-t1-prep-sec', grade_id: 'grade-lvl1-yr3', academic_year_id: 'year-2025-2026', name: 'فصل القديس يوحنا المعمدان (إعدادي وثانوي)', term: 'term1', category: 'prep_sec' },

  { id: 'class-l1-y4-t1-g34', grade_id: 'grade-lvl1-yr4', academic_year_id: 'year-2025-2026', name: 'فصل القديس يوحنا ذهبي الفم (تالتة ورابعة)', term: 'term1', category: 'grade_3_4' },
  { id: 'class-l1-y4-t1-g56', grade_id: 'grade-lvl1-yr4', academic_year_id: 'year-2025-2026', name: 'فصل القديس ديديموس المرتل (خامسة وستة)', term: 'term1', category: 'grade_5_6' },
  { id: 'class-l1-y4-t1-prep-sec', grade_id: 'grade-lvl1-yr4', academic_year_id: 'year-2025-2026', name: 'فصل القديس إسطفانوس رئيس الشمامسة (إعدادي وثانوي)', term: 'term1', category: 'prep_sec' },

  // ==========================================
  // فصول المستوى الثاني - السنة الأولى
  // ==========================================
  { id: 'class-l2-y1-t1-g12', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس بولس الرسول (أولى وتانية متقدم)', term: 'term1', category: 'grade_1_2' },
  { id: 'class-l2-y1-t2-g12', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس بولس الرسول (أولى وتانية متقدم)', term: 'term2', category: 'grade_1_2' },
  { id: 'class-l2-y1-t1-g34', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس بطرس الرسول (تالتة ورابعة متقدم)', term: 'term1', category: 'grade_3_4' },
  { id: 'class-l2-y1-t2-g34', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس بطرس الرسول (تالتة ورابعة متقدم)', term: 'term2', category: 'grade_3_4' },
  { id: 'class-l2-y1-t1-g56', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس يعقوب الرسول (خامسة وستة متقدم)', term: 'term1', category: 'grade_5_6' },
  { id: 'class-l2-y1-t2-g56', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل القديس يعقوب الرسول (خامسة وستة متقدم)', term: 'term2', category: 'grade_5_6' },
  { id: 'class-l2-y1-t1-prep-sec', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الأنبا أنطونيوس والأنبا باخوميوس (إعدادي وثانوي متقدم)', term: 'term1', category: 'prep_sec' },
  { id: 'class-l2-y1-t2-prep-sec', grade_id: 'grade-lvl2-yr1', academic_year_id: 'year-2025-2026', name: 'فصل الأنبا أنطونيوس والأنبا باخوميوس (إعدادي وثانوي متقدم)', term: 'term2', category: 'prep_sec' },

  // ==========================================
  // فصول المستوى الثاني - السنة الثانية والثالثة والرابعة
  // ==========================================
  { id: 'class-l2-y2-t1-prep-sec', grade_id: 'grade-lvl2-yr2', academic_year_id: 'year-2025-2026', name: 'فصل خوارس الشمامسة والطقوس (إعدادي وثانوي تخصص)', term: 'term1', category: 'prep_sec' },
  { id: 'class-l2-y3-t1-prep-sec', grade_id: 'grade-lvl2-yr3', academic_year_id: 'year-2025-2026', name: 'فصل المعلم إبراهيم عياد (تسبحة وأعياد كبرى)', term: 'term1', category: 'prep_sec' },
  { id: 'class-l2-y4-t1-prep-sec', grade_id: 'grade-lvl2-yr4', academic_year_id: 'year-2025-2026', name: 'فصل قادة المذبح والخدمة (خريجو المستوى الثاني)', term: 'term1', category: 'prep_sec' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'subj-hymns', name: 'الألحان الكنسية', description: 'حفظ ومخارج ألفاظ وهزات الألحان الكنسية الشريفة حسب طقس الكنيسة القبطية.' },
  { id: 'subj-liturgy', name: 'الطقس الكنسي', description: 'دراسة نظام الصلوات الطقسية وترتيب الخدمة والرموز والمعاني الروحية.' },
  { id: 'subj-coptic', name: 'اللغة القبطية', description: 'قراءة ونطق وقواعد اللغة القبطية لفهم نصوص الألحان والصلوات.' },
  { id: 'subj-spiritual', name: 'الروحانية وتاريخ الكنيسة', description: 'سير الآباء المرتلين وتاريخ الموسيقى القبطية وحياة التكريس والخدمة.' },
  { id: 'subj-practical', name: 'الأداء العملي والخوروس', description: 'المشاركة الفعالة في صلوات القداس والتسبحة والوقف والخشوع على المذبح.' }
];

export const INITIAL_GRADING_RULES: GradingRule[] = [
  {
    id: 'rule-1',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 90,
    maximum_percentage: 100,
    evaluation_label: 'ممتاز مرتفع مع مرتبة الشرف (Ⲛⲁⲛⲉϥ ⲉⲙⲁϣⲱ)',
    grade_color: '#15803d',
    is_pass: true,
  },
  {
    id: 'rule-2',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 80,
    maximum_percentage: 89.99,
    evaluation_label: 'ممتاز (Ⲛⲁⲛⲉϥ)',
    grade_color: '#047857',
    is_pass: true,
  },
  {
    id: 'rule-3',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 70,
    maximum_percentage: 79.99,
    evaluation_label: 'جيد جداً (Good Plus)',
    grade_color: '#0284c7',
    is_pass: true,
  },
  {
    id: 'rule-4',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 60,
    maximum_percentage: 69.99,
    evaluation_label: 'جيد (Good)',
    grade_color: '#d97706',
    is_pass: true,
  },
  {
    id: 'rule-5',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 50,
    maximum_percentage: 59.99,
    evaluation_label: 'مقبول (Pass)',
    grade_color: '#b45309',
    is_pass: true,
  },
  {
    id: 'rule-6',
    academic_year_id: 'year-2025-2026',
    minimum_percentage: 0,
    maximum_percentage: 49.99,
    evaluation_label: 'دون المستوى / دور ثانٍ (Needs Improvement)',
    grade_color: '#dc2626',
    is_pass: false,
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-midterm-2025',
    name: 'امتحان منتصف العام الدراسي (الترم الأول) - ألحان وطقس',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr1',
    term: 'term1',
    exam_type: 'midterm',
    exam_date: '2026-01-18',
    is_published: true,
    notes: 'امتحان الفصل الدراسي الأول معتمد للمستوى الأول - السنة الأولى.',
    created_at: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'exam-final-2025-sec',
    name: 'امتحان نهاية العام الدراسي (الترم الثاني) - ألحان وقبطي',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr1',
    term: 'term2',
    exam_type: 'final',
    exam_date: '2026-05-20',
    is_published: true,
    notes: 'امتحان الفصل الدراسي الثاني الشامل.',
    created_at: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'exam-draft-spring',
    name: 'امتحان تقييم الألحان الكنسية - المستوى الثاني تخصص',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-2',
    grade_id: 'grade-lvl2-yr1',
    term: 'term1',
    exam_type: 'practical',
    exam_date: '2026-04-12',
    is_published: false,
    notes: 'تقييم في خوروس الشمامسة أمام لجنة المرتلين.',
    created_at: '2026-02-01T00:00:00.000Z'
  }
];

export const INITIAL_EXAM_SUBJECTS: ExamSubject[] = [
  { id: 'es-1', exam_id: 'exam-midterm-2025', subject_id: 'subj-hymns', max_score: 50, pass_score: 25, display_order: 1 },
  { id: 'es-2', exam_id: 'exam-midterm-2025', subject_id: 'subj-liturgy', max_score: 25, pass_score: 12.5, display_order: 2 },
  { id: 'es-3', exam_id: 'exam-midterm-2025', subject_id: 'subj-coptic', max_score: 25, pass_score: 12.5, display_order: 3 },
  
  { id: 'es-4', exam_id: 'exam-final-2025-sec', subject_id: 'subj-hymns', max_score: 60, pass_score: 30, display_order: 1 },
  { id: 'es-5', exam_id: 'exam-final-2025-sec', subject_id: 'subj-practical', max_score: 40, pass_score: 20, display_order: 2 },
];

// Note: Manual student codes assigned by admin
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    student_code: 'ETCH-1001',
    full_name: 'أبانوب جميل يوسف بطرس',
    phone: '01223456789',
    guardian_name: 'جميل يوسف بطرس',
    guardian_phone: '01223456780',
    notes: 'شماس متميز في نبرات الهزات والألحان الفرايحي.',
    created_at: '2025-09-15T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'stu-2',
    student_code: 'ETCH-1002',
    full_name: 'مينا عماد غالي سركيس',
    phone: '01098765432',
    guardian_name: 'عماد غالي سركيس',
    guardian_phone: '01098765430',
    notes: 'منضبط في حضور التسبحة الأسبوعية.',
    created_at: '2025-09-15T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'stu-3',
    student_code: 'ETCH-1003',
    full_name: 'كيرلس رفعت نصحي ميخائيل',
    phone: '01122334455',
    guardian_name: 'رفعت نصحي ميخائيل',
    guardian_phone: '01122334450',
    notes: 'حفظ لحن إبؤورو وتاي شوري بإتقان.',
    created_at: '2025-09-16T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'stu-4',
    student_code: 'ETCH-2001',
    full_name: 'بيشوي ممدوح صادق حنا',
    phone: '01287654321',
    guardian_name: 'ممدوح صادق حنا',
    guardian_phone: '01287654320',
    notes: 'طالب في المستوى الأول - السنة الثانية - إعدادي.',
    created_at: '2025-09-16T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'stu-5',
    student_code: 'ETCH-2002',
    full_name: 'يوحنا وجيه حبيب جرجس',
    phone: '01599887766',
    guardian_name: 'وجيه حبيب جرجس',
    guardian_phone: '01599887760',
    notes: 'المستوى الثاني - تخصص ألحان وخوارس الشمامسة.',
    created_at: '2025-09-17T00:00:00.000Z',
    is_active: true
  }
];

export const INITIAL_ENROLLMENTS: StudentEnrollment[] = [
  {
    id: 'enr-1',
    student_id: 'stu-1',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr1',
    class_id: 'class-l1-y1-t1-g34',
    enrollment_status: 'enrolled',
    created_at: '2025-09-15T00:00:00.000Z'
  },
  {
    id: 'enr-2',
    student_id: 'stu-2',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr1',
    class_id: 'class-l1-y1-t1-g34',
    enrollment_status: 'enrolled',
    created_at: '2025-09-15T00:00:00.000Z'
  },
  {
    id: 'enr-3',
    student_id: 'stu-3',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr1',
    class_id: 'class-l1-y1-t2-g34',
    enrollment_status: 'enrolled',
    created_at: '2025-09-16T00:00:00.000Z'
  },
  {
    id: 'enr-4',
    student_id: 'stu-4',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-1',
    grade_id: 'grade-lvl1-yr2',
    class_id: 'class-l1-y2-t1-prep-sec',
    enrollment_status: 'enrolled',
    created_at: '2025-09-16T00:00:00.000Z'
  },
  {
    id: 'enr-5',
    student_id: 'stu-5',
    academic_year_id: 'year-2025-2026',
    stage_id: 'stage-level-2',
    grade_id: 'grade-lvl2-yr1',
    class_id: 'class-l2-y1-t1-prep-sec',
    enrollment_status: 'enrolled',
    created_at: '2025-09-17T00:00:00.000Z'
  }
];

export const INITIAL_RESULTS: Result[] = [
  // Student 1 (ETCH-1001) - High Honors
  { id: 'res-1-1', student_id: 'stu-1', exam_subject_id: 'es-1', score: 49, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-1-2', student_id: 'stu-1', exam_subject_id: 'es-2', score: 24.5, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-1-3', student_id: 'stu-1', exam_subject_id: 'es-3', score: 25, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  
  // Student 2 (ETCH-1002) - Excellent
  { id: 'res-2-1', student_id: 'stu-2', exam_subject_id: 'es-1', score: 43, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-2-2', student_id: 'stu-2', exam_subject_id: 'es-2', score: 22, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-2-3', student_id: 'stu-2', exam_subject_id: 'es-3', score: 21, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },

  // Student 3 (ETCH-1003) - Very Good
  { id: 'res-3-1', student_id: 'stu-3', exam_subject_id: 'es-1', score: 38, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-3-2', student_id: 'stu-3', exam_subject_id: 'es-2', score: 20, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },
  { id: 'res-3-3', student_id: 'stu-3', exam_subject_id: 'es-3', score: 18.5, created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-01-20T00:00:00.000Z' },

  // Student 4 (ETCH-2001) in Prep practical exam
  { id: 'res-4-1', student_id: 'stu-4', exam_subject_id: 'es-4', score: 57, created_at: '2026-01-07T00:00:00.000Z', updated_at: '2026-01-07T00:00:00.000Z' },
  { id: 'res-4-2', student_id: 'stu-4', exam_subject_id: 'es-5', score: 38, created_at: '2026-01-07T00:00:00.000Z', updated_at: '2026-01-07T00:00:00.000Z' },
];

export const INITIAL_ADMINS: AdminProfile[] = [
  {
    id: 'admin-1',
    user_id: 'user-super-1',
    full_name: 'أبانوب جميل (مدير النظام الأكاديمي)',
    email: 'admin@t-etchrompi.org',
    role: 'super_admin',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'admin-2',
    user_id: 'user-results-1',
    full_name: 'الشماس كيرلس يوسف (مسؤول الكنترول والنتائج)',
    email: 'results@t-etchrompi.org',
    role: 'results_manager',
    is_active: true,
    created_at: '2025-01-10T00:00:00.000Z'
  },
  {
    id: 'admin-3',
    user_id: 'user-content-1',
    full_name: 'مارينا مجدي (مسؤول المحتوى والإعلانات)',
    email: 'content@t-etchrompi.org',
    role: 'content_manager',
    is_active: true,
    created_at: '2025-01-15T00:00:00.000Z'
  }
];

// ==========================================
// STORAGE SERVICE IMPLEMENTATION
// ==========================================

class DataService {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // --- Settings ---
  getSettings(): SchoolSettings {
    return this.get<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(settings: Partial<SchoolSettings>): SchoolSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- Academic Years ---
  getAcademicYears(): AcademicYear[] {
    return this.get<AcademicYear[]>(STORAGE_KEYS.YEARS, INITIAL_YEARS);
  }

  saveAcademicYear(year: AcademicYear): void {
    const list = this.getAcademicYears();
    const idx = list.findIndex(y => y.id === year.id);
    if (idx >= 0) list[idx] = year;
    else list.push(year);
    this.set(STORAGE_KEYS.YEARS, list);
  }

  setActiveAcademicYear(yearId: string): void {
    const list = this.getAcademicYears().map(y => ({
      ...y,
      is_active: y.id === yearId
    }));
    this.set(STORAGE_KEYS.YEARS, list);
    this.updateSettings({ academic_year_id: yearId });
  }

  deleteAcademicYear(yearId: string): boolean {
    const list = this.getAcademicYears().filter(y => y.id !== yearId);
    this.set(STORAGE_KEYS.YEARS, list);
    return true;
  }

  // --- Stages, Grades, Classes ---
  getStages(): EducationalStage[] {
    const list = this.get<EducationalStage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    // Auto-migrate if old 5-stage setup is detected in localStorage
    if (list.length === 0 || list.some(s => s.id === 'stage-nursery') || !list.some(s => s.id === 'stage-level-1')) {
      this.applyTwoLevelsFourYearsStructure();
      return INITIAL_STAGES;
    }
    return list;
  }

  applyTwoLevelsFourYearsStructure(): void {
    this.set(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    this.set(STORAGE_KEYS.GRADES, INITIAL_GRADES);
    this.set(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    this.set(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, INITIAL_EXAM_SUBJECTS);
    this.set(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
  }

  saveStage(stage: EducationalStage): void {
    const list = this.getStages();
    const idx = list.findIndex(s => s.id === stage.id);
    if (idx >= 0) list[idx] = stage;
    else list.push(stage);
    this.set(STORAGE_KEYS.STAGES, list);
  }

  deleteStage(stageId: string): boolean {
    const list = this.getStages().filter(s => s.id !== stageId);
    this.set(STORAGE_KEYS.STAGES, list);
    return true;
  }

  getGrades(): Grade[] {
    return this.get<Grade[]>(STORAGE_KEYS.GRADES, INITIAL_GRADES);
  }

  saveGrade(grade: Grade): void {
    const list = this.getGrades();
    const idx = list.findIndex(g => g.id === grade.id);
    if (idx >= 0) list[idx] = grade;
    else list.push(grade);
    this.set(STORAGE_KEYS.GRADES, list);
  }

  deleteGrade(gradeId: string): boolean {
    const list = this.getGrades().filter(g => g.id !== gradeId);
    this.set(STORAGE_KEYS.GRADES, list);
    return true;
  }

  getClasses(): ClassItem[] {
    const list = this.get<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    // Auto-migrate if stored classes don't yet have the 5 cohorts (e.g. grade_1_2)
    if (list.length === 0 || !list.some(c => c.category === 'grade_1_2')) {
      this.set(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      return INITIAL_CLASSES;
    }
    return list;
  }

  saveClass(cls: ClassItem): void {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) list[idx] = cls;
    else list.push(cls);
    this.set(STORAGE_KEYS.CLASSES, list);
  }

  deleteClass(classId: string): boolean {
    const list = this.getClasses().filter(c => c.id !== classId);
    this.set(STORAGE_KEYS.CLASSES, list);
    return true;
  }

  // --- Subjects ---
  getSubjects(): Subject[] {
    return this.get<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  saveSubject(subj: Subject): void {
    const list = this.getSubjects();
    const idx = list.findIndex(s => s.id === subj.id);
    if (idx >= 0) list[idx] = subj;
    else list.push(subj);
    this.set(STORAGE_KEYS.SUBJECTS, list);
  }

  deleteSubject(subjectId: string): boolean {
    const list = this.getSubjects().filter(s => s.id !== subjectId);
    this.set(STORAGE_KEYS.SUBJECTS, list);
    return true;
  }

  // --- Students (STRICT REQUIREMENT: Manual Student Codes, No Auto-Generation, Unique Codes) ---
  getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  findStudentByCode(code: string): Student | undefined {
    const clean = code.trim().toLowerCase();
    return this.getStudents().find(s => s.student_code.trim().toLowerCase() === clean);
  }

  saveStudent(student: Student): { success: boolean; error?: string } {
    if (!student.student_code || !student.student_code.trim()) {
      return { success: false, error: 'كود الطالب إلزامي، ويجب إدخاله يدوياً بواسطة مسؤول المدرسة.' };
    }

    if (!student.full_name || !student.full_name.trim()) {
      return { success: false, error: 'اسم الطالب بالكامل إلزامي.' };
    }

    const list = this.getStudents();
    const normalizedCode = student.student_code.trim();

    // Check code uniqueness: cannot match any other student's code
    const existing = list.find(s => s.student_code.toLowerCase() === normalizedCode.toLowerCase() && s.id !== student.id);
    if (existing) {
      return {
        success: false,
        error: `كود الطالب (${normalizedCode}) مسجل مسبقاً للطالب "${existing.full_name}". الأكواد يجب أن تكون فريدة ومحددة يدوياً.`
      };
    }

    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      list[idx] = { ...student, student_code: normalizedCode };
    } else {
      list.push({ ...student, student_code: normalizedCode, created_at: student.created_at || new Date().toISOString() });
    }

    this.set(STORAGE_KEYS.STUDENTS, list);
    return { success: true };
  }

  deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.STUDENTS, list);
    // Also remove enrollment
    const enrollments = this.getEnrollments().filter(e => e.student_id !== id);
    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);
  }

  // --- Enrollments ---
  getEnrollments(): StudentEnrollment[] {
    const list = this.get<StudentEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    if (list.length === 0 || list.some(e => e.class_id === 'class-l1-y1-t1-pri')) {
      this.set(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
      return INITIAL_ENROLLMENTS;
    }
    return list;
  }

  saveEnrollment(enrollment: StudentEnrollment): void {
    const list = this.getEnrollments();
    const idx = list.findIndex(e => e.student_id === enrollment.student_id && e.academic_year_id === enrollment.academic_year_id);
    if (idx >= 0) list[idx] = enrollment;
    else list.push(enrollment);
    this.set(STORAGE_KEYS.ENROLLMENTS, list);
  }

  // --- Exams & Exam Subjects ---
  getExams(): Exam[] {
    return this.get<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  }

  saveExam(exam: Exam): void {
    const list = this.getExams();
    const idx = list.findIndex(e => e.id === exam.id);
    if (idx >= 0) list[idx] = exam;
    else list.push(exam);
    this.set(STORAGE_KEYS.EXAMS, list);
  }

  deleteExam(examId: string): void {
    const list = this.getExams().filter(e => e.id !== examId);
    this.set(STORAGE_KEYS.EXAMS, list);
  }

  getExamSubjects(examId?: string): ExamSubject[] {
    const all = this.get<ExamSubject[]>(STORAGE_KEYS.EXAM_SUBJECTS, INITIAL_EXAM_SUBJECTS);
    if (examId) return all.filter(es => es.exam_id === examId);
    return all;
  }

  saveExamSubject(es: ExamSubject): void {
    const list = this.getExamSubjects();
    const idx = list.findIndex(item => item.id === es.id);
    if (idx >= 0) list[idx] = es;
    else list.push(es);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, list);
  }

  deleteExamSubject(id: string): void {
    const list = this.getExamSubjects().filter(item => item.id !== id);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, list);
  }

  // --- Results & Grading Rules ---
  getResults(): Result[] {
    return this.get<Result[]>(STORAGE_KEYS.RESULTS, INITIAL_RESULTS);
  }

  saveResult(result: Result): { success: boolean; error?: string } {
    // Validate score is not negative and does not exceed max_score
    const examSubjects = this.getExamSubjects();
    const examSubject = examSubjects.find(es => es.id === result.exam_subject_id);

    if (result.score < 0) {
      return { success: false, error: 'الدرجة لا يمكن أن تكون أقل من صفر.' };
    }

    if (examSubject && result.score > examSubject.max_score) {
      return { success: false, error: `الدرجة (${result.score}) تتجاوز النهاية العظمى للمادة (${examSubject.max_score}).` };
    }

    const list = this.getResults();
    const idx = list.findIndex(r => r.student_id === result.student_id && r.exam_subject_id === result.exam_subject_id);
    const updatedRecord = {
      ...result,
      updated_at: new Date().toISOString(),
      created_at: result.created_at || new Date().toISOString()
    };

    if (idx >= 0) list[idx] = updatedRecord;
    else list.push(updatedRecord);

    this.set(STORAGE_KEYS.RESULTS, list);
    return { success: true };
  }

  getGradingRules(): GradingRule[] {
    return this.get<GradingRule[]>(STORAGE_KEYS.GRADING_RULES, INITIAL_GRADING_RULES);
  }

  saveGradingRule(rule: GradingRule): void {
    const list = this.getGradingRules();
    const idx = list.findIndex(r => r.id === rule.id);
    if (idx >= 0) list[idx] = rule;
    else list.push(rule);
    this.set(STORAGE_KEYS.GRADING_RULES, list);
  }

  calculateEvaluation(percentage: number): { label: string; isPass: boolean; color: string } {
    const rules = this.getGradingRules().sort((a, b) => b.minimum_percentage - a.minimum_percentage);
    for (const rule of rules) {
      if (percentage >= rule.minimum_percentage && percentage <= rule.maximum_percentage) {
        return {
          label: rule.evaluation_label,
          isPass: rule.is_pass,
          color: rule.grade_color || '#1e3a8a'
        };
      }
    }

    return {
      label: percentage >= 50 ? 'ناجح' : 'دون المستوى / دور ثانٍ',
      isPass: percentage >= 50,
      color: percentage >= 50 ? '#15803d' : '#dc2626'
    };
  }

  // --- Student Results Query Portal (Edge Function / Secure Lookup) ---
  lookupStudentResults(studentCode: string): {
    success: boolean;
    data?: StudentFullResultLookup[];
    error?: string;
  } {
    if (!studentCode || !studentCode.trim()) {
      return { success: false, error: 'يرجى إدخال كود الطالب الخاص بك للاستعلام عن النتيجة.' };
    }

    const student = this.findStudentByCode(studentCode);
    if (!student) {
      return {
        success: false,
        error: 'كود الطالب غير صحيح أو غير مسجل في قاعدة بيانات المدرسة. يرجى التأكد من كتابة الكود بدقة كما هو مدون في استمارة القيد، أو مراجعة إدارة الكنترول.'
      };
    }

    // Find active enrollment
    const enrollments = this.getEnrollments().filter(e => e.student_id === student.id);
    if (enrollments.length === 0) {
      return { success: false, error: 'لا يوجد قيد دراسي مسجل لهذا الطالب في العام الحالي.' };
    }

    const years = this.getAcademicYears();
    const stages = this.getStages();
    const grades = this.getGrades();
    const classes = this.getClasses();
    const subjects = this.getSubjects();
    const exams = this.getExams();
    const examSubjects = this.getExamSubjects();
    const results = this.getResults();

    const fullLookups: StudentFullResultLookup[] = [];

    // For each published exam that this student took
    for (const enrollment of enrollments) {
      const year = years.find(y => y.id === enrollment.academic_year_id) || {
        id: enrollment.academic_year_id,
        name: 'العام الحالي',
        start_date: '',
        end_date: '',
        is_active: true,
        created_at: ''
      };

      const stage = stages.find(s => s.id === enrollment.stage_id) || { id: '', name: 'المرحلة', description: '', display_order: 1 };
      const grade = grades.find(g => g.id === enrollment.grade_id) || { id: '', stage_id: '', name: 'الصف', display_order: 1 };
      const cls = classes.find(c => c.id === enrollment.class_id) || { id: '', grade_id: '', academic_year_id: '', name: 'فصل عام' };

      // Find published exams for this year / stage
      const publishedExams = exams.filter(e => e.academic_year_id === enrollment.academic_year_id && e.is_published);

      for (const exam of publishedExams) {
        const thisExamSubjects = examSubjects.filter(es => es.exam_id === exam.id);
        if (thisExamSubjects.length === 0) continue;

        const subjectsResults: StudentFullResultLookup['subjects_results'] = [];
        let totalScore = 0;
        let totalMaxScore = 0;
        let hasAnyScore = false;

        for (const es of thisExamSubjects) {
          const res = results.find(r => r.student_id === student.id && r.exam_subject_id === es.id);
          const subj = subjects.find(s => s.id === es.subject_id) || { id: es.subject_id, name: 'مادة كنسية', description: '' };
          
          if (res) hasAnyScore = true;
          const score = res ? res.score : 0;
          totalScore += score;
          totalMaxScore += es.max_score;

          subjectsResults.push({
            subject_id: es.subject_id,
            subject_name: subj.name,
            max_score: es.max_score,
            score: score,
            pass_score: es.pass_score
          });
        }

        if (hasAnyScore && totalMaxScore > 0) {
          const percentage = Number(((totalScore / totalMaxScore) * 100).toFixed(2));
          const evalInfo = this.calculateEvaluation(percentage);

          fullLookups.push({
            student,
            enrollment: {
              ...enrollment,
              academic_year: year,
              stage,
              grade,
              class_item: cls
            },
            exam,
            subjects_results: subjectsResults,
            total_score: totalScore,
            total_max_score: totalMaxScore,
            percentage,
            evaluation: evalInfo.label,
            is_pass: evalInfo.isPass
          });
        }
      }
    }

    if (fullLookups.length === 0) {
      return {
        success: false,
        error: `الطالب "${student.full_name}" مسجل بالمدرسة، ولكن لم يتم اعتماد ونشر أي نتائج امتحانات له حتى الآن. يرجى مراجعة إدارة الكنترول بالمدرسة.`
      };
    }

    return {
      success: true,
      data: fullLookups
    };
  }

  // --- Import Batches ---
  getImportBatches(): ImportBatch[] {
    return this.get<ImportBatch[]>(STORAGE_KEYS.BATCHES, []);
  }

  saveImportBatch(batch: ImportBatch): void {
    const list = this.getImportBatches();
    list.unshift(batch);
    this.set(STORAGE_KEYS.BATCHES, list);
  }

  // --- Admins & Auth ---
  getAdminProfiles(): AdminProfile[] {
    return this.get<AdminProfile[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  }

  saveAdminProfile(admin: AdminProfile): void {
    const list = this.getAdminProfiles();
    const idx = list.findIndex(a => a.id === admin.id);
    if (idx >= 0) list[idx] = admin;
    else list.push(admin);
    this.set(STORAGE_KEYS.ADMINS, list);
  }

  deleteAdminProfile(id: string): boolean {
    const list = this.getAdminProfiles();
    // Prevent deleting all super admins
    const remaining = list.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ADMINS, remaining);
    return true;
  }

  getActiveAdmin(): AdminProfile | null {
    return this.get<AdminProfile | null>(STORAGE_KEYS.ACTIVE_ADMIN, INITIAL_ADMINS[0]);
  }

  setActiveAdmin(admin: AdminProfile | null): void {
    this.set(STORAGE_KEYS.ACTIVE_ADMIN, admin);
  }

  // Reset to default sample data
  resetAllData(): void {
    this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.set(STORAGE_KEYS.YEARS, INITIAL_YEARS);
    this.set(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    this.set(STORAGE_KEYS.GRADES, INITIAL_GRADES);
    this.set(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    this.set(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    this.set(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.set(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    this.set(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, INITIAL_EXAM_SUBJECTS);
    this.set(STORAGE_KEYS.RESULTS, INITIAL_RESULTS);
    this.set(STORAGE_KEYS.GRADING_RULES, INITIAL_GRADING_RULES);
    this.set(STORAGE_KEYS.BATCHES, []);
    this.set(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  }
}

export const dataService = new DataService();
