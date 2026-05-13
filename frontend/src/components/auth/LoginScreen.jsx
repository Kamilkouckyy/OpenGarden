import { useState } from 'react';
import { usersApi } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import './LoginScreen.css';

export default function LoginScreen({ onLogin }) {
  const { t } = useLanguage();

  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /*const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const users = await usersApi.list();
      const found = users.find((u) => u.email === email.trim());
      if (!found) { setError(t('auth.userNotFound')); return; }
      onLogin({ id: found.id, name: found.name, role: found.role });
    } catch {
      setError(t('auth.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };*/
    const handleLogin = async (e) => {
   e.preventDefault();
    setError('');
    setLoading(true);
    try {
     const result = await usersApi.login(email.trim(), password);
     onLogin({ id: result.id, name: result.name, role: result.role });
    } catch {
     setError(t('auth.connectionFailed'));
    } finally {
     setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await usersApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      onLogin({ id: created.id, name: created.name, role: created.role });
    } catch (err) {
      setError(err.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">🌱 OpenGarden</div>
        <div className="login-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
            {t('auth.loginTab')}
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
            {t('auth.registerTab')}
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <label>{t('auth.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth.emailPlaceholder')} />
            <label>{t('auth.password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t('auth.passwordPlaceholder')} />
            {error && <div className="login-error">{error}</div>}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? t('auth.loginLoading') : t('auth.loginSubmit')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <label>{t('auth.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('auth.namePlaceholder')} />
            <label>{t('auth.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth.registerEmailPlaceholder')} />
            <label>{t('auth.password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t('auth.passwordPlaceholder')} />
            <label>{t('auth.role')}</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="login-select">
              <option value="member">{t('auth.memberRole')} (member)</option>
              <option value="admin">{t('auth.adminRole')}</option>
            </select>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? t('auth.registerLoading') : t('auth.registerSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}