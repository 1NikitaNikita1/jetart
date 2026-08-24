import { createBrowserRouter } from 'react-router-dom';
import { GamePage } from '../pages/GamePage';
import Home from '../Home';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />
    },
    {
        path: '/game/:id',
        element: <GamePage />
    }
]);
