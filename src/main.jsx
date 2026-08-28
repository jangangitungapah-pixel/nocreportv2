import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App.jsx';
import './styles/app.css';
import './styles/generator-clean.css';
import './styles/generator-polish.css';
import './styles/generator-density.css';
import './styles/generator-copy-trim.css';
import './styles/generator-final-polish.css';
import './styles/generator-focus.css';
import './styles/generator-header-polish.css';
import './styles/generator-refinement.css';
import './styles/cut-point-tracker-polish.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
