import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { type GameConfig } from '../config/Games';

import { SpaceShooterGame } from '../game/SpaceShooterGame';

const Container = styled.div`
    width: 100%;
    min-height: 100vh;

    display: flex;
    align-items: center;
    justify-content: center;

    canvas {
        display: block;
    }
`;

interface Props {
    config: GameConfig;
}

export const GameContainer = ({ config }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const game = new SpaceShooterGame(container);
        game.init();

        return () => {
            void game.destroy();
        };
    }, [config]);

    return <Container ref={containerRef} />;
};
