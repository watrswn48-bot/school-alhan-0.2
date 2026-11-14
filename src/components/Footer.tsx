import React from 'react';
import { CopticCross, CopticDove } from './CopticIcons';
import { MapPin, Phone, Award, Clock, Home } from 'lucide-react';
import { PageTab } from './Navbar';
import { useSchoolSettings } from '../lib/schoolSettingsCache';

interface FooterProps { onSelectTab: (tab: PageTab) => void; }

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { settings, logoLoading } = useSchoolSettings();

  return (
    <footer className="bg-[#07101f] text-slate-300 border-t-2 border-[var(--school-accent)]/40 no-print mt-auto">
      <div className="h-1.5 bg-gradient-to-r from-[var(--school-primary)] via-[var(--school-accent)] to-[var(--school-primary)] opacity-80" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[var(--school-accent)] flex items-center justify-center overflow-hidden p-0.5">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.school_name} decoding="async" className="w-full h-full object-contain" />
                ) : logoLoading ? (
                  <div className="w-full h-full rounded bg-slate-200 animate-pulse" aria-hidden="true" />
                ) : (
                  <CopticCross className="w-6 h-6 text-[var(--school-primary)]" />
                )}
              </div>
              <div><h3 className="text-base font-bold font-amiri text-white">{settings.school_name}</h3><p className="text-xs text-[var(--school-accent)]">{settings.church_name}</p></div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">الموقع الإلكتروني الرسمي للمدرسة، للتعريف بالأنشطة والإعلانات والاستعلام عن نتائج الطلاب.</p>
            <div className="text-[11px] text-[#e0c588] flex items-center gap-1.5"><CopticDove className="w-3.5 h-3.5 text-[var(--school-accent)]" /><span>تي اتشرومبي للألحان</span></div>
          </div>
          <div className="space-y-2 bg-[var(--school-primary)]/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-white"><Clock className="w-4 h-4 text-[var(--school-accent)]" /><span>إشعار النتائج</span></div>
            <p className="leading-relaxed">{settings.results_disclaimer}</p>
            {settings.dean_name && <div className="text-[11px] text-slate-500 pt-1">رعاية الآباء الكهنة: {settings.dean_name}</div>}
          </div>
          <div className="space-y-2.5 text-xs text-slate-400">
            {settings.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[var(--school-accent)] shrink-0 mt-0.5" /><span>{settings.address}</span></div>}
            {settings.phone_number && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[var(--school-accent)] shrink-0" /><span dir="ltr" className="font-mono text-slate-300">{settings.phone_number}</span></div>}
            <div className="pt-1 flex flex-wrap gap-4">
              <button onClick={() => onSelectTab('home')} className="text-xs text-[var(--school-accent)] hover:underline font-bold flex items-center gap-1"><Home className="w-3.5 h-3.5" />الرئيسية</button>
              <button onClick={() => onSelectTab('results')} className="text-xs text-[var(--school-accent)] hover:underline font-bold flex items-center gap-1"><Award className="w-3.5 h-3.5" />نتائج الطلاب</button>
              <button onClick={() => onSelectTab('admin')} className="text-xs text-[var(--school-accent)] hover:underline font-bold">دخول الإدارة</button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2"><CopticCross className="w-3.5 h-3.5 text-[var(--school-accent)]" /><span>جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.school_name}.</span></div>
          <span>صلوا من أجل الخدمة</span>
        </div>
      </div>
    </footer>
  );
};
