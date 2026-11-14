import React from 'react';
import { CopticCross } from './CopticIcons';
import { Award, Home } from 'lucide-react';
import { useSchoolSettings } from '../lib/schoolSettingsCache';

export type PageTab = 'home' | 'results' | 'admin' | 'bootstrap';
interface NavbarProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { settings, logoLoading } = useSchoolSettings();

  return (
    <header className="sticky top-0 z-50 bg-[var(--school-primary)] text-slate-100 border-b border-[var(--school-accent)]/30 shadow-lg no-print">
      <div className="bg-[#07101f] text-[var(--school-accent)] text-xs py-1.5 px-4 sm:px-8 border-b border-[var(--school-accent)]/20 flex items-center justify-between">
        <div className="flex items-center gap-2"><CopticCross className="w-3.5 h-3.5" /><span>{settings.church_name || 'بوابة مدرسة تي اتشرومبي للألحان'}</span></div>
        <div className="hidden sm:block text-[11px] text-slate-300">البوابة الرسمية للمدرسة</div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex items-center justify-between gap-4">
        <button onClick={() => onSelectTab('home')} className="flex items-center gap-3.5 text-right text-inherit group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[var(--school-accent)] flex items-center justify-center p-1 text-[var(--school-primary)] shadow-sm overflow-hidden">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.school_name}
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-contain"
              />
            ) : logoLoading ? (
              <div className="w-full h-full rounded-lg bg-slate-200 animate-pulse" aria-hidden="true" />
            ) : (
              <CopticCross className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-amiri text-white">{settings.school_name}</div>
            <div className="text-xs text-[var(--school-accent)] font-medium">الموقع الرسمي ونتائج الطلاب</div>
          </div>
        </button>
        <nav aria-label="التنقل الرئيسي" className="flex items-center gap-2">
          <button onClick={() => onSelectTab('home')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${currentTab === 'home' ? 'bg-white/15 text-[#e0c588]' : 'text-slate-300 hover:bg-white/10'}`}>
            <Home className="w-4 h-4" /><span className="hidden sm:inline">الرئيسية</span>
          </button>
          <button onClick={() => onSelectTab('results')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all ${currentTab === 'results' ? 'bg-[var(--school-accent)] text-[var(--school-primary)]' : 'bg-gradient-to-r from-[var(--school-accent)] to-[#b8860b] text-[var(--school-primary)] hover:brightness-110'}`}>
            <Award className="w-4 h-4" /><span>النتائج</span>
          </button>

        </nav>
      </div>
    </header>
  );
};
