import React, { useState } from 'react';
import { apiService, API_BASE_URL } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [tempUrl, setTempUrl] = useState(API_BASE_URL);

  const handleSaveUrl = (e) => {
    e.preventDefault();
    const trimmed = tempUrl.trim();
    if (trimmed) {
      localStorage.setItem('gym_api_base_url', trimmed);
      setApiUrl(trimmed);
      setIsEditingUrl(false);
      window.location.reload();
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.login(email.trim(), password);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const useDefaultCredentials = () => {
    setEmail('admin@example.com');
    setPassword('ChangeMe123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0d14]">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 sm:p-10 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light uppercase tracking-luxury text-white mb-2">
            Azyab <span className="font-bold">Wellness</span>
          </h1>
          <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] opacity-80">
            Gym Management Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-white/20"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-luxury hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-white/5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col items-center gap-4">
          <button
            onClick={useDefaultCredentials}
            type="button"
            className="text-[9px] uppercase tracking-luxury text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 rounded-full hover:scale-105"
          >
            Use Demo Admin Credentials
          </button>

          <div className="text-[10px] text-white/40 w-full flex flex-col items-center gap-1.5 mt-2">
            {isEditingUrl ? (
              <form onSubmit={handleSaveUrl} className="flex gap-2 items-center justify-center w-full max-w-[280px]">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[9px] text-white focus:outline-none focus:border-emerald-500/50 w-full font-mono text-center"
                  placeholder="API Base URL"
                  required
                />
                <div className="flex gap-1.5">
                  <button type="submit" className="text-emerald-400 hover:underline font-bold uppercase tracking-wider text-[8px]">Save</button>
                  <button type="button" onClick={() => setIsEditingUrl(false)} className="text-white/60 hover:underline font-bold uppercase tracking-wider text-[8px]">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>API: <span className="font-mono text-white/60">{apiUrl}</span></span>
                <button
                  type="button"
                  onClick={() => {
                    setTempUrl(apiUrl);
                    setIsEditingUrl(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors underline text-[8px] uppercase tracking-wider font-bold"
                >
                  Configure
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
