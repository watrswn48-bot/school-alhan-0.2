ALTER TABLE public.academic_years ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.academic_years ALTER COLUMN end_date DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.academic_terms (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
  term_number smallint NOT NULL CHECK (term_number IN (1,2)),
  name varchar(100) NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, grade_id, term_number)
);

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS category varchar(50);
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT;
ALTER TABLE public.exam_subjects
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT;
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS email varchar(255),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS whatsapp_number varchar(50),
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS announcement_banner text,
  ADD COLUMN IF NOT EXISTS show_banner boolean DEFAULT true;

ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('super_admin','admin','results_manager','content_manager','teacher'));

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  admin_profile_id uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  permission_key varchar(50) NOT NULL CHECK (permission_key IN ('read_academics','manage_academics','manage_students','manage_results','manage_content')),
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.educational_stages(id) ON DELETE CASCADE,
  grade_id uuid REFERENCES public.grades(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.academic_terms(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_profile ON public.admin_permissions(admin_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_scope ON public.admin_permissions(academic_year_id,grade_id,class_id,term_id,subject_id);
CREATE INDEX IF NOT EXISTS idx_academic_terms_year_grade ON public.academic_terms(academic_year_id,grade_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_class ON public.exam_subjects(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_academic_year ON public.academic_years(is_active) WHERE is_active IS TRUE;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_admin_permission(
  p_permission text, p_academic_year_id uuid DEFAULT NULL, p_stage_id uuid DEFAULT NULL,
  p_grade_id uuid DEFAULT NULL, p_class_id uuid DEFAULT NULL, p_term_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id=(SELECT auth.uid()) AND ap.is_active IS TRUE
      AND (ap.role='super_admin' OR EXISTS (
        SELECT 1 FROM public.admin_permissions perm
        WHERE perm.admin_profile_id=ap.id AND perm.permission_key=p_permission
          AND (perm.academic_year_id IS NULL OR perm.academic_year_id=p_academic_year_id)
          AND (perm.stage_id IS NULL OR perm.stage_id=p_stage_id)
          AND (perm.grade_id IS NULL OR perm.grade_id=p_grade_id)
          AND (perm.class_id IS NULL OR perm.class_id=p_class_id)
          AND (perm.term_id IS NULL OR perm.term_id=p_term_id)
          AND (perm.subject_id IS NULL OR perm.subject_id=p_subject_id)
      ))
  );
$$;
REVOKE ALL ON FUNCTION private.has_admin_permission(text,uuid,uuid,uuid,uuid,uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_admin_permission(text,uuid,uuid,uuid,uuid,uuid,uuid) TO authenticated;

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON public.academic_years,public.educational_stages,public.grades,public.school_settings,
  public.announcements,public.events,public.gallery TO anon,authenticated;
GRANT SELECT ON public.admin_profiles,public.admin_permissions TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.academic_years,public.educational_stages,public.grades,
  public.classes,public.academic_terms,public.students,public.student_enrollments,public.subjects,
  public.exams,public.exam_subjects,public.results,public.grading_rules,public.import_batches,
  public.school_settings,public.announcements,public.events,public.gallery TO authenticated;

CREATE POLICY "Admin can read own profile" ON public.admin_profiles
  FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Admin can read own permissions" ON public.admin_permissions
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.admin_profiles ap WHERE ap.id=admin_profile_id
      AND ap.user_id=(SELECT auth.uid()) AND ap.is_active IS TRUE
  ));

CREATE POLICY "Admins manage academic years" ON public.academic_years FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics'))
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins manage stages" ON public.educational_stages FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics'))
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins manage grades" ON public.grades FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics',NULL,stage_id))
  WITH CHECK (private.has_admin_permission('manage_academics',NULL,stage_id));
CREATE POLICY "Admins manage terms" ON public.academic_terms FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics',academic_year_id,NULL,grade_id,NULL,id))
  WITH CHECK (private.has_admin_permission('manage_academics',academic_year_id,NULL,grade_id,NULL,id));
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics',academic_year_id,NULL,grade_id,id,term_id))
  WITH CHECK (private.has_admin_permission('manage_academics',academic_year_id,NULL,grade_id,id,term_id));

CREATE POLICY "Admins manage students" ON public.students FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_students') OR EXISTS (
    SELECT 1 FROM public.student_enrollments se WHERE se.student_id=id
      AND private.has_admin_permission('manage_results',se.academic_year_id,se.stage_id,se.grade_id,se.class_id)
  ))
  WITH CHECK (private.has_admin_permission('manage_students'));
CREATE POLICY "Admins manage enrollments" ON public.student_enrollments FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_students',academic_year_id,stage_id,grade_id,class_id))
  WITH CHECK (private.has_admin_permission('manage_students',academic_year_id,stage_id,grade_id,class_id));

CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics') OR private.has_admin_permission('manage_results'))
  WITH CHECK (private.has_admin_permission('manage_academics'));
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics',academic_year_id,stage_id,grade_id,class_id,term_id)
    OR private.has_admin_permission('manage_results',academic_year_id,stage_id,grade_id,class_id,term_id))
  WITH CHECK (private.has_admin_permission('manage_academics',academic_year_id,stage_id,grade_id,class_id,term_id));
CREATE POLICY "Admins manage exam subjects" ON public.exam_subjects FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id=exam_id
    AND private.has_admin_permission('manage_academics',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id))
    OR EXISTS (SELECT 1 FROM public.exams e WHERE e.id=exam_id
    AND private.has_admin_permission('manage_results',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams e WHERE e.id=exam_id
    AND private.has_admin_permission('manage_academics',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id)));

CREATE POLICY "Admins manage results" ON public.results FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exam_subjects es JOIN public.exams e ON e.id=es.exam_id
    JOIN public.student_enrollments se ON se.student_id=results.student_id AND se.academic_year_id=e.academic_year_id
    WHERE es.id=results.exam_subject_id AND (es.class_id IS NULL OR es.class_id=se.class_id)
      AND private.has_admin_permission('manage_results',e.academic_year_id,e.stage_id,e.grade_id,se.class_id,e.term_id,es.subject_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_subjects es JOIN public.exams e ON e.id=es.exam_id
    JOIN public.student_enrollments se ON se.student_id=results.student_id AND se.academic_year_id=e.academic_year_id
    WHERE es.id=results.exam_subject_id AND (es.class_id IS NULL OR es.class_id=se.class_id)
      AND private.has_admin_permission('manage_results',e.academic_year_id,e.stage_id,e.grade_id,se.class_id,e.term_id,es.subject_id)
      AND results.score<=es.max_score
  ));
CREATE POLICY "Admins manage grading rules" ON public.grading_rules FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_academics',academic_year_id))
  WITH CHECK (private.has_admin_permission('manage_academics',academic_year_id));
CREATE POLICY "Admins manage imports" ON public.import_batches FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_students') OR private.has_admin_permission('manage_results'))
  WITH CHECK (private.has_admin_permission('manage_students') OR private.has_admin_permission('manage_results'));

CREATE POLICY "Admins manage school settings" ON public.school_settings FOR UPDATE TO authenticated
  USING (private.has_admin_permission('manage_content'))
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_content'))
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_content'))
  WITH CHECK (private.has_admin_permission('manage_content'));
CREATE POLICY "Admins manage gallery" ON public.gallery FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_content'))
  WITH CHECK (private.has_admin_permission('manage_content'));

INSERT INTO public.academic_years(name,start_date,end_date,is_active)
SELECT '2026 - 2027',NULL,NULL,TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE is_active IS TRUE);
INSERT INTO public.educational_stages(name,description,display_order)
SELECT 'المستوى الأول','المستوى الدراسي الأول',1
WHERE NOT EXISTS (SELECT 1 FROM public.educational_stages WHERE display_order=1);
INSERT INTO public.educational_stages(name,description,display_order)
SELECT 'المستوى الثاني','المستوى الدراسي الثاني',2
WHERE NOT EXISTS (SELECT 1 FROM public.educational_stages WHERE display_order=2);
INSERT INTO public.grades(stage_id,name,display_order)
SELECT st.id,'السنة '||yr.n,(st.display_order-1)*4+yr.n
FROM public.educational_stages st CROSS JOIN generate_series(1,4) yr(n)
WHERE NOT EXISTS (SELECT 1 FROM public.grades g WHERE g.stage_id=st.id AND g.display_order=(st.display_order-1)*4+yr.n);
INSERT INTO public.academic_terms(academic_year_id,grade_id,term_number,name)
SELECT ay.id,g.id,t.n,CASE WHEN t.n=1 THEN 'الترم الأول' ELSE 'الترم الثاني' END
FROM public.academic_years ay JOIN public.grades g ON TRUE CROSS JOIN generate_series(1,2) t(n)
WHERE ay.is_active IS TRUE ON CONFLICT(academic_year_id,grade_id,term_number) DO NOTHING;
