export interface CircleShape {
    x: number;
    y: number;
    radius: number;
}

export interface RectShape {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function circlesIntersect(a: CircleShape, b: CircleShape): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSum = a.radius + b.radius;
    return distanceSq <= radiusSum * radiusSum;
}

export function circleIntersectsRect(circle: CircleShape, rect: RectShape): boolean {
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;

    const closestX = Math.max(rect.x - halfW, Math.min(circle.x, rect.x + halfW));
    const closestY = Math.max(rect.y - halfH, Math.min(circle.y, rect.y + halfH));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy <= circle.radius * circle.radius;
}
