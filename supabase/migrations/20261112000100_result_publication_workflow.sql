-- Keep result entry separate from publication. Editors can only save draft scores;
-- the super administrator alone can publish them to the student lookup function.

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_results_exam_subject_published
  ON public.results (exam_subject_id, is_published);

DROP POLICY IF EXISTS "Admins manage results" ON public.results;
DROP POLICY IF EXISTS "Assigned admins read results" ON public.results;
DROP POLICY IF EXISTS "Results managers insert drafts" ON public.results;
DROP POLICY IF EXISTS "Results managers update drafts" ON public.results;
DROP POLICY IF EXISTS "Results managers delete results" ON public.results;
DROP POLICY IF EXISTS "Super admins publish results" ON public.results;

CREATE POLICY "Assigned admins read results"
ON public.results FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND (
        private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
        OR private.has_admin_permission('publish_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
      )
  )
);

CREATE POLICY "Results managers insert drafts"
ON public.results FOR INSERT TO authenticated
WITH CHECK (
  is_published IS FALSE
  AND EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
);

CREATE POLICY "Results managers update drafts"
ON public.results FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
)
WITH CHECK (
  is_published IS FALSE
  AND EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
);

CREATE POLICY "Super admins publish results"
ON public.results FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('publish_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('publish_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
);

CREATE POLICY "Results managers delete results"
ON public.results FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
  )
);

-- Keep one UPDATE policy while allowing managers to save drafts and super admins to publish.
DROP POLICY IF EXISTS "Results managers update drafts" ON public.results;
DROP POLICY IF EXISTS "Super admins publish results" ON public.results;

CREATE POLICY "Scoped admins update result publication"
ON public.results FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND (
        private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
        OR private.has_admin_permission('publish_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.student_enrollments se
      ON se.student_id = results.student_id
     AND se.academic_year_id = e.academic_year_id
    WHERE es.id = results.exam_subject_id
      AND (es.class_id IS NULL OR es.class_id = se.class_id)
      AND (e.class_id IS NULL OR e.class_id = se.class_id)
      AND (
        (is_published IS FALSE AND private.has_admin_permission('manage_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id))
        OR private.has_admin_permission('publish_results', e.academic_year_id, e.stage_id, e.grade_id, se.class_id, e.term_id, es.subject_id)
      )
  )
);
