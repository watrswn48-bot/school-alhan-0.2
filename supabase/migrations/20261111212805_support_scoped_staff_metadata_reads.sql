CREATE OR REPLACE FUNCTION private.has_admin_permission(
  p_permission text,
  p_academic_year_id uuid DEFAULT NULL,
  p_stage_id uuid DEFAULT NULL,
  p_grade_id uuid DEFAULT NULL,
  p_class_id uuid DEFAULT NULL,
  p_term_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = (SELECT auth.uid())
      AND ap.is_active IS TRUE
      AND (
        ap.role = 'super_admin'
        OR EXISTS (
          SELECT 1 FROM public.admin_permissions perm
          WHERE perm.admin_profile_id = ap.id
            AND perm.permission_key = p_permission
            AND (p_academic_year_id IS NULL OR perm.academic_year_id IS NULL OR perm.academic_year_id = p_academic_year_id)
            AND (p_stage_id IS NULL OR perm.stage_id IS NULL OR perm.stage_id = p_stage_id)
            AND (p_grade_id IS NULL OR perm.grade_id IS NULL OR perm.grade_id = p_grade_id)
            AND (p_class_id IS NULL OR perm.class_id IS NULL OR perm.class_id = p_class_id)
            AND (p_term_id IS NULL OR perm.term_id IS NULL OR perm.term_id = p_term_id)
            AND (p_subject_id IS NULL OR perm.subject_id IS NULL OR perm.subject_id = p_subject_id)
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Assigned admins read subjects" ON public.subjects;
CREATE POLICY "Assigned admins read subjects" ON public.subjects FOR SELECT TO authenticated
USING (
  private.has_any_admin_permission('read_academics')
  OR private.has_any_admin_permission('manage_results')
  OR private.has_any_admin_permission('manage_academics')
);

DROP POLICY IF EXISTS "Assigned admins read terms" ON public.academic_terms;
CREATE POLICY "Assigned admins read terms" ON public.academic_terms FOR SELECT TO authenticated
USING (
  private.has_any_admin_permission('read_academics')
  OR private.has_any_admin_permission('manage_results')
  OR private.has_any_admin_permission('manage_students')
  OR private.has_any_admin_permission('manage_academics')
);

DROP POLICY IF EXISTS "Assigned admins read grading rules" ON public.grading_rules;
CREATE POLICY "Assigned admins read grading rules" ON public.grading_rules FOR SELECT TO authenticated
USING (
  private.has_any_admin_permission('read_academics')
  OR private.has_any_admin_permission('manage_results')
  OR private.has_any_admin_permission('manage_academics')
);
