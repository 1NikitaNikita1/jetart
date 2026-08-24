import { useParams } from 'react-router-dom';

import { GameContainer } from '../components/GameContainer';
import { getGameConfig } from '../utils/getGameById';

export const GamePage = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return <div>Game ID is required</div>;
    }

    const gameConfig = getGameConfig(id);

    if (!gameConfig) {
        return <div>Game not found</div>;
    }

    return <GameContainer config={gameConfig} />;
};
