import { useState } from 'react';
import { Eye, EyeOff, Languages, LogIn } from 'lucide-react';
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex justify-end p-4">
        <button type="button" onClick={() => setLang(lang === 'en' ? 'am' : 'en')} lang={lang === 'en' ? 'am' : 'en'}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-semibold text-brand hover:bg-tint">
          <Languages className="h-5 w-5" aria-hidden="true" />
          {lang === 'en' ? 'አማርኛ' : 'English'}
        </button>
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <img src="/logo.svg" alt="" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold text-ink">{t('app.name')}</h1>
              <p className="mt-1 text-muted">{t('login.subtitle')}</p>
            </div>
          </div>
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
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
  );
}
