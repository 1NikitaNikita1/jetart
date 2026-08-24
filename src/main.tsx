import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalStyle } from './styles/GlobalStyle';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/route';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalStyle />
        <RouterProvider router={router} />
    </StrictMode>
);
