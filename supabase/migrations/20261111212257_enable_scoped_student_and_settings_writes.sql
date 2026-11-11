CREATE OR REPLACE FUNCTION private.has_any_admin_permission(p_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = (SELECT auth.uid()) AND ap.is_active IS TRUE
      AND (ap.role = 'super_admin' OR EXISTS (
        SELECT 1 FROM public.admin_permissions perm
        WHERE perm.admin_profile_id = ap.id AND perm.permission_key = p_permission
      ))
  );
$$;
REVOKE ALL ON FUNCTION private.has_any_admin_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_any_admin_permission(text) TO authenticated;

DROP POLICY IF EXISTS "Admins manage students" ON public.students;
CREATE POLICY "Scoped admins insert students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (private.has_any_admin_permission('manage_students'));
CREATE POLICY "Scoped admins update students" ON public.students
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_id = students.id
      AND private.has_admin_permission('manage_students', se.academic_year_id, se.stage_id, se.grade_id, se.class_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_id = students.id
      AND private.has_admin_permission('manage_students', se.academic_year_id, se.stage_id, se.grade_id, se.class_id)
  ));
CREATE POLICY "Scoped admins deactivate students" ON public.students
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_id = students.id
      AND private.has_admin_permission('manage_students', se.academic_year_id, se.stage_id, se.grade_id, se.class_id)
  ));

DROP POLICY IF EXISTS "Admins manage school settings" ON public.school_settings;
CREATE POLICY "Admins manage school settings" ON public.school_settings FOR ALL TO authenticated
  USING (private.has_admin_permission('manage_content'))
  WITH CHECK (private.has_admin_permission('manage_content'));
