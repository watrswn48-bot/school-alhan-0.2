import React, { useEffect, useState } from 'react';
import { CopticCross } from './CopticIcons';
import { Award, Lock, Home } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

export type PageTab = 'home' | 'results' | 'admin';
interface NavbarProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isAdminLoggedIn }) => {
  const [settings, setSettings] = useState<{ school_name: string; church_name: string; logo_url?: string }>({
    school_name: 'مدرسة تي اتشرومبي للألحان', church_name: '', logo_url: '',
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.from('school_settings').select('school_name,church_name,logo_url').limit(1).maybeSingle()
      .then(({ data }) => { if (data) setSettings(prev => ({ ...prev, ...data })); });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0c1a30] text-slate-100 border-b border-[#c5a059]/30 shadow-lg no-print">
      <div className="bg-[#07101f] text-[#c5a059] text-xs py-1.5 px-4 sm:px-8 border-b border-[#c5a059]/20 flex items-center justify-between">
        <div className="flex items-center gap-2"><CopticCross className="w-3.5 h-3.5" /><span>{settings.church_name || 'بوابة مدرسة تي اتشرومبي للألحان'}</span></div>
        <div className="hidden sm:block text-[11px] text-slate-300">البوابة الرسمية للمدرسة</div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex items-center justify-between gap-4">
        <button onClick={() => onSelectTab('home')} className="flex items-center gap-3.5 text-right text-inherit group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#c5a059] flex items-center justify-center p-1 text-[#0c1a30] shadow-sm overflow-hidden">
            {settings.logo_url ? <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain" /> : <CopticCross className="w-7 h-7" />}
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-amiri text-white">{settings.school_name}</div>
            <div className="text-xs text-[#c5a059] font-medium">الموقع الرسمي ونتائج الطلاب</div>
          </div>
        </button>
        <nav aria-label="التنقل الرئيسي" className="flex items-center gap-2">
          <button onClick={() => onSelectTab('home')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${currentTab === 'home' ? 'bg-white/15 text-[#e0c588]' : 'text-slate-300 hover:bg-white/10'}`}>
            <Home className="w-4 h-4" /><span className="hidden sm:inline">الرئيسية</span>
          </button>
          <button onClick={() => onSelectTab('results')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all ${currentTab === 'results' ? 'bg-[#c5a059] text-[#0c1a30]' : 'bg-gradient-to-r from-[#c5a059] to-[#b8860b] text-[#0c1a30] hover:brightness-110'}`}>
            <Award className="w-4 h-4" /><span>النتائج</span>
          </button>
          <button onClick={() => onSelectTab('admin')} title="لوحة تحكم الكنترول والإدارة" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${currentTab === 'admin' ? 'bg-amber-950/60 text-[#e0c588] border-[#c5a059]' : 'border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'}`}>
            <Lock className="w-3.5 h-3.5 text-[#c5a059]" /><span>{isAdminLoggedIn ? 'الإدارة' : 'دخول الإدارة'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
