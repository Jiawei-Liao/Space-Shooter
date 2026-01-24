import type { Projectile } from '../entities/Projectile'
import type { GameContext } from '../GameContext'
import type { ProjectileManager } from '../systems/ProjectileManager'

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

export interface Hook<T> {
    id: string,
    hook: T
}

export type ProjectileSetupHook = (p: Projectile, manager: ProjectileManager) => void