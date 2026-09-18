import React from 'react';
import { logoutUser } from '../services/authService';
import { AuthUser } from '../types';
import { 
  Ship, 
  Compass, 
  Package, 
  Users, 
  LogOut, 
  Database,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export type ActiveTab = 'vessels' | 'voyages' | 'cargo' | 'crew';

interface NavbarProps {
  user: AuthUser;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  vesselsCount: number;
  voyagesCount: number;
  cargoCount: number;
  crewCount: number;
  onSeedData: () => void;
  isSeeding: boolean;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  vesselsCount,
  voyagesCount,
  cargoCount,
  crewCount,
  onSeedData,
  isSeeding,
  onNotify
}) => {
  const handleSignOut = async () => {
    try {
      await logoutUser();
      onNotify('info', 'Sesi Berakhir', 'Anda telah berhasil keluar dari sistem.');
    } catch (err) {
      console.error("Sign out error:", err);
      onNotify('error', 'Gagal Keluar', 'Terjadi kendala saat mengakhiri sesi.');
    }
  };

  const navItems = [
    {
      id: 'vessels' as ActiveTab,
      label: 'Armada Kapal',
      icon: Ship,
      count: vesselsCount,
    },
    {
      id: 'voyages' as ActiveTab,
      label: 'Jadwal & Trayek',
      icon: Compass,
      count: voyagesCount,
    },
    {
      id: 'cargo' as ActiveTab,
      label: 'Manifes Kargo',
      icon: Package,
      count: cargoCount,
    },
    {
      id: 'crew' as ActiveTab,
      label: 'Awak & Personil',
      icon: Users,
      count: crewCount,
    },
  ];

  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  YY SAMUDRA LOGS
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Manajemen Operasi Pelayaran Niaga & Kargo
              </p>
            </div>
          </div>

          {/* Right Actions: Seed demo data, Database badge, User & Sign Out */}
          <div className="flex items-center gap-3">
            {vesselsCount === 0 && (
              <button
                id="seed-initial-fleet-btn"
                type="button"
                onClick={onSeedData}
                disabled={isSeeding}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                title="Muat data master awal ke Firestore"
              >
                {isSeeding ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>Inisialisasi Data Armada</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Real DB: Firestore Single Truth</span>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                  {user.displayName || user.email}
                </div>
                <div className="text-[10px] text-blue-700 font-semibold tracking-wide">
                  {user.role}
                </div>
              </div>
              
              <button
                id="header-signout-btn"
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="module-nav-tabs" className="flex space-x-1 sm:space-x-4 overflow-x-auto border-t border-slate-100 py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-700/80 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
