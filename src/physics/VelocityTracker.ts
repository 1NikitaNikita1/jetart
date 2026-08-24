interface PositionSample {
    position: number;
    time: number;
}

export class VelocityTracker {
    private samples: PositionSample[] = [];
    private readonly maxSamples: number;
    private readonly maxAgeMs: number;

    constructor(maxSamples = 6, maxAgeMs = 100) {
        this.maxSamples = maxSamples;
        this.maxAgeMs = maxAgeMs;
    }

    reset(): void {
        this.samples = [];
    }

    addSample(position: number, time: number = performance.now()): void {
        this.samples.push({ position, time });
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    getVelocity(now: number = performance.now()): number {
        const recent = this.samples.filter((s) => now - s.time <= this.maxAgeMs);
        if (recent.length < 2) {
            return 0;
        }

        const first = recent[0];
        const last = recent[recent.length - 1];
        const dtSec = (last.time - first.time) / 1000;
        if (dtSec <= 0) {
            return 0;
        }

        return (last.position - first.position) / dtSec;
    }
}
