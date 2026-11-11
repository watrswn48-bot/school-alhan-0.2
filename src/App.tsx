import React, { useState, useEffect } from 'react';
import { Navbar, PageTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentResults } from './components/PublicPages/StudentResults';
import { AdminLayout } from './components/Admin/AdminLayout';
import { AdminLogin } from './components/Admin/AdminLogin';
import { dataService } from './lib/storage';
import { AdminProfile } from './types/database';

export default function App() {
  const [currentTab, setCurrentTab] = useState<PageTab>('results');
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(dataService.getActiveAdmin());

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  const handleAdminLogout = () => {
    dataService.setActiveAdmin(null);
    setActiveAdmin(null);
    setCurrentTab('results');
  };

  const showPublicShell = currentTab !== 'admin' || !activeAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-900 selection:bg-[#c5a059]/30 selection:text-[#0c1a30] font-sans">
      {/* Public Navbar */}
      {showPublicShell && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isAdminLoggedIn={Boolean(activeAdmin)}
        />
      )}

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'results' && <StudentResults />}

        {currentTab === 'admin' && (
          activeAdmin ? (
            <AdminLayout
              admin={activeAdmin}
              onLogout={handleAdminLogout}
              onBackToWebsite={() => setCurrentTab('results')}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={(admin) => setActiveAdmin(admin)}
              onBackToWebsite={() => setCurrentTab('results')}
            />
          )
        )}
      </main>

      {/* Public Footer */}
      {showPublicShell && <Footer onSelectTab={setCurrentTab} />}
    </div>
  );
}
