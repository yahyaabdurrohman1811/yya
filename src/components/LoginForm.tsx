import { useState } from 'react';
import { loginUser } from '../services/authService';
import { Ship, Anchor, ShieldCheck, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export default function LoginForm({ onNotify }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (targetIdentifier = identifier, targetPassword = password, roleLabel?: string) => {
    setErrorMessage('');
    
    const trimmedIdentifier = targetIdentifier.trim();
    if (!trimmedIdentifier) {
      setErrorMessage('Silakan masukkan username atau email admin.');
      return;
    }

    if (!targetPassword) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(trimmedIdentifier, targetPassword, roleLabel);
      onNotify(
        'success',
        'Login Berhasil',
        `Selamat datang di Portal Operasional YY Samudra Logs, ${user.displayName}.`
      );
    } catch (err: any) {
      console.error("Login attempt error:", err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat masuk. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const executeQuickDemo = async (demoEmail: string, demoPass: string, roleName: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    await handleLogin(demoEmail, demoPass, roleName);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Decorative top maritime bar */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-700 via-sky-600 to-teal-500" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-50">
            <Ship className="w-8 h-8" />
          </div>
        </div>
        <h2 id="login-heading" className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">
          YY Samudra Logs
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-600 font-medium">
          Sistem Operasional Manajemen Perusahaan Pelayaran
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {/* Real Firebase Database Badge */}
          <div className="mb-6 flex items-center justify-between p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real Firestore Database Active</span>
            </div>
            <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-700 font-semibold">
              Live Cloud
            </span>
          </div>

          {errorMessage && (
            <div id="login-error-alert" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">!</div>
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            id="admin-login-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="login-identifier-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Username / Email Admin
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="login-identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin atau admin@yysamudralogs.co.id"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Section */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Quick Demo Login (1-Klik Langsung Masuk)</span>
            </div>

            <div className="space-y-2">
              {/* Quick Login 1: Super Admin */}
              <button
                id="quick-login-super-admin"
                type="button"
                disabled={loading}
                onClick={() =>
                  executeQuickDemo(
                    'admin@yysamudralogs.co.id',
                    'admin123',
                    'Super Administrator'
                  )
                }
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    SA
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                      <span>Super Admin YY Logs</span>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      admin@yysamudralogs.co.id (Pass: admin123)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 group-hover:border-blue-300 shadow-xs">
                  Masuk Cepat
                </span>
              </button>

              {/* Quick Login 2: Direktur Operasi */}
              <button
                id="quick-login-director"
                type="button"
                disabled={loading}
                onClick={() =>
                  executeQuickDemo(
                    'direktur.ops@yysamudralogs.co.id',
                    'NakhodaBahari2026!',
                    'Direktur Operasi'
                  )
                }
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    DO
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                      Direktur Operasional Pelayaran
                    </div>
                    <div className="text-[11px] text-slate-500">
                      direktur.ops@yysamudralogs.co.id
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 group-hover:border-blue-300 shadow-xs">
                  Masuk Cepat
                </span>
              </button>

              {/* Quick Login 3: Kepala Armada */}
              <button
                id="quick-login-fleet-manager"
                type="button"
                disabled={loading}
                onClick={() =>
                  executeQuickDemo(
                    'armada.logistik@yysamudralogs.co.id',
                    'BahariOps2026!',
                    'Kepala Armada & Logistik'
                  )
                }
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                    AL
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                      Kepala Armada & Logistik
                    </div>
                    <div className="text-[11px] text-slate-500">
                      armada.logistik@yysamudralogs.co.id
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 group-hover:border-teal-300 shadow-xs">
                  Masuk Cepat
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <Anchor className="w-3.5 h-3.5 text-blue-600" />
          <span>Sistem Manajemen Pelayaran Nasional Terpadu &bull; Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
}
