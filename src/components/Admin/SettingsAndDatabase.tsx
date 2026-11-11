import React, { useState } from 'react';
import { dataService } from '../../lib/storage';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection
} from '../../lib/supabase';
import { SchoolSettings, GradingRule, AdminProfile, UserRole } from '../../types/database';
import { FULL_SUPABASE_MIGRATION_SQL } from '../../lib/databaseSql';
import {
  Settings, Database, Save, CheckCircle2, AlertCircle, AlertTriangle, Copy, Key,
  Shield, RotateCcw, Code, ExternalLink, Terminal, UserPlus, Trash2,
  UserCheck, UserX, Lock, Mail, User, ShieldAlert, Upload, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { CopticCross } from '../CopticIcons';

export const SettingsAndDatabase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'grading' | 'admins' | 'supabase'>('settings');

  // School Settings
  const [settings, setSettings] = useState<SchoolSettings>(dataService.getSettings());
  const [gradingRules, setGradingRules] = useState<GradingRule[]>(dataService.getGradingRules());
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>(dataService.getAdminProfiles());

  // Modal states for safe confirmation without window.confirm
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminProfile | null>(null);

  // Supabase connection state
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseKey, setSupabaseKey] = useState(creds.key);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFunction, setCopiedFunction] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateSettings(settings);
    setSaveMessage('تم حفظ وتحديث بيانات وشعار المدرسة بنجاح في كامل النظام.');
    setTimeout(() => setSaveMessage(null), 3000);
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
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setTestingConnection(true);
    setConnectionTestResult(null);

    const test = await testSupabaseConnection(supabaseUrl, supabaseKey);
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

  const handleSaveGradingRules = (e: React.FormEvent) => {
    e.preventDefault();
    gradingRules.forEach(rule => dataService.saveGradingRule(rule));
    setSaveMessage('تم حفظ وتحديث قواعد ومعايير التقديرات بنجاح.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetData = () => {
    setConfirmResetModal(true);
  };

  const executeResetData = () => {
    dataService.resetAllData();
    setSettings(dataService.getSettings());
    setGradingRules(dataService.getGradingRules());
    setAdminProfiles(dataService.getAdminProfiles());
    setConfirmResetModal(false);
    setSaveMessage('تمت استعادة البيانات الافتراضية الأولية بنجاح.');
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
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('results_manager');
  const [adminFormError, setAdminFormError] = useState<string | null>(null);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError(null);

    const trimmedName = newAdminName.trim();
    const trimmedEmail = newAdminEmail.trim().toLowerCase();

    if (!trimmedName) {
      setAdminFormError('يرجى كتابة اسم المسؤول بالكامل.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setAdminFormError('يرجى إدخال بريد إلكتروني صحيح ومعتمد.');
      return;
    }

    if (adminProfiles.some(a => a.email.toLowerCase() === trimmedEmail)) {
      setAdminFormError('هذا البريد الإلكتروني مسجل بالفعل لمسؤول آخر بالنظام.');
      return;
    }

    if (!newAdminPassword || newAdminPassword.length < 6) {
      setAdminFormError('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    const newAdmin: AdminProfile = {
      id: `admin-${Date.now()}`,
      user_id: `user-${Date.now()}`,
      full_name: trimmedName,
      email: trimmedEmail,
      password: newAdminPassword,
      role: newAdminRole,
      is_active: true,
      created_at: new Date().toISOString()
    };

    dataService.saveAdminProfile(newAdmin);
    setAdminProfiles(dataService.getAdminProfiles());
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
    setNewAdminRole('results_manager');
    setShowAddAdminForm(false);
    setSaveMessage(`تمت إضافة حساب المسؤول (${newAdmin.full_name}) بنجاح.`);
    setTimeout(() => setSaveMessage(null), 3000);
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

  const executeDeleteAdmin = () => {
    if (!adminToDelete) return;
    dataService.deleteAdminProfile(adminToDelete.id);
    setAdminProfiles(dataService.getAdminProfiles());
    setSaveMessage(`تم حذف حساب المسؤول (${adminToDelete.full_name}) بنجاح.`);
    setTimeout(() => setSaveMessage(null), 3000);
    setAdminToDelete(null);
  };

  const handleToggleAdminStatus = (admin: AdminProfile) => {
    const activeSuperAdmins = adminProfiles.filter(a => a.role === 'super_admin' && a.is_active);
    if (admin.role === 'super_admin' && admin.is_active && activeSuperAdmins.length <= 1) {
      setSaveMessage('لا يمكن تعطيل المسؤول النشط الوحيد بصلاحية مدير عام النظام.');
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    const updated: AdminProfile = {
      ...admin,
      is_active: !admin.is_active
    };
    dataService.saveAdminProfile(updated);
    setAdminProfiles(dataService.getAdminProfiles());
    setSaveMessage(`تم ${updated.is_active ? 'تفعيل' : 'تعطيل'} حساب المسؤول (${admin.full_name}) بنجاح.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const sqlCodeSample = FULL_SUPABASE_MIGRATION_SQL;

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
            { id: 'settings', label: 'بيانات المدرسة والكنيسة' },
            { id: 'grading', label: 'معايير التقديرات والنسب' },
            { id: 'admins', label: 'حسابات الإدارة والصلاحيات' },
            { id: 'supabase', label: 'مركز ربط Supabase والـ SQL' },
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
                إضافة وتعيين مسؤولي المدرسة والكنترول وتحديد صلاحياتهم وكلمات المرور الخاصة بهم
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
                      سيتمكن المسؤول من تسجيل الدخول فوراً ببياناته إلى لوحة التحكم
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  {/* Password */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      كلمة المرور للدخول <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        dir="ltr"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="6 خانات أو أكثر"
                        className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-right focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
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
                        role: 'super_admin' as UserRole,
                        label: 'مدير عام النظام (Super Admin)',
                        desc: 'صلاحيات كاملة: إدارة الحسابات، قواعد البيانات، والكنترول',
                        border: 'hover:border-red-400'
                      },
                      {
                        role: 'results_manager' as UserRole,
                        label: 'مسؤول الكنترول والنتائج',
                        desc: 'إنشاء الامتحانات، رصد الدرجات، نشر واعتماد النتائج والشهادات',
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
                        desc: 'تقييم الطلاب وتسليم الألحان والمردات الكنسية',
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
                    <span>حفظ وتفعيل حساب المسؤول</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Admins List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0c1a30] font-amiri">
                قائمة الحسابات الإدارية المعتمدة ({adminProfiles.length} مسؤول)
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
                          {adm.password ? (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              كلمة مرور مخصصة
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">
                              كلمة المرور الافتراضية: 12345678
                            </span>
                          )}
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
                    onChange={(e) => setSupabaseUrl(e.target.value)}
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
                    onChange={(e) => setSupabaseKey(e.target.value)}
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
                سيتم مسح أي تعديلات قمت بها واستعادة البيانات الافتراضية لكافة الطلاب والفصول والمواد والنتائج.
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
                <span>نعم، استعد البيانات الافتراضية</span>
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
