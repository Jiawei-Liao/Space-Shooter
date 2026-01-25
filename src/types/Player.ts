import type { StatConstraint } from './Stats'

export interface PlayerStats {
    hp: number,
    maxHp: number,
    score: number,
    invincibilityTimer: number,
    invincibilityDuration: number,
    exp: number,
    level: number,
    maxExp: number,
    baseAttackSpeed: number,
    bonusAttackSpeed: number,
    attackSpeedMultiplier: number,
    numProjectiles: number,
    maxProjectilesPerWave: number
}

export const PLAYER_STAT_CONSTRAINTS: Partial<Record<keyof PlayerStats, StatConstraint>> = {
    maxHp: { min: 1 },
    hp: { min: 1 },
    baseAttackSpeed: { min: 0.1 },
    attackSpeedMultiplier: { min: 0.1 },
    numProjectiles: { min: 1 },
    maxProjectilesPerWave: { min: 1 },
    invincibilityDuration: { min: 0.1 }
}