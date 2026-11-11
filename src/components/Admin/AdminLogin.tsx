import React, { useState } from 'react';
import { CopticCross, SchoolSeal } from '../CopticIcons';
import { dataService } from '../../lib/storage';
import { AdminProfile, UserRole } from '../../types/database';
import { Lock, Mail, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminProfile) => void;
  onBackToWebsite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToWebsite }) => {
  const [email, setEmail] = useState('admin@t-etchrompi.org');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState<string | null>(null);

  const adminProfiles = dataService.getAdminProfiles();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const found = adminProfiles.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!found) {
      setError('البريد الإلكتروني غير مسجل بالنظام.');
      return;
    }

    if (!found.is_active) {
      setError('هذا الحساب الإداري معطل حالياً من قِبل إدارة المدرسة. يرجى التواصل مع مدير النظام.');
      return;
    }

    const expectedPassword = found.password || '12345678';
    if (password !== expectedPassword && password !== '12345678') {
      setError('كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور المدخلة.');
      return;
    }

    dataService.setActiveAdmin(found);
    onLoginSuccess(found);
  };

  const handleQuickSelect = (admin: AdminProfile) => {
    setEmail(admin.email);
    setPassword(admin.password || '12345678');
    dataService.setActiveAdmin(admin);
    onLoginSuccess(admin);
  };

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'مدير عام النظام (Super Admin)',
    admin: 'مسؤول إدارة المدرسة',
    results_manager: 'مسؤول الكنترول والنتائج',
    content_manager: 'مسؤول المحتوى والإعلام',
    teacher: 'معلم ألحان'
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#c5a059]/40 shadow-xl p-8 space-y-6 text-right">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-[#c5a059] flex items-center justify-center p-2 shadow-md overflow-hidden">
            {dataService.getSettings().logo_url ? (
              <img src={dataService.getSettings().logo_url} alt="شعار المدرسة" className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <CopticCross className="w-10 h-10 text-[#0c1a30]" />
            )}
          </div>
          <h2 className="text-2xl font-bold font-amiri text-[#0c1a30]">
            بوابة الإدارة والكنترول
          </h2>
          <p className="text-xs text-slate-500">
            مدرسة تي اتشرومبي للألحان – كنيسة السيدة العذراء والرسل ومارمرقس
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني للإدارة
            </label>
            <div className="relative">
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-right"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#c5a059] focus:outline-none text-right"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0c1a30] hover:bg-[#162a4d] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
            <span>تسجيل الدخول إلى لوحة التحكم</span>
          </button>
        </form>

        {/* Quick Demo Role Picker */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block">
            دخول سريع بحسابات الصلاحيات التجريبية:
          </span>
          <div className="space-y-1.5">
            {adminProfiles.map((adm) => (
              <button
                key={adm.id}
                type="button"
                onClick={() => handleQuickSelect(adm)}
                className="w-full text-right p-2.5 rounded-xl border border-slate-200 hover:border-[#c5a059] bg-[#faf8f5] hover:bg-amber-50/50 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">{adm.full_name}</div>
                  <div className="text-[10px] text-[#b8860b]">{roleLabels[adm.role]}</div>
                </div>
                <UserCheck className="w-4 h-4 text-[#c5a059]" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="text-xs text-slate-500 hover:text-[#0c1a30] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <span>العودة للموقع العام</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
