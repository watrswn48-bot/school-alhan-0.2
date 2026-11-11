-- Consolidate SELECT policies with write policies to avoid duplicate permissive RLS checks.
-- Authorization semantics remain the same; write policies remain scoped.

DROP POLICY IF EXISTS "Admins manage academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Public can read active academic year" ON public.academic_years;
CREATE POLICY "Read active year or admin-managed years" ON public.academic_years
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE OR private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins insert academic years" ON public.academic_years
  FOR INSERT TO authenticated WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins update academic years" ON public.academic_years
  FOR UPDATE TO authenticated USING (private.has_admin_permission('manage_academics'))
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins delete academic years" ON public.academic_years
  FOR DELETE TO authenticated USING (private.has_admin_permission('manage_academics'));

DROP POLICY IF EXISTS "Admins manage stages" ON public.educational_stages;
CREATE POLICY "Admins insert stages" ON public.educational_stages FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins update stages" ON public.educational_stages FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics')) WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins delete stages" ON public.educational_stages FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics'));

DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
CREATE POLICY "Admins insert grades" ON public.grades FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics', NULL, stage_id));
CREATE POLICY "Admins update grades" ON public.grades FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics', NULL, stage_id))
  WITH CHECK (private.has_admin_permission('manage_academics', NULL, stage_id));
CREATE POLICY "Admins delete grades" ON public.grades FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics', NULL, stage_id));

DROP POLICY IF EXISTS "Admins manage terms" ON public.academic_terms;
DROP POLICY IF EXISTS "Assigned admins read terms" ON public.academic_terms;
CREATE POLICY "Assigned admins read terms" ON public.academic_terms FOR SELECT TO authenticated
  USING (private.has_any_admin_permission('read_academics')
    OR private.has_any_admin_permission('manage_results')
    OR private.has_any_admin_permission('manage_students')
    OR private.has_any_admin_permission('manage_academics'));
CREATE POLICY "Admins insert terms" ON public.academic_terms FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, NULL, id));
CREATE POLICY "Admins update terms" ON public.academic_terms FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, NULL, id))
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, NULL, id));
CREATE POLICY "Admins delete terms" ON public.academic_terms FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, NULL, id));

DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
DROP POLICY IF EXISTS "Assigned admins read classes" ON public.classes;
CREATE POLICY "Assigned admins read classes" ON public.classes FOR SELECT TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, id, term_id)
    OR private.has_admin_permission('read_academics', academic_year_id, NULL, grade_id, id, term_id)
    OR private.has_admin_permission('manage_students', academic_year_id, NULL, grade_id, id, term_id)
    OR private.has_admin_permission('manage_results', academic_year_id, NULL, grade_id, id, term_id));
CREATE POLICY "Admins insert classes" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, id, term_id));
CREATE POLICY "Admins update classes" ON public.classes FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, id, term_id))
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, id, term_id));
CREATE POLICY "Admins delete classes" ON public.classes FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, NULL, grade_id, id, term_id));

DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Assigned admins read subjects" ON public.subjects;
CREATE POLICY "Assigned admins read subjects" ON public.subjects FOR SELECT TO authenticated
  USING (private.has_any_admin_permission('read_academics')
    OR private.has_any_admin_permission('manage_results')
    OR private.has_any_admin_permission('manage_academics'));
CREATE POLICY "Admins insert subjects" ON public.subjects FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins update subjects" ON public.subjects FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics')) WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins delete subjects" ON public.subjects FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics'));

DROP POLICY IF EXISTS "Admins manage exams" ON public.exams;
DROP POLICY IF EXISTS "Assigned admins read exams" ON public.exams;
CREATE POLICY "Assigned admins read exams" ON public.exams FOR SELECT TO authenticated
  USING (private.has_admin_permission('read_academics', academic_year_id, stage_id, grade_id, class_id, term_id)
    OR private.has_admin_permission('manage_results', academic_year_id, stage_id, grade_id, class_id, term_id)
    OR private.has_admin_permission('manage_academics', academic_year_id, stage_id, grade_id, class_id, term_id));
CREATE POLICY "Admins insert exams" ON public.exams FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, stage_id, grade_id, class_id, term_id));
CREATE POLICY "Admins update exams" ON public.exams FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, stage_id, grade_id, class_id, term_id))
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id, stage_id, grade_id, class_id, term_id));
CREATE POLICY "Admins delete exams" ON public.exams FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id, stage_id, grade_id, class_id, term_id));

DROP POLICY IF EXISTS "Admins manage exam subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "Assigned admins read exam subjects" ON public.exam_subjects;
CREATE POLICY "Assigned admins read exam subjects" ON public.exam_subjects FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND (
    private.has_admin_permission('read_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)
    OR private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)
    OR private.has_admin_permission('manage_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)
  )));
CREATE POLICY "Admins insert exam subjects" ON public.exam_subjects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id
    AND private.has_admin_permission('manage_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)));
CREATE POLICY "Admins update exam subjects" ON public.exam_subjects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id
    AND private.has_admin_permission('manage_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id
    AND private.has_admin_permission('manage_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)));
CREATE POLICY "Admins delete exam subjects" ON public.exam_subjects FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id
    AND private.has_admin_permission('manage_academics', e.academic_year_id, e.stage_id, e.grade_id, COALESCE(class_id,e.class_id), e.term_id, subject_id)));

DROP POLICY IF EXISTS "Admins manage grading rules" ON public.grading_rules;
DROP POLICY IF EXISTS "Assigned admins read grading rules" ON public.grading_rules;
CREATE POLICY "Assigned admins read grading rules" ON public.grading_rules FOR SELECT TO authenticated
  USING (private.has_any_admin_permission('read_academics')
    OR private.has_any_admin_permission('manage_results')
    OR private.has_any_admin_permission('manage_academics'));
CREATE POLICY "Admins insert grading rules" ON public.grading_rules FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id));
CREATE POLICY "Admins update grading rules" ON public.grading_rules FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id))
  WITH CHECK (private.has_admin_permission('manage_academics', academic_year_id));
CREATE POLICY "Admins delete grading rules" ON public.grading_rules FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_academics', academic_year_id));

DROP POLICY IF EXISTS "Admins manage school settings" ON public.school_settings;
CREATE POLICY "Admins insert school settings" ON public.school_settings FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins update school settings" ON public.school_settings FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_content')) WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins delete school settings" ON public.school_settings FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_content'));

DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public can read published announcements" ON public.announcements;
CREATE POLICY "Public and admins read announcements" ON public.announcements FOR SELECT TO anon, authenticated
  USING (is_published IS TRUE OR private.has_admin_permission('manage_content'));
CREATE POLICY "Admins insert announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins update announcements" ON public.announcements FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_content')) WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins delete announcements" ON public.announcements FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_content'));

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
DROP POLICY IF EXISTS "Public can read published events" ON public.events;
CREATE POLICY "Public and admins read events" ON public.events FOR SELECT TO anon, authenticated
  USING (is_published IS TRUE OR private.has_admin_permission('manage_content'));
CREATE POLICY "Admins insert events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins update events" ON public.events FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_content')) WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins delete events" ON public.events FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_content'));

DROP POLICY IF EXISTS "Admins manage gallery" ON public.gallery;
CREATE POLICY "Admins insert gallery" ON public.gallery FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins update gallery" ON public.gallery FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_content')) WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins delete gallery" ON public.gallery FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_content'));

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Assigned admins read enrollments" ON public.student_enrollments;
CREATE POLICY "Assigned admins read enrollments" ON public.student_enrollments FOR SELECT TO authenticated
  USING (private.has_admin_permission('manage_students', academic_year_id, stage_id, grade_id, class_id)
    OR private.has_admin_permission('manage_results', academic_year_id, stage_id, grade_id, class_id)
    OR private.has_admin_permission('read_academics', academic_year_id, stage_id, grade_id, class_id));
CREATE POLICY "Admins insert enrollments" ON public.student_enrollments FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_permission('manage_students', academic_year_id, stage_id, grade_id, class_id));
CREATE POLICY "Admins update enrollments" ON public.student_enrollments FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_students', academic_year_id, stage_id, grade_id, class_id))
  WITH CHECK (private.has_admin_permission('manage_students', academic_year_id, stage_id, grade_id, class_id));
CREATE POLICY "Admins delete enrollments" ON public.student_enrollments FOR DELETE TO authenticated
  USING (private.has_admin_permission('manage_students', academic_year_id, stage_id, grade_id, class_id));
