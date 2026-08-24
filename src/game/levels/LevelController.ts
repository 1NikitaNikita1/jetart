import { Container } from 'pixi.js';

export interface LevelController {
    readonly container: Container;
    start(): void;
    update(deltaSec: number): void;
    isCleared(): boolean;
    destroy(): void;
}
