import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OrynLogo from '../components/common/OrynLogo';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  BrainCircuit, 
  BookOpenCheck, 
  Sparkles, 
  FileText, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X, 
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  KeyRound
} from 'lucide-react';

export default function AppLayout() {
  const { currentUser, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Incident', path: '/new-incident', icon: AlertOctagon, badge: '+' },
    { name: 'Memory', path: '/memory', icon: BrainCircuit },
    { name: 'Runbooks', path: '/runbooks', icon: BookOpenCheck },
    { name: 'Reflection', path: '/reflection', icon: Sparkles },
    { name: 'Postmortems', path: '/postmortems', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Sign In / Account', path: '/login', icon: KeyRound },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaletteSelect = (path) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/20 z-50 flex-col justify-between p-4 shadow-lg">
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <NavLink to="/dashboard" className="px-1 py-1 block">
            <OrynLogo />
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(79,70,229,0.35)]' 
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-mono text-xs font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20">
          {/* Theme Switcher Pill */}
          <div className="flex items-center justify-between p-1 rounded-lg bg-surface-container border border-outline-variant/20">
            <button
              onClick={() => toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-all ${
                theme === 'light' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-all ${
                theme === 'dark' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>

          {/* Role switcher toggle (Admin / Engineer Demo) */}
          <div className="flex items-center justify-between px-2 py-1 rounded bg-surface-container-lowest/60 border border-outline-variant/20 text-xs">
            <span className="text-on-surface-variant font-mono text-[11px]">ROLE:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => demoLogin('admin')}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold uppercase ${
                  currentUser?.role === 'admin' 
                    ? 'bg-primary text-on-primary' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => demoLogin('engineer')}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold uppercase ${
                  currentUser?.role === 'engineer' 
                    ? 'bg-secondary text-on-secondary' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Engineer
              </button>
            </div>
          </div>

          {/* User Card */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20">
            <NavLink to="/profile" className="flex items-center gap-2.5 overflow-hidden flex-1" title="View Profile">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold text-xs">
                  {currentUser?.displayName?.slice(0, 2).toUpperCase() || 'AR'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-surface-container-low"></span>
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-on-surface truncate">
                  {currentUser?.displayName || 'Alex Rivera'}
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant truncate">
                  {currentUser?.title || 'SRE Lead'}
                </span>
              </div>
            </NavLink>

            <div className="flex items-center gap-0.5">
              <NavLink
                to="/login"
                title="Switch Account / Sign In"
                className="p-1.5 rounded-lg text-primary hover:bg-primary-container/30 transition-colors flex-shrink-0"
              >
                <KeyRound className="w-4 h-4" />
              </NavLink>
              <button
                onClick={handleLogout}
                title="Sign Out & Return to Login"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex-shrink-0"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-40 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 flex items-center justify-between px-4">
        <OrynLogo />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 rounded-lg bg-surface-container text-on-surface-variant"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 rounded-lg bg-surface-container text-on-surface"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-xl z-50 p-6 flex flex-col justify-between">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium
                    ${isActive 
                      ? 'bg-primary-container text-on-primary-container font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-xs font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dark Mode</span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-surface-container text-sm font-medium flex items-center gap-2"
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme.toUpperCase()}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In / Switch Account</span>
              </NavLink>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 rounded-xl bg-error-container text-on-error-container font-medium flex items-center justify-center gap-2 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP TOP HEADER */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        <header className="sticky top-0 z-40 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm hidden lg:flex items-center justify-between px-8">
          {/* Left: Quick Search Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2.5 bg-surface-container px-3.5 py-1.5 rounded-lg w-80 text-on-surface-variant hover:border-primary/50 border border-transparent transition-all cursor-pointer text-left"
              type="button"
            >
              <Search className="w-4 h-4 text-on-surface-variant" />
              <span className="text-xs text-on-surface-variant flex-1 truncate">
                Search incidents, runbooks, memories...
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] text-on-surface-variant border border-outline-variant/30">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Engine Status & Telemetry Indicators */}
          <div className="flex items-center gap-4">
            {/* Live Memory Engine Pulsing Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <span className="font-mono text-xs font-medium text-tertiary">
                Memory Engine Active
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                type="button"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse"></span>
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-container border border-outline-variant/30 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                    <span className="font-semibold text-sm">Fleet Telemetry Alerts</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-bold">
                      2 ACTIVE
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="p-2.5 rounded-lg bg-surface-container-high/60 border border-error/30 text-xs">
                      <div className="flex items-center gap-1.5 text-error font-semibold mb-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>SEV-1: PostgreSQL Pool</span>
                      </div>
                      <p className="text-on-surface-variant text-[11px]">
                        PgBouncer active client pool exceeded 98% threshold on checkout cluster.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-container-high/60 border border-primary/30 text-xs">
                      <div className="flex items-center gap-1.5 text-primary font-semibold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Autonomous Memory Match</span>
                      </div>
                      <p className="text-on-surface-variant text-[11px]">
                        96% confidence match for incident #4092 with playbook #3821.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise Tag & User Pill & Login Switch Button */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-outline-variant/20">
              <NavLink
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-all hover:border-primary/40 shadow-sm"
                title="Go to Login / Account Portal"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Login / Switch</span>
              </NavLink>
              <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono text-[10px] font-bold tracking-wider uppercase">
                {currentUser?.role === 'admin' ? 'ADMIN' : 'ENGINEER'}
              </span>
              <NavLink to="/profile" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold shadow-sm hover:scale-105 transition-transform" title="View Profile">
                {currentUser?.displayName?.slice(0, 1) || 'A'}
              </NavLink>
            </div>
          </div>
        </header>

        {/* MAIN OUTLET CONTENT */}
        <main className="flex-1 w-full bg-background p-4 sm:p-6 lg:p-8 max-w-[1780px] mx-auto">
          <Outlet />
        </main>
      </div>

      {/* GLOBAL COMMAND PALETTE (CMD+K) MODAL */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-surface-container border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20 bg-surface-container-low">
              <Search className="w-5 h-5 text-primary flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search incidents, runbooks, memories, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant"
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-1 text-sm">
              <div className="px-3 py-1 text-[11px] font-mono uppercase text-on-surface-variant tracking-wider">
                Quick Navigation
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handlePaletteSelect(item.path)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
                      <span>{item.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}

              <div className="px-3 py-1 text-[11px] font-mono uppercase text-on-surface-variant tracking-wider mt-2">
                Rapid SRE Commands
              </div>
              <button
                onClick={() => handlePaletteSelect('/new-incident')}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-high text-left group"
              >
                <div className="flex items-center gap-3">
                  <AlertOctagon className="w-4 h-4 text-error" />
                  <span>Declare SEV-1 Outage Incident</span>
                </div>
                <span className="text-xs font-mono text-error font-medium">TRIGGER</span>
              </button>
              <button
                onClick={() => handlePaletteSelect('/memory')}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-high text-left group"
              >
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-4 h-4 text-tertiary" />
                  <span>Search Knowledge & Outage Signatures</span>
                </div>
                <span className="text-xs font-mono text-tertiary font-medium">MEMORY</span>
              </button>
              <button
                onClick={() => handlePaletteSelect('/reflection')}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-high text-left group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <span>Executive MTTR & Deployment Analytics</span>
                </div>
                <span className="text-xs font-mono text-secondary font-medium">AI INSIGHTS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant/20 z-40 flex items-center justify-around px-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Deck</span>
        </NavLink>
        <NavLink
          to="/new-incident"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-error font-bold' : 'text-on-surface-variant'}`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span>Report</span>
        </NavLink>
        <NavLink
          to="/memory"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-tertiary font-bold' : 'text-on-surface-variant'}`}
        >
          <BrainCircuit className="w-5 h-5" />
          <span>Memory</span>
        </NavLink>
        <NavLink
          to="/runbooks"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}
        >
          <BookOpenCheck className="w-5 h-5" />
          <span>Runbooks</span>
        </NavLink>
        <NavLink
          to="/reflection"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Reflect</span>
        </NavLink>
      </nav>
    </div>
  );
}
