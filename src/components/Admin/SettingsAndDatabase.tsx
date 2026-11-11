import React, { useEffect, useState } from 'react';
import {
  getSupabaseCredentials,
  testSupabaseConnection
} from '../../lib/supabase';
import { SchoolSettings, GradingRule, AdminProfile, UserRole } from '../../types/database';
import {
  Settings, Database, Save, CheckCircle2, AlertCircle, AlertTriangle, Copy, Key,
  Shield, RotateCcw, Code, ExternalLink, Terminal, UserPlus, Trash2,
  UserCheck, UserX, Lock, Mail, User, ShieldAlert, Upload, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { CopticCross } from '../CopticIcons';
import { getSupabaseClient } from '../../lib/supabase';
import { dataService } from '../../lib/storage';

export const SettingsAndDatabase: React.FC<{ adminRole?: UserRole }> = ({ adminRole = 'super_admin' }) => {
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    Promise.all([
      supabase.from('school_settings').select('*').limit(1).maybeSingle(),
      supabase.from('academic_years').select('id').eq('is_active', true).maybeSingle(),
      supabase.from('grading_rules').select('*').order('minimum_percentage', { ascending: false }),
    ]).then(([settingsResult, yearResult, rulesResult]) => {
      if (settingsResult.data) setSettings(prev => ({ ...prev, ...settingsResult.data }));
      const activeYearId = yearResult.data?.id;
      if (activeYearId) setSettings(prev => ({ ...prev, academic_year_id: activeYearId }));
      if (rulesResult.data) setGradingRules(rulesResult.data as GradingRule[]);
    });
  }, []);

  const initialSettingsTab = adminRole === 'content_manager' ? 'content' : 'settings';
  const [activeTab, setActiveTab] = useState<'settings' | 'grading' | 'admins' | 'supabase' | 'content'>(initialSettingsTab);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPublished, setAnnouncementPublished] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventPublished, setEventPublished] = useState(false);

  // School Settings
  const [settings, setSettings] = useState<SchoolSettings>({
    id: '', school_name: 'مدرسة تي اتشرومبي للألحان', church_name: '', parish_name: '',
    dean_name: '', spiritual_supervisor: '', phone_number: '', whatsapp_number: '',
    email: '', address: '', logo_url: '', facebook_url: '', youtube_url: '', about_text: '',
    announcement_banner: '', show_banner: false, results_disclaimer: '',
    academic_year_id: '', updated_at: '',
  });
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);

  // Modal states for safe confirmation without window.confirm
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminProfile | null>(null);

  // Supabase connection state
  const creds = getSupabaseCredentials();
  const [supabaseUrl] = useState(creds.url);
  const [supabaseKey] = useState(creds.key);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFunction, setCopiedFunction] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'content') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('event_date', { ascending: true }),
    ]).then(([announcementsResult, eventsResult]) => {
      setAnnouncements(announcementsResult.data ?? []);
      setEvents(eventsResult.data ?? []);
    });
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) { setSaveMessage('تعذر الاتصال بقاعدة بيانات المدرسة.'); return; }
    const { id, ...payload } = settings;
    const query = id && /^[0-9a-f-]{36}$/i.test(id)
      ? supabase.from('school_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id)
      : supabase.from('school_settings').insert({ ...payload, updated_at: new Date().toISOString() });
    const { error } = await query;
    if (error) { setSaveMessage('تعذر حفظ إعدادات المدرسة: ' + error.message); return; }
    const { data } = await supabase.from('school_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setSettings(prev => ({ ...prev, ...data }));
      if (data.primary_color) document.documentElement.style.setProperty('--school-primary', data.primary_color);
      if (data.accent_color) document.documentElement.style.setProperty('--school-accent', data.accent_color);
    }
    await dataService.refresh();
    setSaveMessage('تم حفظ إعدادات المدرسة في قاعدة البيانات.');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setSaveMessage('حجم الصورة كبير، يرجى اختيار ملف صورة لا يتعدى 3 ميجابايت.');
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings(prev => ({ ...prev, logo_url: base64 }));
      setSaveMessage('تم قراءة الصورة بنجاح وتعيينها كشعار للمدرسة. اضغط «حفظ بيانات المدرسة» لتطبيق التغيير.');
      setTimeout(() => setSaveMessage(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_url: '' }));
    setSaveMessage('تم إلغاء الشعار المخصص واستعادة الشعار القبطي الافتراضي.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setConnectionTestResult(null);

    const test = await testSupabaseConnection();
    setTestingConnection(false);
    setConnectionTestResult(test);
  };

  const handleTestConnectionNow = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    const test = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setTestingConnection(false);
    setConnectionTestResult(test);
  };

  const handleSaveGradingRules = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) { setSaveMessage('تعذر الاتصال بقاعدة بيانات المدرسة.'); return; }
    if (!gradingRules.length) { setSaveMessage('أضف قواعد التقدير أولاً قبل الحفظ.'); return; }
    const { error } = await supabase.from('grading_rules').upsert(gradingRules.map(({ id, ...rule }) => ({
      ...(id && /^[0-9a-f-]{36}$/i.test(id) ? { id } : {}),
      ...rule,
    })));
    if (!error) await dataService.refresh();
    setSaveMessage(error ? 'تعذر حفظ قواعد التقدير: ' + error.message : 'تم حفظ قواعد التقدير في قاعدة البيانات.');
  };

  const handleResetData = () => {
    setSaveMessage('إعادة ضبط البيانات غير متاحة حفاظاً على بيانات المدرسة الحقيقية.');
  };

  const executeResetData = () => {
    setConfirmResetModal(false);
    setSaveMessage('تم إيقاف إعادة ضبط البيانات التجريبية حتى لا تتأثر بيانات المدرسة الحقيقية.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const copyToClipboard = (text: string, isFunc = false) => {
    navigator.clipboard.writeText(text);
    if (isFunc) {
      setCopiedFunction(true);
      setTimeout(() => setCopiedFunction(false), 2500);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  // New admin account form state
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('results_manager');
  const [scopeOptions, setScopeOptions] = useState<{ years: any[]; grades: any[]; classes: any[]; terms: any[]; subjects: any[] }>({ years: [], grades: [], classes: [], terms: [], subjects: [] });
  const [scopeClassId, setScopeClassId] = useState('');
  const [scopeTermId, setScopeTermId] = useState('');
  const [scopeSubjectId, setScopeSubjectId] = useState('');
  const [adminFormError, setAdminFormError] = useState<string | null>(null);


  useEffect(() => {
    if (activeTab !== 'admins') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    Promise.all([
      supabase.functions.invoke('admin-management', { body: { action: 'list' } }),
      supabase.from('academic_years').select('id,name,is_active').order('name'),
      supabase.from('grades').select('id,name,stage_id').order('display_order'),
      supabase.from('classes').select('id,name,grade_id,academic_year_id,term_id').order('name'),
      supabase.from('academic_terms').select('id,name,academic_year_id,grade_id,term_number').order('term_number'),
      supabase.from('subjects').select('id,name').order('name'),
    ]).then(([admins, years, grades, classes, terms, subjects]) => {
      if (!admins.error && Array.isArray(admins.data?.admins)) setAdminProfiles(admins.data.admins as AdminProfile[]);
      else if (admins.error) setAdminFormError('إدارة الحسابات متاحة للمسؤول الرئيسي فقط.');
      setScopeOptions({
        years: years.data ?? [], grades: grades.data ?? [], classes: classes.data ?? [],
        terms: terms.data ?? [], subjects: subjects.data ?? [],
      });
    });
  }, [activeTab]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError(null);
    const trimmedName = newAdminName.trim();
    const trimmedEmail = newAdminEmail.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail.includes('@')) {
      setAdminFormError('يرجى إدخال الاسم والبريد الإلكتروني بصورة صحيحة.');
      return;
    }
    if (adminProfiles.some(a => a.email.toLowerCase() === trimmedEmail)) {
      setAdminFormError('هذا البريد الإلكتروني مسجل بالفعل.');
      return;
    }

    const selectedClass = scopeOptions.classes.find(item => item.id === scopeClassId);
    const selectedTerm = scopeOptions.terms.find(item => item.id === scopeTermId);
    if (newAdminRole !== 'content_manager' && !selectedClass) {
      setAdminFormError('اختر فصلًا محددًا قبل إنشاء حساب المسؤول حتى لا يحصل على صلاحية عامة.');
      return;
    }
    if (newAdminRole !== 'admin' && newAdminRole !== 'content_manager') {
      if (!selectedTerm || !scopeSubjectId) {
        setAdminFormError('مسؤول النتائج والمعلم يجب تحديد الفصل والترم والمادة لهم.');
        return;
      }
      if (
        selectedTerm.academic_year_id !== selectedClass?.academic_year_id ||
        selectedTerm.grade_id !== selectedClass?.grade_id ||
        (selectedClass?.term_id && selectedClass.term_id !== selectedTerm.id)
      ) {
        setAdminFormError('الترم المختار لا يتبع الفصل والسنة المحددين.');
        return;
      }
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminFormError('تعذر الاتصال بقاعدة بيانات المدرسة.');
      return;
    }
    const { data, error } = await supabase.functions.invoke('admin-management', {
      body: {
        action: 'invite', full_name: trimmedName, email: trimmedEmail, role: newAdminRole,
        permissions: newAdminRole === 'content_manager'
          ? [{ permission_key: 'manage_content' }]
          : newAdminRole === 'admin'
            ? [{
                permission_key: 'manage_students',
                academic_year_id: selectedClass?.academic_year_id,
                grade_id: selectedClass?.grade_id,
                class_id: selectedClass?.id,
              }]
            : [{
                permission_key: 'manage_results',
                academic_year_id: selectedClass?.academic_year_id,
                grade_id: selectedClass?.grade_id,
                class_id: selectedClass?.id,
                term_id: selectedTerm?.id,
                subject_id: scopeSubjectId,
              }],
      },
    });
    if (error || !data?.success) {
      setAdminFormError(data?.error || 'تعذر إرسال دعوة المسؤول. تأكد من أنك المسؤول الرئيسي.');
      return;
    }

    const refreshed = await supabase.functions.invoke('admin-management', { body: { action: 'list' } });
    if (Array.isArray(refreshed.data?.admins)) setAdminProfiles(refreshed.data.admins as AdminProfile[]);
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminRole('results_manager');
    setScopeClassId(''); setScopeTermId(''); setScopeSubjectId('');
    setShowAddAdminForm(false);
    setSaveMessage('تم إرسال دعوة تفعيل الحساب إلى البريد الإلكتروني للمسؤول.');
  };

  const handleDeleteAdmin = (admin: AdminProfile) => {
    const superAdmins = adminProfiles.filter(a => a.role === 'super_admin');
    if (admin.role === 'super_admin' && superAdmins.length <= 1) {
      setSaveMessage('لا يمكن حذف المسؤول الوحيد بصلاحية مدير عام النظام (Super Admin).');
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    setAdminToDelete(admin);
  };

  const executeDeleteAdmin = async () => {
    if (!adminToDelete) return;
    const supabase = getSupabaseClient();
    const { error } = supabase
      ? await supabase.functions.invoke('admin-management', {
          body: { action: 'set-active', id: adminToDelete.id, is_active: false },
        })
      : { error: new Error('تعذر الاتصال بقاعدة البيانات.') };
    if (error) {
      setSaveMessage('تعذر تعطيل الحساب من قاعدة البيانات.');
    } else {
      setAdminProfiles(prev => prev.map(a => a.id === adminToDelete.id ? { ...a, is_active: false } : a));
      setSaveMessage('تم تعطيل حساب المسؤول. يمكن إعادة تفعيله لاحقاً.');
    }
    setAdminToDelete(null);
  };

  const handleToggleAdminStatus = async (admin: AdminProfile) => {
    if (admin.role === 'super_admin' && admin.is_active && adminProfiles.filter(a => a.role === 'super_admin' && a.is_active).length <= 1) {
      setSaveMessage('لا يمكن تعطيل المسؤول الرئيسي الوحيد.');
      return;
    }
    const nextStatus = !admin.is_active;
    const supabase = getSupabaseClient();
    const { error } = supabase
      ? await supabase.functions.invoke('admin-management', {
          body: { action: 'set-active', id: admin.id, is_active: nextStatus },
        })
      : { error: new Error('تعذر الاتصال بقاعدة البيانات.') };
    if (error) {
      setSaveMessage('تعذر تحديث حالة الحساب. تأكد من صلاحية المسؤول الرئيسي.');
      return;
    }
    setAdminProfiles(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: nextStatus } : a));
    setSaveMessage(`تم ${nextStatus ? 'تفعيل' : 'تعطيل'} حساب المسؤول.`);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !announcementTitle.trim() || !announcementContent.trim()) return;
    const { error } = await supabase.from('announcements').insert({
      id: crypto.randomUUID(), title: announcementTitle.trim(), content: announcementContent.trim(),
      is_published: announcementPublished, published_at: announcementPublished ? new Date().toISOString() : null,
    });
    if (error) { setSaveMessage('تعذر حفظ الإعلان: ' + error.message); return; }
    setAnnouncementTitle(''); setAnnouncementContent(''); setAnnouncementPublished(false);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data ?? []);
    setSaveMessage('تم حفظ الإعلان.');
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) return;
    const { error } = await supabase.from('events').insert({
      id: crypto.randomUUID(), title: eventTitle.trim(), description: eventDescription.trim(),
      event_date: new Date(eventDate).toISOString(), location: eventLocation.trim(), is_published: eventPublished,
    });
    if (error) { setSaveMessage('تعذر حفظ النشاط: ' + error.message); return; }
    setEventTitle(''); setEventDescription(''); setEventDate(''); setEventLocation(''); setEventPublished(false);
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents(data ?? []);
    setSaveMessage('تم حفظ النشاط.');
  };

  const handleToggleContentPublish = async (table: 'announcements' | 'events', id: string, published: boolean) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const patch = table === 'announcements'
      ? { is_published: published, published_at: published ? new Date().toISOString() : null }
      : { is_published: published };
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) { setSaveMessage('تعذر تحديث حالة النشر: ' + error.message); return; }
    if (table === 'announcements') setAnnouncements(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    else setEvents(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const sqlCodeSample = 'تم تطبيق ملفات التهيئة والتحديث على مشروع t-etchrompi-school. ملفات الترحيل المعتمدة محفوظة داخل مجلد supabase/migrations في مستودع المدرسة. لا تلصق ملفات SQL قديمة من هذه الشاشة.';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold font-amiri text-[#0c1a30] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#c5a059]" />
          <span>إعدادات النظام وقاعدة بيانات Supabase</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          بيانات المدرسة والكنيسة، تخصيص معايير التقديرات، حسابات الإدارة، وربط قاعدة البيانات
        </p>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-200 pb-2">
          {[
            ...(adminRole === 'super_admin' ? [{ id: 'settings', label: 'بيانات المدرسة والكنيسة' }] : []),
            { id: 'content', label: 'الإعلانات والأنشطة' },
            ...(adminRole === 'super_admin' ? [{ id: 'grading', label: 'معايير التقديرات والنسب' }, { id: 'admins', label: 'حسابات الإدارة والصلاحيات' }, { id: 'supabase', label: 'مركز ربط Supabase' }] : []),
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#0c1a30] text-[#e0c588]'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-lg font-amiri text-[#0c1a30]">إضافة إعلان</h3>
            <form onSubmit={handleAddAnnouncement} className="space-y-3">
              <input required value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="عنوان الإعلان" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <textarea required rows={4} value={announcementContent} onChange={e => setAnnouncementContent(e.target.value)} placeholder="نص الإعلان" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={announcementPublished} onChange={e => setAnnouncementPublished(e.target.checked)} /> نشر الإعلان فوراً</label>
              <button className="px-5 py-2.5 rounded-xl bg-[#0c1a30] text-white font-bold">حفظ الإعلان</button>
            </form>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-bold text-sm">الإعلانات الحالية</h4>
              {announcements.map(item => <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50">
                <div><p className="font-bold">{item.title}</p><p className="text-xs text-slate-500 line-clamp-2">{item.content}</p></div>
                <button type="button" onClick={() => handleToggleContentPublish('announcements', item.id, !item.is_published)} className="text-xs font-bold text-[#0c1a30]">{item.is_published ? 'إخفاء' : 'نشر'}</button>
              </div>)}
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-lg font-amiri text-[#0c1a30]">إضافة نشاط أو موعد</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <input required value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="اسم النشاط" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <textarea required rows={3} value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="وصف النشاط" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <input required type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <input required value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="المكان" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventPublished} onChange={e => setEventPublished(e.target.checked)} /> نشر النشاط فوراً</label>
              <button className="px-5 py-2.5 rounded-xl bg-[#0c1a30] text-white font-bold">حفظ النشاط</button>
            </form>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-bold text-sm">الأنشطة الحالية</h4>
              {events.map(item => <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50">
                <div><p className="font-bold">{item.title}</p><p className="text-xs text-slate-500">{new Date(item.event_date).toLocaleString('ar-EG')} · {item.location}</p></div>
                <button type="button" onClick={() => handleToggleContentPublish('events', item.id, !item.is_published)} className="text-xs font-bold text-[#0c1a30]">{item.is_published ? 'إخفاء' : 'نشر'}</button>
              </div>)}
            </div>
          </section>
        </div>
      )}

      {/* 1. School Information Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* Logo Configuration Card (Upload File or URL Link) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border-2 border-[#c5a059]/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#c5a059]" />
                  <h4 className="font-bold text-sm text-[#0c1a30] font-amiri">
                    شعار مدرسة الألحان والكنيسة (Logo)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  يظهر في الهيدر، شهادات نتائج الطلاب، شاشة الدخول، والفوتر
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Live Logo Preview */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-[#c5a059] flex items-center justify-center p-2 shadow-md overflow-hidden text-[#0c1a30]">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="معاينة شعار المدرسة"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <CopticCross className="w-14 h-14 text-[#c5a059]" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">
                    {settings.logo_url ? 'شعار مخصص نشط' : 'الشعار الافتراضي'}
                  </span>
                </div>

                {/* Upload or Link inputs */}
                <div className="flex-1 w-full space-y-3">
                  {/* File Upload Option */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>الخيار 1: رفع صورة الشعار من جهازك (PNG, JPG, SVG, WebP)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-white rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 text-xs shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>اختر ملف صورة من الجهاز...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      {settings.logo_url && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إلغاء اللوجو والعودة للافتراضي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* URL Link Option */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>الخيار 2: أو إدخال رابط مباشر لصورة اللوجو (Image Link / URL)</span>
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={settings.logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value.trim() })}
                      placeholder="https://example.com/school-logo.png"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-right focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold mb-1">نبذة تعريفية عن المدرسة</label>
              <textarea
                rows={4}
                value={settings.about_text || ''}
                onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                placeholder="اكتب نبذة المدرسة ورسالتها والأنشطة التعليمية..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم مدرسة الألحان</label>
                <input
                  type="text"
                  required
                  value={settings.school_name}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الكنيسة والمقر</label>
                <input
                  type="text"
                  required
                  value={settings.church_name}
                  onChange={(e) => setSettings({ ...settings, church_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المنطقة والإيبارشية</label>
                <input
                  type="text"
                  value={settings.parish_name}
                  onChange={(e) => setSettings({ ...settings, parish_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رعاية الآباء الكهنة</label>
                <input
                  type="text"
                  value={settings.dean_name}
                  onChange={(e) => setSettings({ ...settings, dean_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  dir="ltr"
                  value={settings.phone_number}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم واتساب الكنترول</label>
                <input
                  type="text"
                  dir="ltr"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">عنوان الكنيسة التفصيلي</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">التنبيه والبيان أسفل شهادات النتائج</label>
              <textarea
                rows={2}
                value={settings.results_disclaimer}
                onChange={(e) => setSettings({ ...settings, results_disclaimer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>استعادة البيانات الافتراضية الأولية</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer"
              >
                حفظ بيانات المدرسة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Grading Rules Tab */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#0c1a30] font-amiri">
                معايير التقديرات القابلة للتخصيص (Dynamic Grading Thresholds)
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك تعديل النسب الدنيا والعليا ومسمى التقدير ولونه دون أي تثبيت كودي
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveGradingRules} className="space-y-4 text-xs">
            <div className="space-y-3">
              {gradingRules.map((rule, idx) => (
                <div key={rule.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-[#faf8f5] border border-slate-200 items-center">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">مسمى التقدير</label>
                    <input
                      type="text"
                      value={rule.evaluation_label}
                      onChange={(e) => {
                        const updated = [...gradingRules];
                        updated[idx].evaluation_label = e.target.value;
                        setGradingRules(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">الحد الأدنى %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.minimum_percentage}
                      onChange={(e) => {
                        const updated = [...gradingRules];
                        updated[idx].minimum_percentage = parseFloat(e.target.value);
                        setGradingRules(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">الحد الأقصى %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.maximum_percentage}
                      onChange={(e) => {
                        const updated = [...gradingRules];
                        updated[idx].maximum_percentage = parseFloat(e.target.value);
                        setGradingRules(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ناجح؟</label>
                    <input
                      type="checkbox"
                      checked={rule.is_pass}
                      onChange={(e) => {
                        const updated = [...gradingRules];
                        updated[idx].is_pass = e.target.checked;
                        setGradingRules(updated);
                      }}
                      className="rounded"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer"
              >
                حفظ معايير التقديرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Admin Accounts Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Header & Add Button */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-bold text-base text-[#0c1a30] font-amiri">
                  إدارة حسابات فريق الإدارة والكنترول (RBAC)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إضافة وتعيين مسؤولي المدرسة والكنترول وتحديد صلاحياتهم وصلاحيات الوصول المخصصة لهم
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddAdminForm(!showAddAdminForm);
                setAdminFormError(null);
              }}
              className="px-4 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-[#e0c588] rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4 text-[#c5a059]" />
              <span>{showAddAdminForm ? 'إغلاق نموذج الإضافة' : 'إضافة حساب مسؤول جديد +'}</span>
            </button>
          </div>

          {/* Form to Add New Admin */}
          {showAddAdminForm && (
            <div className="bg-gradient-to-br from-amber-50/60 to-white rounded-2xl border-2 border-[#c5a059] p-6 shadow-md transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-[#c5a059]/30 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0c1a30] text-[#c5a059] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0c1a30] font-amiri">
                      إضافة حساب مسؤول جديد بالكنترول
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      سيصل للمسؤول رابط تفعيل آمن على بريده الإلكتروني، ويحدد كلمة مروره بنفسه.
                    </p>
                  </div>
                </div>
              </div>

              {adminFormError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{adminFormError}</span>
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      الاسم بالكامل والصفة <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="مثال: الشماس مينا عاطف غالي"
                        className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      البريد الإلكتروني الإداري <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        dir="ltr"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="mina@t-etchrompi.org"
                        className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-right focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-slate-700 font-bold mb-2">
                    تحديد نوع الصلاحية والدور الإداري <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        role: 'results_manager' as UserRole,
                        label: 'مسؤول الكنترول والنتائج',
                        desc: 'رصد درجات المواد المحددة فقط؛ اعتماد ونشر النتائج من اختصاص المسؤول الرئيسي',
                        border: 'hover:border-emerald-400'
                      },
                      {
                        role: 'admin' as UserRole,
                        label: 'مسؤول شؤون المدرسة والطلاب',
                        desc: 'إدارة الطلاب، المراحل، الصفوف، وتكويد الطلاب المانوي',
                        border: 'hover:border-indigo-400'
                      },
                      {
                        role: 'teacher' as UserRole,
                        label: 'معلم ألحان / طقس كنسي',
                        desc: 'رصد تقييمات المواد والفصول المحددة فقط دون صلاحية اعتماد النتائج',
                        border: 'hover:border-amber-400'
                      },
                      {
                        role: 'content_manager' as UserRole,
                        label: 'مسؤول المحتوى والإعلام',
                        desc: 'إدارة بيانات المدرسة، التعليمات والتنبيهات المدرسية',
                        border: 'hover:border-blue-400'
                      }
                    ].map((item) => (
                      <label
                        key={item.role}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                          newAdminRole === item.role
                            ? 'bg-amber-50/80 border-[#c5a059] shadow-sm'
                            : 'bg-white border-slate-200 ' + item.border
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminRole"
                          checked={newAdminRole === item.role}
                          onChange={() => setNewAdminRole(item.role)}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{item.label}</span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {newAdminRole !== 'content_manager' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                    <div>
                      <label className="block font-bold mb-1">الفصل المسموح به</label>
                      <select required value={scopeClassId} onChange={e => setScopeClassId(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                        <option value="">اختر الفصل</option>
                        {scopeOptions.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">الترم المسموح به</label>
                      <select required={newAdminRole !== 'admin'} value={scopeTermId} onChange={e => setScopeTermId(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                        <option value="">اختر الترم</option>
                        {scopeOptions.terms.filter(item => {
                          const selected = scopeOptions.classes.find(c => c.id === scopeClassId);
                          return selected && item.academic_year_id === selected.academic_year_id &&
                            item.grade_id === selected.grade_id && (!selected.term_id || item.id === selected.term_id);
                        }).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                    {newAdminRole !== 'admin' && <div>
                      <label className="block font-bold mb-1">المادة المسموح بها</label>
                      <select required value={scopeSubjectId} onChange={e => setScopeSubjectId(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                        <option value="">اختر المادة</option>
                        {scopeOptions.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>}
                    <p className="sm:col-span-3 text-[11px] text-slate-500">الصلاحية ستُربط بالفصل والمادة المختارين، وتُفرض من قاعدة البيانات.</p>
                  </div>
                )}
                
                {/* Form Buttons */}
                <div className="pt-3 border-t border-[#c5a059]/20 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAdminForm(false);
                      setAdminFormError(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-[#c5a059]" />
                    <span>إرسال دعوة تفعيل الحساب</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Admins List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0c1a30] font-amiri">
                قائمة الحسابات الإدارية ({adminProfiles.length} مسؤول)
              </h4>
              <span className="text-xs text-slate-400">
                يمكن لكل مسؤول تسجيل الدخول مباشرة عبر شاشة دخول الإدارة
              </span>
            </div>

            <div className="space-y-3">
              {adminProfiles.map((adm) => {
                const isSuper = adm.role === 'super_admin';
                const roleBadgeInfo = {
                  super_admin: { label: 'مدير عام النظام', color: 'bg-red-50 text-red-800 border-red-200' },
                  results_manager: { label: 'مسؤول الكنترول والنتائج', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  admin: { label: 'مسؤول شؤون المدرسة', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                  teacher: { label: 'معلم ألحان وطقوس', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  content_manager: { label: 'مسؤول المحتوى', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                }[adm.role] || { label: adm.role, color: 'bg-slate-50 text-slate-800 border-slate-200' };

                return (
                  <div
                    key={adm.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      adm.is_active ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                        isSuper ? 'bg-[#0c1a30] text-[#c5a059]' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {adm.full_name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{adm.full_name}</span>
                          {!adm.is_active && (
                            <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">
                              معطل
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 mt-0.5 font-mono text-[11px]">
                          <span>{adm.email}</span>
                                          <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">تفعيل عبر دعوة البريد الإلكتروني</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-3 py-1 rounded-full font-bold border text-[11px] ${roleBadgeInfo.color}`}>
                        {roleBadgeInfo.label}
                      </span>

                      {/* Toggle status */}
                      <button
                        type="button"
                        onClick={() => handleToggleAdminStatus(adm)}
                        title={adm.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                          adm.is_active
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {adm.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(adm)}
                        title="حذف الحساب"
                        className="p-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Supabase Hub & SQL Center */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Connection Settings Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-bold text-sm text-[#0c1a30] font-amiri">
                  إعدادات الاتصال بـ Supabase (PostgreSQL & Auth & Edge Functions)
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                creds.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {creds.isConfigured ? 'تمت إضافة البيانات' : 'يعمل بالوضع المحلي المدمج'}
              </span>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رابط مشروع Supabase (Project URL)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={supabaseUrl}
                    readOnly
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    مفتاح الوصول العام (Anon Key)
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={supabaseKey}
                    readOnly
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {connectionTestResult && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                  connectionTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {connectionTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span>{connectionTestResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnectionNow}
                  disabled={testingConnection || !supabaseUrl}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? 'جاري الفحص...' : 'فحص الاتصال فقط'}
                </button>
                <button
                  type="submit"
                  disabled={testingConnection}
                  className="px-6 py-2 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? 'جاري الفحص والحفظ...' : 'حفظ واختبار الربط'}
                </button>
              </div>
            </form>
          </div>

          {/* Setup Guide in Arabic */}
          <div className="bg-[#faf8f5] rounded-2xl border border-[#c5a059]/40 p-6 space-y-4 text-xs text-slate-700">
            <h4 className="font-bold text-sm text-[#0c1a30] font-amiri flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#c5a059]" />
              <span>خطوات تهيئة قاعدة بيانات Supabase الرسمية لمدرسة الألحان:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>سجل دخولك إلى لوحة تحكم <strong>Supabase (supabase.com)</strong> وأنشئ مشروعاً جديداً باسم <code>t-etchrompi-school</code>.</li>
              <li>انتقل إلى تبويب <strong>SQL Editor</strong>، واضغط على <strong>New Query</strong>.</li>
              <li>انسخ كود ملف التهيئة أدناه (الموجود أيضاً في <code>supabase/migrations/20261105000000_school_system.sql</code>) والصقه ثم اضغط <strong>RUN</strong>.</li>
              <li>سيتم إنشاء جميع الجداول الـ 16، والقيود، والفهارس، وسياسات الأمان (RLS).</li>
              <li>انسخ <strong>Project URL</strong> و <strong>Anon Public Key</strong> من إعدادات <strong>Project Settings &gt; API</strong> وضعهما في الحقول أعلاه.</li>
            </ol>
          </div>

          {/* SQL Viewer & Copy */}
          <div className="bg-[#0c1a30] text-slate-100 rounded-2xl p-6 border-2 border-[#c5a059]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-xs font-mono text-[#e0c588]">
                <Terminal className="w-4 h-4" />
                <span>ملف SQL Migration الكامل (18 جدول + RLS + قيود الأكواد المانوية)</span>
              </div>
              <button
                onClick={() => copyToClipboard(sqlCodeSample, false)}
                className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d4af37] text-[#0c1a30] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow"
              >
                {copiedSql ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'تم النسخ للحافظة!' : 'نسخ كود الـ SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#07101f] rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-64 border border-slate-800">
              {sqlCodeSample}
            </pre>
          </div>
        </div>
      )}

      {/* In-App Reset Database Confirmation Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500/30 space-y-4 text-right">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-amiri">استعادة البيانات الافتراضية</h3>
                <p className="text-xs text-slate-500">تحذير مسح واستعادة البيانات الأولية</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-bold text-red-800">هل أنت متأكد تماماً من رغبتك في هذا الإجراء؟</p>
              <p>
                إعادة الضبط التجريبية متوقفة حتى لا يتم حذف أي بيانات حقيقية من النظام.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeResetData}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إغلاق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Admin Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500/30 space-y-4 text-right">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-amiri">تأكيد حذف المسؤول</h3>
                <p className="text-xs text-slate-500">سيتم إلغاء صلاحية الدخول نهائياً</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>هل أنت متأكد من حذف حساب المسؤول:</p>
              <div className="p-2.5 bg-white rounded-lg border border-red-200">
                <div className="font-bold text-sm text-[#0c1a30]">{adminToDelete.full_name}</div>
                <div className="text-slate-500 font-mono text-xs mt-0.5">{adminToDelete.email}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={executeDeleteAdmin}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

