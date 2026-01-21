import { Enemy } from "../entities/Enemy"

/**
 * The bounds of selecting a random target
 */
export interface Bounds { minX: number, maxX: number, minY: number, maxY: number }

/**
 * Function on movement, returns true if some goal is reached (e.g, reached initial entry position)
 */
export type MoveBehaviour = (enemy: Enemy, dt: number) => boolean | void

export const moveTowards = (entity: { x: number, y: number }, tx: number, ty: number, speed: number, dt: number, threshold: number = 0): boolean => {
    const dx = tx - entity.x
    const dy = ty - entity.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const moveStep = speed * dt

    // Arrival check
    if (moveStep >= dist) {
        // If overshot, move to target position
        entity.x = tx
        entity.y = ty
        return true
    } else if (dist <= threshold) {
        // If within threshold, return true but do not move to target position, creates a stutter effect
        return true
    } else {
        // Move
        entity.x += (dx / dist) * moveStep
        entity.y += (dy / dist) * moveStep
        return false
    }
}

export const moveToBoundsBehaviour = (config: { bounds: Bounds, speed: number, threshold?: number }): MoveBehaviour => {
    const targetX = config.bounds.minX + Math.random() * (config.bounds.maxX - config.bounds.minX)
    const targetY = config.bounds.minY + Math.random() * (config.bounds.maxY - config.bounds.minY)
    const threshold = config.threshold ?? 0

    return (enemy: Enemy, dt: number) => moveTowards(enemy, targetX, targetY, config.speed, dt, threshold)
}

/**
 * Select a random point within the bounds, but not too close to the current position
 */
export const pickRandomPoint = (currX: number, currY: number, config: { bounds: Bounds, minMoveDistX: number, minMoveDistY: number }) => {
    const maxAttempts = 20
    for (let i = 0; i < maxAttempts; i++) {
        const nx = config.bounds.minX + Math.random() * (config.bounds.maxX - config.bounds.minX)
        const ny = config.bounds.minY + Math.random() * (config.bounds.maxY - config.bounds.minY)
        if (Math.abs(nx - currX) >= config.minMoveDistX && Math.abs(ny - currY) >= config.minMoveDistY) {
            return { x: nx, y: ny }
        }
    }
    return { x: config.bounds.minX, y: config.bounds.minY }
}

export const randomWalkBehaviour = (config: { bounds: Bounds, speed: number, minMoveDistX: number, minMoveDistY: number, threshold?: number }): MoveBehaviour => {
    let targetX: number | undefined
    let targetY: number | undefined
    const threshold = config.threshold ?? 0

    return (enemy: Enemy, dt: number) => {
        if (targetX === undefined || targetY === undefined) {
            const newPoint = pickRandomPoint(enemy.x, enemy.y, config)
            targetX = newPoint.x
            targetY = newPoint.y
        }

        const arrived = moveTowards(enemy, targetX, targetY, config.speed, dt, threshold)

        if (arrived) {
            const newPoint = pickRandomPoint(enemy.x, enemy.y, config)
            targetX = newPoint.x
            targetY = newPoint.y
            return true
        } else {
            return false
        }
    }
}
