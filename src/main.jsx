import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { PlatformProvider } from './context/PlatformContext.jsx';
import ScrollToTop from './components/shared/ScrollToTop.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PlatformProvider>
        <ScrollToTop />
        <App />
      </PlatformProvider>
    </BrowserRouter>
  </StrictMode>,
);
