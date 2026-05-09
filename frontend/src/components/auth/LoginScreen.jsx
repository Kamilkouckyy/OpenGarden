import { useState } from 'react';
import { authClient } from '../../services/authClient';
import './LoginScreen.css';

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin,
      });

      if (result?.error) {
        setError(result.error.message || 'Přihlášení se nezdařilo.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Přihlášení se nezdařilo.');
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">🌱 OpenGarden</div>
        <p className="login-hint">
          Přihlaste se školním nebo komunitním účtem. Role administrátora se nastavuje pouze serverově.
        </p>

        <div className="login-form">
          {error && <div className="login-error">{error}</div>}
          <button
            type="button"
            disabled={loading}
            className="login-submit"
            onClick={() => handleSocialLogin('google')}
          >
            {loading ? 'Přesměrovávám…' : 'Pokračovat přes Google'}
          </button>
          <button
            type="button"
            disabled={loading}
            className="login-submit login-submit--secondary"
            onClick={() => handleSocialLogin('microsoft')}
          >
            {loading ? 'Přesměrovávám…' : 'Pokračovat přes Microsoft'}
          </button>
        </div>
      </div>
    </div>
  );
}