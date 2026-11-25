import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Languages, LogIn } from 'lucide-react';
import { api, session } from '../lib/api';
import { useI18n } from '../i18n/context';
import { Button, ErrorNote, Field, Input } from '../ui/kit';

export default function Login({ onSignedIn }) {
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token: token } = await api.login(email.trim(), password);
      session.setToken(token);
      onSignedIn();
    } catch (err) {
      setError(err.status === 401 ? new Error(t('login.wrong')) : err.status === 429 ? new Error(t('login.tooMany')) : err);
      setBusy(false);
    }
  };

  const features = ['login.f1', 'login.f2', 'login.f3'];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel (wide screens) */}
      <aside className="on-navy relative hidden overflow-hidden bg-navy p-12 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/[0.06]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/[0.04]" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2"><img src="/logo.svg" alt="" className="h-full w-full" /></span>
          <p className="text-xl font-bold text-white">{t('app.name')}</p>
        </div>
        <div className="relative max-w-md">
          <p className="text-[2.5rem] font-extrabold leading-tight text-white">{t('login.heroTitle')}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {features.map((key) => (
              <li key={key} className="flex items-start gap-3 text-lg text-[#e9eef7]">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-white" aria-hidden="true" /> {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[#b9c4d9]">{t('login.footer')}</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex justify-end p-4">
          <button type="button" onClick={() => setLang(lang === 'en' ? 'am' : 'en')} lang={lang === 'en' ? 'am' : 'en'}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-line-soft bg-white px-4 font-semibold text-brand hover:border-brand hover:bg-tint">
            <Languages className="h-5 w-5" aria-hidden="true" />
            {lang === 'en' ? 'አማርኛ' : 'English'}
          </button>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy p-2.5 shadow-soft lg:hidden">
                <img src="/logo.svg" alt="" className="h-full w-full" />
              </span>
              <div>
                <h1 className="text-[2rem] font-extrabold leading-tight text-ink">{t('login.welcome')}</h1>
                <p className="mt-1 text-muted">{t('login.subtitle')}</p>
              </div>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-5 rounded-3xl border border-line-soft bg-white p-6 shadow-soft sm:p-8" noValidate>
              <Field label={t('login.email')} required>
                <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <div className="relative">
                <Field label={t('login.password')} required>
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-14" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  className="absolute bottom-0.5 right-1 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-tint hover:text-ink">
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              <ErrorNote error={error} />
              <Button type="submit" icon={LogIn} loading={busy} disabled={!email || !password} className="w-full">{t('login.submit')}</Button>
              <p className="text-center text-[0.95rem] text-muted">{t('login.forgot')}</p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
