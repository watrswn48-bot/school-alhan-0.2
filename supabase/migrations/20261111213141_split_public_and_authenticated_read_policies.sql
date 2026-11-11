DROP POLICY IF EXISTS "Read active year or admin-managed years" ON public.academic_years;
CREATE POLICY "Public read active academic year" ON public.academic_years
  FOR SELECT TO anon USING (is_active IS TRUE);
CREATE POLICY "Authenticated read active or admin years" ON public.academic_years
  FOR SELECT TO authenticated
  USING (is_active IS TRUE OR private.has_admin_permission('manage_academics'));

DROP POLICY IF EXISTS "Public and admins read announcements" ON public.announcements;
CREATE POLICY "Public read published announcements" ON public.announcements
  FOR SELECT TO anon USING (is_published IS TRUE);
CREATE POLICY "Authenticated read announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (is_published IS TRUE OR private.has_admin_permission('manage_content'));

DROP POLICY IF EXISTS "Public and admins read events" ON public.events;
CREATE POLICY "Public read published events" ON public.events
  FOR SELECT TO anon USING (is_published IS TRUE);
CREATE POLICY "Authenticated read events" ON public.events
  FOR SELECT TO authenticated
  USING (is_published IS TRUE OR private.has_admin_permission('manage_content'));
