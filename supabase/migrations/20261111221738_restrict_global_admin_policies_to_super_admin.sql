-- Reserve global school configuration and content for active super administrators.
-- Scoped administrators retain access only through policies that check resource scope.

drop policy if exists "Admins delete academic years" on public.academic_years;
drop policy if exists "Admins insert academic years" on public.academic_years;
drop policy if exists "Admins update academic years" on public.academic_years;
drop policy if exists "Authenticated read active or admin years" on public.academic_years;
create policy "Authenticated read active or super admin years" on public.academic_years for select to authenticated
using (is_active is true or exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins insert academic years" on public.academic_years for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update academic years" on public.academic_years for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete academic years" on public.academic_years for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete stages" on public.educational_stages;
drop policy if exists "Admins insert stages" on public.educational_stages;
drop policy if exists "Admins update stages" on public.educational_stages;
create policy "Super admins insert stages" on public.educational_stages for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update stages" on public.educational_stages for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete stages" on public.educational_stages for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete subjects" on public.subjects;
drop policy if exists "Admins insert subjects" on public.subjects;
drop policy if exists "Admins update subjects" on public.subjects;
create policy "Super admins insert subjects" on public.subjects for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update subjects" on public.subjects for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete subjects" on public.subjects for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete announcements" on public.announcements;
drop policy if exists "Admins insert announcements" on public.announcements;
drop policy if exists "Admins update announcements" on public.announcements;
drop policy if exists "Authenticated read announcements" on public.announcements;
create policy "Authenticated read published or super admin announcements" on public.announcements for select to authenticated
using (is_published is true or exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins insert announcements" on public.announcements for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update announcements" on public.announcements for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete announcements" on public.announcements for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete events" on public.events;
drop policy if exists "Admins insert events" on public.events;
drop policy if exists "Admins update events" on public.events;
drop policy if exists "Authenticated read events" on public.events;
create policy "Authenticated read published or super admin events" on public.events for select to authenticated
using (is_published is true or exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins insert events" on public.events for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update events" on public.events for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete events" on public.events for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete gallery" on public.gallery;
drop policy if exists "Admins insert gallery" on public.gallery;
drop policy if exists "Admins update gallery" on public.gallery;
create policy "Super admins insert gallery" on public.gallery for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update gallery" on public.gallery for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete gallery" on public.gallery for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins delete school settings" on public.school_settings;
drop policy if exists "Admins insert school settings" on public.school_settings;
drop policy if exists "Admins update school settings" on public.school_settings;
create policy "Super admins insert school settings" on public.school_settings for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins update school settings" on public.school_settings for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
create policy "Super admins delete school settings" on public.school_settings for delete to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));

drop policy if exists "Admins manage imports" on public.import_batches;
create policy "Super admins manage imports" on public.import_batches for all to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()) and ap.is_active is true and ap.role='super_admin'));
