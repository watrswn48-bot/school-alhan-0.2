import React, { useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';

interface AdminBootstrapProps {
  onBackToLogin: () => void;
  onBackToWebsite: () => void;
}

export const AdminBootstrap: React.FC<AdminBootstrapProps> = ({ onBackToLogin, onBackToWebsite }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('تعذر الاتصال بمشروع قاعدة بيانات المدرسة.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('bootstrap-super-admin', {
        body: { full_name: fullName.trim(), email: email.trim(), token: token.trim() },
      });
      if (invokeError || !data?.success) {
        setError(data?.error || invokeError?.message || 'تعذر إنشاء حساب المسؤول الرئيسي.');
        return;
      }
      setSuccess(data.message || 'تم إرسال دعوة تفعيل المسؤول الرئيسي.');
      setToken('');
    } catch (requestError) {
      setError('حدث خطأ أثناء إرسال الدعوة: ' + (requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#0c1a30] text-[#e0c588] flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold font-amiri text-[#0c1a30]">تهيئة المسؤول الرئيسي الأول</h1>
          <p className="text-xs leading-6 text-slate-500">
            خطوة لمرة واحدة لإنشاء حساب المدير العام للمدرسة. استخدم بريد مسؤول مدرسي مخوّل، وليس بريد طالب.
          </p>
        </div>

        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{error}</div>}
        {success && <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-6">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المسؤول الرئيسي</label>
              <div className="relative">
                <UserRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input required minLength={3} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 border border-slate-300 rounded-xl text-sm" placeholder="الاسم الكامل" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الرسمي للمسؤول</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input required type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 border border-slate-300 rounded-xl text-sm text-left" placeholder="admin@example.org" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز التهيئة لمرة واحدة</label>
              <div className="relative">
                <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input required type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 border border-slate-300 rounded-xl text-sm font-mono" placeholder="أدخل الرمز الذي استلمته" />
              </div>
            </div>
            <button disabled={loading} className="w-full py-3 rounded-xl bg-[#0c1a30] hover:bg-[#162a4d] disabled:opacity-50 text-white font-bold text-sm">
              {loading ? 'جارٍ إرسال الدعوة...' : 'إنشاء حساب المسؤول وإرسال الدعوة'}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button type="button" onClick={onBackToWebsite} className="text-xs text-slate-500 hover:text-[#0c1a30] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> الموقع العام
          </button>
          <button type="button" onClick={onBackToLogin} className="text-xs font-bold text-[#0c1a30] hover:underline">
            دخول الإدارة
          </button>
        </div>
      </div>
    </div>
  );
};
