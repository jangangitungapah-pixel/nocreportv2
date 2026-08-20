import { AuthProvider } from './AuthProvider.jsx';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ToastProvider } from './ToastProvider.jsx';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
