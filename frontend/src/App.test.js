import { render, screen } from '@testing-library/react';
import LoginScreen from './components/auth/LoginScreen';
import { LanguageProvider } from './i18n/LanguageContext';

test('renders login screen', () => {
  render(
    <LanguageProvider>
      <LoginScreen onLogin={() => {}} />
    </LanguageProvider>
  );
  expect(screen.getByText(/OpenGarden/i)).toBeInTheDocument();
});
