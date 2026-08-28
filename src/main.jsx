import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App.jsx';
import './styles/app.css';
import './styles/cut-point-tracker-polish.css';
import './styles/cut-point-popup-tweak.css';
import './styles/premium-overhaul.css';
import './styles/generator-timing-polish.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
