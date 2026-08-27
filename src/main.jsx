import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App.jsx';
import './styles/app.css';
import './styles/generator-clean.css';
import './styles/generator-polish.css';
import './styles/generator-density.css';
import './styles/generator-copy-trim.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
