import React from 'react';
import { CopticCross } from './CopticIcons';
import { Award, Lock, ExternalLink } from 'lucide-react';
import { dataService } from '../lib/storage';

export type PageTab = 'results' | 'admin';

interface NavbarProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isAdminLoggedIn }) => {
  const settings = dataService.getSettings();

  return (
    <header className="sticky top-0 z-50 bg-[#0c1a30] text-slate-100 border-b border-[#c5a059]/30 shadow-lg no-print">
      {/* Top micro bar for Church Dedication */}
      <div className="bg-[#07101f] text-[#c5a059] text-xs py-1.5 px-4 sm:px-8 border-b border-[#c5a059]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CopticCross className="w-3.5 h-3.5 text-[#c5a059]" />
          <span className="font-medium tracking-wide">كنيسة السيدة العذراء مريم والآباء الرسل ومارمرقس – سكينة، الإسكندرية</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-300">
          <span>بوابة الكنترول الرسمية للعام الدراسي 2025 - 2026</span>
          <span aria-hidden="true" className="text-[#c5a059]">·</span>
          <span>شعارنا: «أُرَتِّلُ لإِلهِي مَا دُمْتُ مَوْجُوداً» (مز 104 : 33)</span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          onClick={() => onSelectTab('results')}
          className="flex items-center gap-3.5 text-right text-inherit group cursor-pointer focus-visible:outline-none"
        >
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#c5a059] flex items-center justify-center p-1 text-[#0c1a30] shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <CopticCross className="w-7 h-7 text-[#0c1a30]" />
            )}
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-amiri text-white flex items-center gap-2">
              <span>مدرسة تي اتشرومبي للألحان</span>
            </div>
            <div className="text-xs text-[#c5a059] font-medium tracking-wide">
              <span>بوابة نتائج وتقييمات الطلاب الرسمية</span>
              <span className="mx-1 text-slate-400">·</span>
              <span className="text-slate-300 font-mono">ϮϭⲢⲞⲘⲠⲒ ⲛ̀ⲁⲗϩⲁⲛ</span>
            </div>
          </div>
        </button>

        {/* Action Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'results'
                ? 'bg-[#c5a059] text-[#0c1a30] ring-2 ring-[#e0c588]'
                : 'bg-gradient-to-r from-[#c5a059] to-[#b8860b] text-[#0c1a30] hover:brightness-110 active:scale-95'
            }`}
          >
            <Award className="w-4 h-4 text-[#0c1a30]" />
            <span>بوابة الاستعلام</span>
          </button>

          {/* Admin Dashboard CTA */}
          <button
            onClick={() => onSelectTab('admin')}
            title="لوحة تحكم الكنترول والإدارة"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'admin'
                ? 'bg-amber-950/60 text-[#e0c588] border-[#c5a059]'
                : 'border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>{isAdminLoggedIn ? 'لوحة الكنترول' : 'دخول الإدارة'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
