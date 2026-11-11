import React from 'react';
import { CopticCross, CopticDove } from './CopticIcons';
import { MapPin, Phone, Mail, Award, Clock } from 'lucide-react';
import { PageTab } from './Navbar';
import { dataService } from '../lib/storage';

interface FooterProps {
  onSelectTab: (tab: PageTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const settings = dataService.getSettings();

  return (
    <footer className="bg-[#07101f] text-slate-300 border-t-2 border-[#c5a059]/40 no-print mt-auto">
      <div className="h-1.5 bg-gradient-to-r from-[#0c1a30] via-[#c5a059] to-[#0c1a30] opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#c5a059] flex items-center justify-center overflow-hidden p-0.5">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <CopticCross className="w-6 h-6 text-[#0c1a30]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold font-amiri text-white">{settings.school_name}</h3>
                <p className="text-xs text-[#c5a059]">{settings.church_name}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              البوابة الإلكترونية المعتمدة للكنترول المدرسي واستخراج شهادات تقييم الألحان الكنسية، الطقس، واللغة القبطية.
            </p>
            <div className="text-[11px] text-[#e0c588] flex items-center gap-1.5">
              <CopticDove className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>«تي اتشرومبي» (ϮϭⲢⲞⲘⲠⲒ) – الحمامة الحسنة</span>
            </div>
          </div>

          {/* Col 2: Control & Disclaimer */}
          <div className="space-y-2 bg-[#0c1a30]/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Clock className="w-4 h-4 text-[#c5a059]" />
              <span>إشعار الكنترول الرسمي</span>
            </div>
            <p className="leading-relaxed">
              {settings.results_disclaimer}
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              رعاية الآباء الكهنة: {settings.dean_name}
            </div>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-2.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#c5a059] shrink-0" />
              <span dir="ltr" className="font-mono text-slate-300">{settings.phone_number}</span>
            </div>
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => onSelectTab('admin')}
                className="text-xs text-[#c5a059] hover:underline font-bold cursor-pointer"
              >
                دخول مسؤولي الكنترول والإدارة
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CopticCross className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} مدرسة تي اتشرومبي للألحان – كنيسة السيدة العذراء والرسل ومارمرقس بسكينة.</span>
          </div>
          <span>صلوا من أجل الخدمة</span>
        </div>
      </div>
    </footer>
  );
};
