import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ParroDashIntegrationPreview } from './integrations/parrodash/IntegrationPreview.tsx';
import './index.css';

// Preserve the original AI Studio UI at /. The real data integration is
// isolated until authentication, tenant isolation and parity tests pass.
const isIntegrationPreview = window.location.pathname.replace(/\/$/, '') === '/integration-preview';
createRoot(document.getElementById('root')!).render(
  isIntegrationPreview ? <ParroDashIntegrationPreview /> : <App />
);
