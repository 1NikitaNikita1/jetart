export function isMobileDevice(): boolean {
    const ua = navigator.userAgent || '';
    const isUaMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua);
    const isCoarsePointer =
        typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const hasTouchPoints = navigator.maxTouchPoints > 0;

    return isUaMobile || (isCoarsePointer && hasTouchPoints);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
}
