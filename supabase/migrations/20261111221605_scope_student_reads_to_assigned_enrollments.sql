DROP POLICY IF EXISTS "Assigned admins read students" ON public.students;

CREATE POLICY "Assigned admins read students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = (SELECT auth.uid())
      AND ap.is_active IS TRUE
      AND ap.role = 'super_admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.student_enrollments se
    WHERE se.student_id = students.id
      AND (
        private.has_admin_permission(
          'manage_students',
          se.academic_year_id,
          se.stage_id,
          se.grade_id,
          se.class_id
        )
        OR private.has_admin_permission(
          'manage_results',
          se.academic_year_id,
          se.stage_id,
          se.grade_id,
          se.class_id
        )
        OR private.has_admin_permission(
          'read_academics',
          se.academic_year_id,
          se.stage_id,
          se.grade_id,
          se.class_id
        )
      )
  )
);
