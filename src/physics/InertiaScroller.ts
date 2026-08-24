export class InertiaScroller {
    private velocity = 0;
    private readonly decayPerSecond: number;
    private readonly minVelocity: number;

    constructor(decayPerSecond: number, minVelocity: number) {
        this.decayPerSecond = decayPerSecond;
        this.minVelocity = minVelocity;
    }

    setVelocity(velocity: number): void {
        this.velocity = velocity;
    }

    stop(): void {
        this.velocity = 0;
    }

    get isMoving(): boolean {
        return Math.abs(this.velocity) > this.minVelocity;
    }

    get currentVelocity(): number {
        return this.velocity;
    }

    update(deltaMS: number): number {
        if (!this.isMoving) {
            this.velocity = 0;
            return 0;
        }

        const dtSec = deltaMS / 1000;
        const distance = this.velocity * dtSec;
        const decayFactor = Math.pow(this.decayPerSecond, dtSec);
        this.velocity *= decayFactor;

        if (Math.abs(this.velocity) < this.minVelocity) {
            this.velocity = 0;
        }

        return distance;
    }
}
