import { useEffect, useState } from 'react';
import { apiService, API_BASE_URL } from '../services/api';

const Login = ({ onLoginSuccess, notice = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // Free hosting puts the server to sleep; explain a slow first sign-in instead of looking stuck.
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [loading]);
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
      const offline = err.name === 'TypeError' || /fetch|NetworkError/i.test(err.message || '');
      setError(offline
        // Also what the browser reports when the API rejects this site's address (CORS).
        ? `Cannot reach the server from ${window.location.origin}. Check the internet connection, the API address below, and that the API allows this site (CORS_ORIGINS).`
        : err.message || 'Invalid email or password');
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

      <div className="w-full max-w-md glass-card p-8 sm:p-10 border border-white/10 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center bg-[#0d0f14] border border-white/15">
            <img src="/nt-logo.svg" alt="N & T Taekwondo & Karate Center logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">
            N & T <span className="font-bold text-orange-300">Center</span>
          </h1>
          <p className="text-xs text-slate-300">
            Taekwondo & Karate Management Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {notice && !error && (
          <p role="status" className="mb-4 text-xs text-center rounded-2xl p-3 bg-amber-500/10 text-amber-200 border border-amber-500/20">{notice}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-slate-300 block ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-slate-400"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 block ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-white text-black text-xs font-bold transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <span aria-hidden="true" className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
          {slow && (
            <p role="status" className="text-xs text-center text-slate-300">
              Waking up the server… the first sign-in of the day can take up to a minute.
            </p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col items-center gap-4">
          {!import.meta.env.PROD && (
            <button
              onClick={useDefaultCredentials}
              type="button"
              className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 rounded-full"
            >
              Use Demo Admin Credentials
            </button>
          )}

          <div className="text-xs text-slate-300 w-full flex flex-col items-center gap-1.5 mt-2">
            {isEditingUrl ? (
              <form onSubmit={handleSaveUrl} className="flex gap-2 items-center justify-center w-full max-w-[280px]">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 w-full font-mono text-center"
                  placeholder="API Base URL"
                  required
                />
                <div className="flex gap-1.5">
                  <button type="submit" className="text-emerald-300 hover:underline font-bold text-xs">Save</button>
                  <button type="button" onClick={() => setIsEditingUrl(false)} className="text-slate-200 hover:underline font-bold text-xs">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>API: <span className="font-mono text-slate-200">{apiUrl}</span></span>
                <button
                  type="button"
                  onClick={() => {
                    setTempUrl(apiUrl);
                    setIsEditingUrl(true);
                  }}
                  className="text-emerald-300 hover:text-emerald-200 transition-colors underline text-xs font-bold"
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
