import { useState } from 'react';
import { usersApi } from '../../services/api';
import './LoginScreen.css';

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const users = await usersApi.list();
      const found = users.find((u) => u.email === email.trim());
      if (!found) { setError('Uživatel s tímto e-mailem neexistuje.'); return; }
      onLogin({ id: found.id, name: found.name, role: found.role });
    } catch {
      setError('Nepodařilo se připojit k serveru.');
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
      setError(err.message || 'Registrace se nezdařila.');
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
            Přihlásit se
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
            Registrovat
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vas@email.cz" />
            {error && <div className="login-error">{error}</div>}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <label>Jméno</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jana Nováková" />
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jana@email.cz" />
            <label>Heslo</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="login-select">
              <option value="member">Člen (member)</option>
              <option value="admin">Admin</option>
            </select>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Registruji…' : 'Vytvořit účet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
