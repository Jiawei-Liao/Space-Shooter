import * as PIXI from 'pixi.js'
import { isOutOfBounds } from '../GameConfig'
import type { Enemy } from './Enemy'
import type { GameContext } from '../GameContext'
import type { ProjectileStats } from '../types/Projectile'
import type { ProjectileSetupFn } from '../types/Upgrade'

export class Projectile extends PIXI.Sprite {
    isActive: boolean = false
    projectileStats!: ProjectileStats
    hitTargets: Set<Enemy> = new Set()
    private isPlayerProjectiles: boolean = false

    onUpdateHooks: ((dt: number, gameContext: GameContext) => void)[] = []
    onHitHooks: ((enemy: Enemy, gameContext: GameContext) => void)[] = []
    onDestroyHooks: ((gameContext: GameContext) => void)[] = []

    constructor(texture: PIXI.Texture, isPlayerProjectiles: boolean = false) {
        super(texture)
        this.anchor.set(0.5)
        this.visible = false
        this.isPlayerProjectiles = isPlayerProjectiles
    }

    spawn(position: PIXI.PointData, texture: PIXI.Texture, projectileStats: ProjectileStats, projectileSetupFns: ProjectileSetupFn[], context: GameContext) {
        this.texture = texture
        this.projectileStats = projectileStats
        this.position.set(position.x, position.y)
        this.width = projectileStats.width * projectileStats.projectileSize
        this.height = projectileStats.height * projectileStats.projectileSize

        this.hitTargets.clear()
        this.onUpdateHooks = []
        this.onHitHooks = []
        this.onDestroyHooks = []

        projectileSetupFns.forEach(hook => hook(this, context))

        this.isActive = true
        this.visible = true
    }

    update(dt: number, gameContext: GameContext) {
        if (!this.isActive) return

        // Modify bullet based on behaviours
        for (const hook of this.onUpdateHooks) {
            hook(dt, gameContext)
        }

        // Change projectile size
        this.width = this.projectileStats.width * this.projectileStats.projectileSize
        this.height = this.projectileStats.height * this.projectileStats.projectileSize

        // Move projectile
        this.rotation = this.projectileStats.angle
        this.x += Math.cos(this.projectileStats.angle) * this.projectileStats.projectileSpeed * dt
        this.y += Math.sin(this.projectileStats.angle) * this.projectileStats.projectileSpeed * dt

        // Apply warp effect to enemy projectiles and move down at same rate as background
        if (!this.isPlayerProjectiles) {
            this.y += gameContext.background.backgroundSpeed * dt
        }

        if (isOutOfBounds(this.position)) {
            this.remove()
        }
    }

    hit(enemy: Enemy, gameContext: GameContext) {
        if (this.hitTargets.has(enemy)) return

        this.hitTargets.add(enemy)
        this.projectileStats.pierce--

        for (const hook of this.onHitHooks) {
            hook(enemy, gameContext)
        }

        if (this.projectileStats.pierce <= 0) {
            this.die(gameContext)
        }
    }

    hasAlreadyHit(enemy: Enemy): boolean {
        return this.hitTargets.has(enemy)
    }

    die(gameContext: GameContext) {
        for (const hook of this.onDestroyHooks) {
            hook(gameContext)
        }

        this.remove()
    }

    remove() {
        this.isActive = false
        this.visible = false
    }
}