import { useState } from 'react';
import { authClient } from '../../services/authClient';
import { authApi } from '../../services/api';
import { setAccessToken } from '../../services/authStorage';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUser } from '../../context/UserContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email.trim(), password);
      if (!result?.accessToken) {
        throw new Error(t('auth.connectionFailed'));
      }
      setAccessToken(result.accessToken);
      await refreshUser();
    } catch (err) {
      setError(err.message || t('auth.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin,
      });

      if (result?.error) {
        setError(result.error.message || t('auth.connectionFailed'));
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || t('auth.connectionFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">🌱 OpenGarden</div>
        <p className="login-hint">
          Přihlaste se e-mailem a heslem nebo přes Google. Role administrátora se nastavuje pouze serverově.
        </p>

        <form onSubmit={handleEmailLogin} className="login-form">
          <label>{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
          />
          <label>{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={loading} className="login-submit">
            {loading ? t('auth.loginLoading') : t('auth.loginSubmit')}
          </button>
        </form>

        <div className="login-divider">
          <span>nebo</span>
        </div>

        <div className="login-form">
          <button
            type="button"
            disabled={loading}
            className="login-submit login-submit--secondary"
            onClick={() => handleSocialLogin('google')}
          >
            {loading ? 'Přesměrovávám…' : 'Pokračovat přes Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
