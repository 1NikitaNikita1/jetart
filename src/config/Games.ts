export interface GameConfig {
    id: string;
    name: string;
    description?: string;
    width: number;
    height: number;
}

export const gamesConfig: GameConfig[] = [
    {
        id: 'space-shooter',
        name: 'Space Shooter',
        description: 'Simple space shooter game',
        width: 1200,
        height: 700
    }
];
