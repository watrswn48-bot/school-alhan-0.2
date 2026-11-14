import React, { useState } from 'react';
import { CopticCross } from '../CopticIcons';
import { AdminProfile } from '../../types/database';
import { getSupabaseClient } from '../../lib/supabase';
import { dataService } from '../../lib/storage';
import { useSchoolSettings } from '../../lib/schoolSettingsCache';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminProfile) => void;
  onBackToWebsite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToWebsite }) => {
  const { settings } = useSchoolSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('خدمة تسجيل الدخول غير متاحة حالياً. يرجى المحاولة لاحقاً.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError || !data.user) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('id, user_id, full_name, email, role, is_active, created_at, admin_permissions(*)')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError('هذا الحساب لا يملك صلاحية دخول لوحة إدارة المدرسة. تواصل مع المسؤول الرئيسي.');
        setLoading(false);
        return;
      }

      await dataService.initialize();
      dataService.setActiveAdmin(profile as AdminProfile);
      onLoginSuccess(profile as AdminProfile);
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#c5a059]/40 shadow-xl p-8 space-y-6 text-right">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-[#c5a059] flex items-center justify-center p-2 shadow-md overflow-hidden">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.school_name} decoding="async" className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <CopticCross className="w-10 h-10 text-[#0c1a30]" />
            )}
          </div>
          <h2 className="text-2xl font-bold font-amiri text-[#0c1a30]">بوابة الإدارة والكنترول</h2>
          <p className="text-xs text-slate-500">تسجيل الدخول الآمن بحساب الإدارة المعتمد</p>
        </div>

        {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للإدارة</label>
            <div className="relative">
              <input id="admin-email" type="email" required autoComplete="username" dir="ltr" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-left" />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input id="admin-password" type="password" required autoComplete="current-password" dir="ltr" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-left" />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#0c1a30] hover:bg-[#162a4d] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
            <span>{loading ? 'جارٍ التحقق...' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <button type="button" onClick={onBackToWebsite}
            className="text-xs text-slate-500 hover:text-[#0c1a30] flex items-center justify-center gap-1.5 mx-auto cursor-pointer">
            <span>العودة للموقع العام</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
