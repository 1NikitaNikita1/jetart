import { gamesConfig, type GameConfig } from '../config/Games';

export const getGameConfig = (id: string): GameConfig | undefined => {
    return gamesConfig.find((game) => game.id === id);
};
