import type { StatConstraint } from './Stats'

export interface ProjectileStats {
    damage: number,
    damageMultiplier: number,
    width: number,
    height: number
    projectileSize: number,
    projectileSpeed: number,
    angle: number
    pierce: number
}

export const PROJECTILE_STAT_CONSTRAINTS: Partial<Record<keyof ProjectileStats, StatConstraint>> = {
    damage: { min: 0 },
    damageMultiplier: { min: 0.1 },
    width: { min: 1 },
    height: { min: 1 },
    projectileSize: { min: 0.1 },
    projectileSpeed: { min: 10 },
    pierce: { min: 1 }
}