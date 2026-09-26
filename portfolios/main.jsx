import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CabanyalPortfolio } from './cabanyal.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CabanyalPortfolio />
  </StrictMode>
);
