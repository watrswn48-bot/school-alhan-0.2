CREATE OR REPLACE FUNCTION private.has_admin_permission(
  p_permission text,p_academic_year_id uuid DEFAULT NULL,p_stage_id uuid DEFAULT NULL,
  p_grade_id uuid DEFAULT NULL,p_class_id uuid DEFAULT NULL,p_term_id uuid DEFAULT NULL,p_subject_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=pg_catalog,public,auth AS $$
SELECT EXISTS(
 SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id=(SELECT auth.uid()) AND ap.is_active IS TRUE
 AND (ap.role='super_admin' OR EXISTS(
  SELECT 1 FROM public.admin_permissions perm WHERE perm.admin_profile_id=ap.id
  AND perm.permission_key=p_permission
  AND (perm.academic_year_id IS NULL OR perm.academic_year_id=p_academic_year_id)
  AND (perm.stage_id IS NULL OR perm.stage_id=p_stage_id)
  AND (perm.grade_id IS NULL OR perm.grade_id=p_grade_id)
  AND (perm.class_id IS NULL OR perm.class_id=p_class_id)
  AND (perm.term_id IS NULL OR perm.term_id=p_term_id)
  AND (perm.subject_id IS NULL OR perm.subject_id=p_subject_id)
  ))
);
$$;

DROP POLICY IF EXISTS "Assigned admins read classes" ON public.classes;
CREATE POLICY "Assigned admins read classes" ON public.classes FOR SELECT TO authenticated
USING (private.has_admin_permission('read_academics',academic_year_id,NULL,grade_id,id,term_id)
 OR private.has_admin_permission('manage_students',academic_year_id,NULL,grade_id,id,term_id)
 OR private.has_admin_permission('manage_results',academic_year_id,NULL,grade_id,id,term_id));
DROP POLICY IF EXISTS "Assigned admins read terms" ON public.academic_terms;
CREATE POLICY "Assigned admins read terms" ON public.academic_terms FOR SELECT TO authenticated
USING (private.has_admin_permission('read_academics',academic_year_id,NULL,grade_id,NULL,id)
 OR private.has_admin_permission('manage_results',academic_year_id,NULL,grade_id,NULL,id));
DROP POLICY IF EXISTS "Assigned admins read students" ON public.students;
CREATE POLICY "Assigned admins read students" ON public.students FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.student_enrollments se WHERE se.student_id=students.id
 AND (private.has_admin_permission('manage_students',se.academic_year_id,se.stage_id,se.grade_id,se.class_id)
 OR private.has_admin_permission('manage_results',se.academic_year_id,se.stage_id,se.grade_id,se.class_id)
 OR private.has_admin_permission('read_academics',se.academic_year_id,se.stage_id,se.grade_id,se.class_id))));
DROP POLICY IF EXISTS "Assigned admins read enrollments" ON public.student_enrollments;
CREATE POLICY "Assigned admins read enrollments" ON public.student_enrollments FOR SELECT TO authenticated
USING (private.has_admin_permission('manage_students',academic_year_id,stage_id,grade_id,class_id)
 OR private.has_admin_permission('manage_results',academic_year_id,stage_id,grade_id,class_id)
 OR private.has_admin_permission('read_academics',academic_year_id,stage_id,grade_id,class_id));
DROP POLICY IF EXISTS "Assigned admins read subjects" ON public.subjects;
CREATE POLICY "Assigned admins read subjects" ON public.subjects FOR SELECT TO authenticated
USING (private.has_admin_permission('read_academics') OR private.has_admin_permission('manage_results')
 OR private.has_admin_permission('manage_academics'));
DROP POLICY IF EXISTS "Assigned admins read exams" ON public.exams;
CREATE POLICY "Assigned admins read exams" ON public.exams FOR SELECT TO authenticated
USING (private.has_admin_permission('read_academics',academic_year_id,stage_id,grade_id,class_id,term_id)
 OR private.has_admin_permission('manage_results',academic_year_id,stage_id,grade_id,class_id,term_id)
 OR private.has_admin_permission('manage_academics',academic_year_id,stage_id,grade_id,class_id,term_id));
DROP POLICY IF EXISTS "Assigned admins read exam subjects" ON public.exam_subjects;
CREATE POLICY "Assigned admins read exam subjects" ON public.exam_subjects FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.exams e WHERE e.id=exam_id AND (
 private.has_admin_permission('read_academics',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id)
 OR private.has_admin_permission('manage_results',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id)
 OR private.has_admin_permission('manage_academics',e.academic_year_id,e.stage_id,e.grade_id,COALESCE(class_id,e.class_id),e.term_id,subject_id))));
DROP POLICY IF EXISTS "Assigned admins read grading rules" ON public.grading_rules;
CREATE POLICY "Assigned admins read grading rules" ON public.grading_rules FOR SELECT TO authenticated
USING (private.has_admin_permission('read_academics',academic_year_id)
 OR private.has_admin_permission('manage_results',academic_year_id)
 OR private.has_admin_permission('manage_academics',academic_year_id));

CREATE OR REPLACE FUNCTION private.prevent_non_super_admin_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,auth AS $$
BEGIN
 IF NEW.is_published IS TRUE AND (TG_OP='INSERT' OR OLD.is_published IS DISTINCT FROM TRUE)
 AND NOT private.has_admin_permission('publish_results') THEN
   RAISE EXCEPTION 'Only the primary administrator may publish results' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.prevent_non_super_admin_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS enforce_primary_admin_result_publication ON public.exams;
CREATE TRIGGER enforce_primary_admin_result_publication
BEFORE INSERT OR UPDATE OF is_published ON public.exams
FOR EACH ROW EXECUTE FUNCTION private.prevent_non_super_admin_publish();
