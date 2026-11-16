import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { PlatformProvider } from './context/PlatformContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <CurrencyProvider>
    <PlatformProvider>
      <App />
    </PlatformProvider>
  </CurrencyProvider>
);
