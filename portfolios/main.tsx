import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CabanyalPortfolio } from './cabanyal.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">');

createRoot(root).render(
  <StrictMode>
    <CabanyalPortfolio />
  </StrictMode>
);
