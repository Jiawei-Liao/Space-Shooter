import type { Projectile } from '../entities/Projectile'
import type { GameContext } from '../GameContext'
import type { ProjectileStats } from './Projectile'

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Upgrade {
    id: string
    name: string
    description: string
    rarity: UpgradeRarity
    unique: boolean
    weight: number
    onApply: (context: GameContext) => void
    canAppear?: (context: GameContext) => boolean
}

export interface DamageEvent {
    damage: number
}

export interface Hook<T> {
    id: string,
    hook: T
}

export type ProjectileSetupFn = (projectile: Projectile, gameContext: GameContext) => void
export type UpdateFn = (dt: number, gameContext: GameContext) => void
export type FireShotFn = (stats: ProjectileStats, gameContext: GameContext) => void
export type ShootFn = (stats: ProjectileStats, gameContext: GameContext) => void
export type HitFn = (event: DamageEvent, gameContext: GameContext) => void

export type OnProjectileSetupHook = Hook<ProjectileSetupFn>
export type OnUpdateHook = Hook<UpdateFn>
export type OnFireShotHook = Hook<FireShotFn> // Each time the player fire timer is up
export type OnShootHook = Hook<ShootFn> // Each projectile the player shoots
export type OnHitHook = Hook<HitFn>