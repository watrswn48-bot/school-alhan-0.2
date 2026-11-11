import React, { useEffect, useState } from 'react';
import { Award, Bell, CalendarDays, BookOpen, ArrowLeft, MapPin } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { SchoolSettings } from '../../types/database';

interface Announcement {
  id: string; title: string; content: string; category?: string; published_at?: string;
}
interface EventItem {
  id: string; title: string; description: string; event_date: string; location: string;
}

interface HomePageProps {
  onOpenResults: () => void;
}

const fallbackSettings: SchoolSettings & { about_text?: string } = {
  id: '', school_name: 'مدرسة تي اتشرومبي للألحان', church_name: '', parish_name: '',
  dean_name: '', spiritual_supervisor: '', phone_number: '', whatsapp_number: '',
  email: '', address: '', logo_url: '', facebook_url: '', youtube_url: '',
  announcement_banner: '', show_banner: false, results_disclaimer: '',
  academic_year_id: '', updated_at: '', about_text: '',
};

export const HomePage: React.FC<HomePageProps> = ({ onOpenResults }) => {
  const [settings, setSettings] = useState(fallbackSettings);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setLoading(false); return; }
    Promise.all([
      supabase.from('school_settings').select('*').limit(1).maybeSingle(),
      supabase.from('announcements').select('id,title,content,category,published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(5),
      supabase.from('events').select('id,title,description,event_date,location').eq('is_published', true).order('event_date', { ascending: true }).limit(5),
    ]).then(([settingsResult, announcementsResult, eventsResult]) => {
      if (settingsResult.data) setSettings(prev => ({ ...prev, ...settingsResult.data }));
      setAnnouncements(announcementsResult.data ?? []);
      setEvents(eventsResult.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 bg-[#faf8f5]">
      <section className="relative overflow-hidden bg-[var(--school-primary)] text-white">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border-[30px] border-[var(--school-accent)]" />
          <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full border-[24px] border-[var(--school-accent)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid md:grid-cols-[1.3fr_0.7fr] gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-sm text-[#e0c588] font-bold">
              <BookOpen className="w-4 h-4" /> البوابة الرسمية للمدرسة
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-amiri leading-tight">{settings.school_name}</h1>
            <p className="text-lg text-slate-200 leading-relaxed max-w-2xl">
              {settings.about_text || 'بوابة المدرسة الإلكترونية للتعريف بالمدرسة ومتابعة الإعلانات والاستعلام عن نتائج الطلاب المعتمدة.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenResults} className="px-6 py-3 rounded-xl bg-[var(--school-accent)] hover:bg-[#d7b66f] text-[var(--school-primary)] font-bold inline-flex items-center gap-2 shadow-lg">
                <Award className="w-5 h-5" /> الاستعلام عن النتائج
              </button>
              {settings.address && <span className="px-4 py-3 text-sm text-slate-300 inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--school-accent)]" />{settings.address}</span>}
            </div>
          </div>
          <div className="mx-auto w-52 h-52 sm:w-64 sm:h-64 rounded-[2rem] bg-white/10 border border-[var(--school-accent)]/50 p-5 flex items-center justify-center shadow-2xl">
            {settings.logo_url ? <img src={settings.logo_url} alt={settings.school_name} className="w-full h-full object-contain" /> : <BookOpen className="w-28 h-28 text-[var(--school-accent)]" />}
          </div>
        </div>
      </section>

      {settings.show_banner && settings.announcement_banner && (
        <div className="bg-amber-50 border-y border-amber-200 text-amber-950">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 text-sm"><Bell className="w-5 h-5 shrink-0" /><p>{settings.announcement_banner}</p></div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><Bell className="w-5 h-5 text-[var(--school-accent)]" /><h2 className="text-xl font-bold font-amiri text-[var(--school-primary)]">آخر الإعلانات</h2></div>
          {loading ? <p className="text-sm text-slate-400">جارٍ تحميل الإعلانات...</p> : announcements.length ? (
            <div className="divide-y divide-slate-100">{announcements.map(item => <article key={item.id} className="py-4 first:pt-0"><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{item.content}</p>{item.published_at && <time className="mt-2 block text-xs text-slate-400">{new Date(item.published_at).toLocaleDateString('ar-EG')}</time>}</article>)}</div>
          ) : <p className="text-sm text-slate-500">لا توجد إعلانات منشورة حالياً.</p>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><CalendarDays className="w-5 h-5 text-[var(--school-accent)]" /><h2 className="text-xl font-bold font-amiri text-[var(--school-primary)]">الأنشطة والمواعيد</h2></div>
          {loading ? <p className="text-sm text-slate-400">جارٍ تحميل المواعيد...</p> : events.length ? (
            <div className="divide-y divide-slate-100">{events.map(item => <article key={item.id} className="py-4 first:pt-0"><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.event_date).toLocaleString('ar-EG')} · {item.location}</p></article>)}</div>
          ) : <p className="text-sm text-slate-500">لا توجد أنشطة منشورة حالياً.</p>}
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <button onClick={onOpenResults} className="w-full bg-[var(--school-primary)] hover:bg-[#162a4d] text-white rounded-2xl p-6 flex items-center justify-between gap-4 transition-colors">
          <span><span className="block text-lg font-bold font-amiri">بوابة نتائج الطلاب</span><span className="block text-sm text-slate-300 mt-1">استعلم عن كشف الدرجات المعتمد باستخدام كود الطالب</span></span>
          <ArrowLeft className="w-6 h-6 text-[var(--school-accent)] shrink-0" />
        </button>
      </div>
    </div>
  );
};
