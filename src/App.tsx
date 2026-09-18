import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirebaseConnection } from './firebase';
import LoginForm from './components/LoginForm';
import { Navbar, ActiveTab } from './components/Navbar';
import { VesselsModule } from './components/VesselsModule';
import { VoyagesModule } from './components/VoyagesModule';
import { CargoModule } from './components/CargoModule';
import { CrewModule } from './components/CrewModule';
import { ToastContainer } from './components/Toast';
import { 
  subscribeVessels, 
  subscribeVoyages, 
  subscribeCargo, 
  subscribeCrew, 
  seedInitialMaritimeData 
} from './services/firestoreService';
import { Vessel, Voyage, Cargo, CrewMember, FeedbackToast } from './types';
import { Ship, Loader2, RefreshCw, Anchor } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vessels');

  // Real-time Firestore state (Single Source of Truth)
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Informative feedback toast queue
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const newToast: FeedbackToast = { id, type, title, message, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to Firebase Auth state (no localStorage!)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    // Test Firestore server connection on initial load
    testFirebaseConnection();

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to live Firestore collections when authenticated
  useEffect(() => {
    if (!currentUser) {
      setVessels([]);
      setVoyages([]);
      setCargos([]);
      setCrew([]);
      return;
    }

    const unsubVessels = subscribeVessels(
      (data) => setVessels(data),
      (err) => addToast('error', 'Gagal Sinkronisasi Armada', err.message)
    );

    const unsubVoyages = subscribeVoyages(
      (data) => setVoyages(data),
      (err) => addToast('error', 'Gagal Sinkronisasi Jadwal', err.message)
    );

    const unsubCargo = subscribeCargo(
      (data) => setCargos(data),
      (err) => addToast('error', 'Gagal Sinkronisasi Kargo', err.message)
    );

    const unsubCrew = subscribeCrew(
      (data) => setCrew(data),
      (err) => addToast('error', 'Gagal Sinkronisasi Awak', err.message)
    );

    return () => {
      unsubVessels();
      unsubVoyages();
      unsubCargo();
      unsubCrew();
    };
  }, [currentUser, addToast]);

  const handleSeedInitialFleet = async () => {
    setIsSeeding(true);
    try {
      await seedInitialMaritimeData();
      addToast(
        'success',
        'Data Master Dimuat',
        'Data armada kapal, jadwal rute, manifes kargo, dan awak kapal berhasil disimpan ke Firestore.'
      );
    } catch (err) {
      const error = err as Error;
      addToast('info', 'Informasi Inisialisasi', error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // 1. Loading Authentication state
  if (authLoading) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce">
          <Ship className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Menghubungkan ke Sistem Pelayaran...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Memverifikasi sesi aman Firestore</p>
      </div>
    );
  }

  // 2. Not logged in: Default View is Login Form (as strictly required)
  if (!currentUser) {
    return (
      <>
        <LoginForm onNotify={addToast} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 3. Logged in: Main Maritime Operational Dashboard
  return (
    <div id="maritime-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header & Global Navigation */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vesselsCount={vessels.length}
        voyagesCount={voyages.length}
        cargoCount={cargos.length}
        crewCount={crew.length}
        onSeedData={handleSeedInitialFleet}
        isSeeding={isSeeding}
        onNotify={addToast}
      />

      {/* Main Content Area */}
      <main id="main-content-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome & Live Fleet Status Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Pusat Kendali Operasi Maritim
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full font-medium">
                  Real-time Sync
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
                Monitoring & Manajemen Armada Kapal Niaga
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Database Firestore terintegrasi penuh sebagai sumber tunggal kebenaran untuk inventaris kapal, rute jadwal, manifes kargo, dan penugasan pelaut.
              </p>
            </div>

            {/* Quick action: Seed data button if fleet is empty */}
            {vessels.length === 0 && (
              <button
                id="banner-seed-btn"
                type="button"
                onClick={handleSeedInitialFleet}
                disabled={isSeeding}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                {isSeeding ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Anchor className="w-4 h-4" />
                )}
                <span>Muat Data Demo Armada</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Modules */}
        {activeTab === 'vessels' && (
          <VesselsModule vessels={vessels} onNotify={addToast} />
        )}

        {activeTab === 'voyages' && (
          <VoyagesModule voyages={voyages} vessels={vessels} onNotify={addToast} />
        )}

        {activeTab === 'cargo' && (
          <CargoModule
            cargos={cargos}
            vessels={vessels}
            voyages={voyages}
            onNotify={addToast}
          />
        )}

        {activeTab === 'crew' && (
          <CrewModule crews={crew} vessels={vessels} onNotify={addToast} />
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">YY Samudra Logs</span>
            <span>&bull;</span>
            <span>Enterprise Maritime Fleet Management</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Powered by Google Cloud Firestore</span>
            <span>&bull;</span>
            <span>No LocalStorage (Real DB Only)</span>
          </div>
        </div>
      </footer>

      {/* Real-time Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
