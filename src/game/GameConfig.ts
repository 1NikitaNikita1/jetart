export const GameConfig = {
    canvas: {
        width: 1280,
        height: 720
    },
    player: {
        width: 54,
        height: 46,
        speed: 520,
        bottomOffset: 60
    },
    bullet: {
        width: 4,
        height: 18,
        speed: 760,
        color: 0x8ef58f
    },
    bossBullet: {
        width: 6,
        height: 22,
        speed: 420,
        color: 0xff5c5c
    },
    maxShots: 10,
    timeLimitSec: 60,
    level1: {
        asteroidCount: 8,
        minRadius: 22,
        maxRadius: 40,
        minSpeed: 40,
        maxSpeed: 110,
        color: 0x9a8c7a
    },
    boss: {
        hp: 4,
        width: 150,
        height: 100,
        speed: 180,
        shootIntervalSec: 2,
        minPauseSec: 0.6,
        maxPauseSec: 1.8,
        color: 0xef5d8c
    },
    colors: {
        background: 0x05060f,
        player: 0x4f6df5,
        starfield: 0xffffff
    }
};
