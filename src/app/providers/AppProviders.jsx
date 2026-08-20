import { ThemeProvider } from './ThemeProvider.jsx';
import { ToastProvider } from './ToastProvider.jsx';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
