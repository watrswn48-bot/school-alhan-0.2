import React, { useState } from 'react';
import { AdminProfile } from '../../types/database';
import { dataService } from '../../lib/storage';
import { CopticCross, SchoolSeal } from '../CopticIcons';
import { AdminOverview } from './AdminOverview';
import { AcademicManagement } from './AcademicManagement';
import { StudentManagement } from './StudentManagement';
import { ExamManagement } from './ExamManagement';
import { ResultsManagement } from './ResultsManagement';
import { ExcelImportCenter } from './ExcelImportCenter';
import { SettingsAndDatabase } from './SettingsAndDatabase';
import {
  LayoutDashboard,
  Layers,
  Users,
  Award,
  CheckSquare,
  FileSpreadsheet,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  admin: AdminProfile;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

export type AdminTab = 
  | 'overview' 
  | 'academic' 
  | 'students' 
  | 'exams' 
  | 'results' 
  | 'excel' 
  | 'settings';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ admin, onLogout, onBackToWebsite }) => {
  const initialTab: AdminTab = admin.role === 'admin' ? 'students' : admin.role === 'content_manager' ? 'settings' : admin.role === 'teacher' || admin.role === 'results_manager' ? 'results' : 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'لوحة المؤشرات العامة', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'academic', label: 'الهيكل الأكاديمي والسنوات', icon: <Layers className="w-4 h-4" /> },
    { id: 'students', label: 'شؤون وسجل الطلاب', icon: <Users className="w-4 h-4" /> },
    { id: 'exams', label: 'الاختبارات والامتحانات', icon: <Award className="w-4 h-4" /> },
    { id: 'results', label: 'رصد واعتماد النتائج', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'excel', label: 'مركز استيراد الإكسل (Excel)', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات وقاعدة البيانات', icon: <Settings className="w-4 h-4" /> },
  ];

  const allowedTabs: AdminTab[] = admin.role === 'super_admin'
    ? ['overview', 'academic', 'students', 'exams', 'results', 'excel', 'settings']
    : admin.role === 'admin'
      ? ['students']
      : admin.role === 'content_manager'
        ? ['settings']
        : ['overview', 'results'];

  const visibleMenuItems = menuItems.filter(item => allowedTabs.includes(item.id));

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col no-print">
      {/* Admin Top Header */}
      <header className="bg-[#0c1a30] text-white border-b border-[#c5a059]/30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#c5a059] flex items-center justify-center overflow-hidden p-0.5">
              {dataService.getSettings().logo_url ? (
                <img src={dataService.getSettings().logo_url} alt="شعار المدرسة" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <CopticCross className="w-5 h-5 text-[#0c1a30]" />
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-amiri text-white leading-tight">
                لوحة تحكم الكنترول والإدارة
              </h1>
              <span className="text-[10px] text-[#c5a059] block">مدرسة تي اتشرومبي للألحان</span>
            </div>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-bold text-white">{admin.full_name}</span>
            <span className="text-[10px] text-emerald-400 font-mono">{admin.role}</span>
          </div>

          <button
            onClick={onBackToWebsite}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="hidden sm:inline">عرض الموقع العام</span>
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2 h-fit sticky top-24">
          <div className="pb-3 mb-2 border-b border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#c5a059]" />
            <span>أقسام لوحة الإدارة</span>
          </div>

          <nav className="space-y-1">
            {visibleMenuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#0c1a30] text-[#e0c588] shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0c1a30]'
                  }`}
                >
                  <span className={isActive ? 'text-[#c5a059]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div
              className="w-72 bg-white h-full p-4 space-y-2 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-sm text-[#0c1a30]">أقسام لوحة التحكم</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-slate-500">✕</button>
              </div>

              <nav className="space-y-1 pt-2">
                {visibleMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-[#0c1a30] text-[#e0c588]'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <AdminOverview
              onNavigateTab={(tab) => handleTabChange(tab as AdminTab)}
              admin={admin}
            />
          )}
          {activeTab === 'academic' && <AcademicManagement />}
          {activeTab === 'students' && (
            <StudentManagement onOpenExcelImport={() => handleTabChange('excel')} />
          )}
          {activeTab === 'exams' && <ExamManagement />}
          {activeTab === 'results' && (
            <ResultsManagement onOpenExcelImport={() => handleTabChange('excel')} />
          )}
          {activeTab === 'excel' && <ExcelImportCenter />}
          {activeTab === 'settings' && <SettingsAndDatabase adminRole={admin.role} />}
        </main>
      </div>
    </div>
  );
};
