import { render, screen } from '@testing-library/react';
import LoginScreen from './components/auth/LoginScreen';

test('renders login screen', () => {
  render(<LoginScreen onLogin={() => {}} />);
  expect(screen.getByText(/OpenGarden/i)).toBeInTheDocument();
});
