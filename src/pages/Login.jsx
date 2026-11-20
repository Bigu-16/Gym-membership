import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { api, session } from '../lib/api';
import { useI18n } from '../i18n/context';
import { Button, ErrorNote, Field, Input } from '../ui/kit';

export default function Login({ onSignedIn }) {
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
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
    <div className="flex min-h-screen flex-col bg-navy">
      <div className="on-navy flex justify-end p-4">
        <button type="button" onClick={() => setLang(lang === 'en' ? 'am' : 'en')} lang={lang === 'en' ? 'am' : 'en'}
          className="min-h-[44px] rounded-lg border-2 border-[#b9c4d9] px-4 font-semibold text-white hover:bg-white/10">
          {lang === 'en' ? 'አማርኛ' : 'English'}
        </button>
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold text-ink">{t('app.name')}</h1>
              <p className="text-muted">{t('login.subtitle')}</p>
            </div>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label={t('login.email')} required>
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t('login.password')} required>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <ErrorNote error={error} />
            <Button type="submit" icon={LogIn} loading={busy} disabled={!email || !password}>{t('login.submit')}</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
