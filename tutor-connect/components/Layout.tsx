import React from 'react';
import { ViewState, UserSession, NavItem } from '@/types';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
  user: UserSession;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children, user }) => {
  const isPublic = ['landing', 'login', 'register'].includes(currentView);

  const studentNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'search', label: 'Find Tutors', icon: 'search' },
    { id: 'classroom', label: 'Classroom', icon: 'video_camera_front' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  ];

  const staffNavItems: NavItem[] = [
    { id: 'staff', label: 'Verification', icon: 'verified_user' },
  ];

  const navItems = user.role === 'STAFF' ? staffNavItems : studentNavItems;

  if (isPublic) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Public Header */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onNavigate('landing')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="text-xl font-bold tracking-tight">Tutor Connect</span>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <button onClick={() => onNavigate('landing')} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Home</button>
                <button onClick={() => onNavigate('search')} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Find Tutor</button>
              </nav>
              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-200">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-sm font-bold text-slate-700 hover:text-primary transition-colors px-4 py-2"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all active:scale-95"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }

  // App Layout
  return (
    <div className="flex h-screen w-full bg-background-light overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 h-full shrink-0">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="bg-primary/10 rounded-lg p-2 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">school</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Tutor Connect</h1>
        </div>

        {/* User Mini Profile in Sidebar */}
        <div className="px-4 pb-6 border-b border-gray-100 mx-4 mb-4">
          <div className="flex gap-3 items-center">
            <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 shadow-sm" style={{ backgroundImage: `url('${user.avatar}')` }}></div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-sm font-bold truncate">{user.fullName || user.email}</h2>
              <p className="text-xs text-text-sub capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left group ${currentView === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-text-sub hover:bg-gray-50 text-gray-500'
                }`}
            >
              <span className={`material-symbols-outlined ${currentView === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 w-full px-4 py-3 text-text-sub hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Overlay */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">school</span>
            <span className="font-bold text-lg">Tutor Connect</span>
          </div>
          <button className="text-gray-600">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};