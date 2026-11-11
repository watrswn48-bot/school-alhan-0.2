DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename); END LOOP;
  FOR p IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p.tablename); END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.academic_years, public.educational_stages, public.grades,
  public.school_settings, public.announcements, public.events, public.gallery TO anon, authenticated;

CREATE POLICY "Public can read active academic year" ON public.academic_years
  FOR SELECT TO anon, authenticated USING (is_active IS TRUE);
CREATE POLICY "Public can read educational stages" ON public.educational_stages
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read grades" ON public.grades
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read school settings" ON public.school_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read published announcements" ON public.announcements
  FOR SELECT TO anon, authenticated USING (is_published IS TRUE);
CREATE POLICY "Public can read published events" ON public.events
  FOR SELECT TO anon, authenticated USING (is_published IS TRUE);
CREATE POLICY "Public can read gallery" ON public.gallery
  FOR SELECT TO anon, authenticated USING (true);
