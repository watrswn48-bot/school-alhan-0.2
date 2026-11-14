import React, { useState, useEffect } from 'react';
import { Navbar, PageTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentResults } from './components/PublicPages/StudentResults';
import { HomePage } from './components/PublicPages/HomePage';
import { AdminLayout } from './components/Admin/AdminLayout';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminBootstrap } from './components/Admin/AdminBootstrap';
import { AdminProfile } from './types/database';
import { getSupabaseClient } from './lib/supabase';
import { dataService } from './lib/storage';
import { useSchoolSettings } from './lib/schoolSettingsCache';

export default function App() {
  useSchoolSettings();
  const [currentTab, setCurrentTab] = useState<PageTab>(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path.endsWith('/admin/setup')) return 'bootstrap';
    return path.endsWith('/admin') ? 'admin' : 'home';
  });
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const targetPath = currentTab === 'admin' ? `${basePath}admin` : currentTab === 'bootstrap' ? `${basePath}admin/setup` : basePath;
    if (window.location.pathname !== targetPath) window.history.replaceState({}, '', targetPath);
  }, [currentTab]);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    const supabase = getSupabaseClient();
    if (!supabase) { setAuthLoading(false); return; }
    let mounted = true;
    const loadAdmin = async (userId?: string) => {
      if (!userId) { if (mounted) setActiveAdmin(null); return; }
      const { data, error } = await supabase.from('admin_profiles')
        .select('id,user_id,full_name,email,role,is_active,created_at,admin_permissions(*)')
        .eq('user_id', userId).eq('is_active', true).maybeSingle();
      if (!error && data) {
        await dataService.initialize();
        dataService.setActiveAdmin(data as AdminProfile);
        if (mounted) setActiveAdmin(data as AdminProfile);
      } else if (mounted) {
        dataService.clearSession();
        setActiveAdmin(null);
      }
    };
    supabase.auth.getSession().then(async ({ data }) => {
      await loadAdmin(data.session?.user.id);
      if (mounted) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void loadAdmin(session?.user.id); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const handleAdminLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    dataService.clearSession();
    setActiveAdmin(null);
    setCurrentTab('home');
  };

  const showPublicShell = currentTab !== 'bootstrap' && (currentTab !== 'admin' || !activeAdmin);
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-900 selection:bg-[var(--school-accent)]/30 selection:text-[var(--school-primary)] font-sans">
      {showPublicShell && <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />}
      <main className="flex-1 flex flex-col">
        {currentTab === 'home' && <HomePage onOpenResults={() => setCurrentTab('results')} />}
        {currentTab === 'results' && <StudentResults />}
        {currentTab === 'bootstrap' && (
          <AdminBootstrap onBackToLogin={() => setCurrentTab('admin')} onBackToWebsite={() => setCurrentTab('home')} />
        )}
        {currentTab === 'admin' && (
          authLoading ? <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">جارٍ التحقق من جلسة الإدارة...</div>
          : activeAdmin ? <AdminLayout admin={activeAdmin} onLogout={handleAdminLogout} onBackToWebsite={() => setCurrentTab('home')} />
          : <AdminLogin onLoginSuccess={setActiveAdmin} onBackToWebsite={() => setCurrentTab('home')} />
        )}
      </main>
      {showPublicShell && <Footer onSelectTab={setCurrentTab} />}
    </div>
  );
}
