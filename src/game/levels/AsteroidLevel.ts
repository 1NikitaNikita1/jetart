import { Container } from 'pixi.js';
import { Asteroid } from '../entities/Asteroid';
import { GameConfig } from '../GameConfig';
import type { LevelController } from './LevelController';

export class AsteroidLevel implements LevelController {
    readonly container = new Container();
    readonly asteroids: Asteroid[] = [];

    start(): void {
        const { asteroidCount, minRadius, maxRadius, minSpeed, maxSpeed, color } = GameConfig.level1;
        const { width, height } = GameConfig.canvas;

        for (let i = 0; i < asteroidCount; i++) {
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            const x = radius + Math.random() * (width - radius * 2);
            const y = radius + Math.random() * (height * 0.5 - radius * 2);

            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const angle = Math.random() * Math.PI * 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            const asteroid = new Asteroid(radius, color, velocityX, velocityY);
            asteroid.position.set(x, y);

            this.asteroids.push(asteroid);
            this.container.addChild(asteroid);
        }
    }

    update(deltaSec: number): void {
        const bounds = GameConfig.canvas;
        for (const asteroid of this.asteroids) {
            asteroid.update(deltaSec, bounds);
        }
    }

    removeAsteroid(asteroid: Asteroid): void {
        const index = this.asteroids.indexOf(asteroid);
        if (index !== -1) this.asteroids.splice(index, 1);
        this.container.removeChild(asteroid);
        asteroid.destroy();
    }

    isCleared(): boolean {
        return this.asteroids.length === 0;
    }

    destroy(): void {
        for (const asteroid of [...this.asteroids]) {
            this.removeAsteroid(asteroid);
        }
        this.container.destroy();
    }
}
