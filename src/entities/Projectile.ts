import * as PIXI from 'pixi.js'
import { isOutOfBounds } from '../GameConfig'
import type { Enemy } from './Enemy'
import type { GameContext } from '../GameContext'
import type { ProjectileManager } from '../systems/ProjectileManager'
import type { ProjectileStats } from '../types/Projectile'
import type { ProjectileSetupHook } from '../types/Upgrade'

export class Projectile extends PIXI.Sprite {
    public isActive: boolean = false
    public projectileStats!: ProjectileStats
    public hitTargets: Set<Enemy> = new Set()
    private isPlayerProjectiles: boolean = false

    public onUpdateHooks: ((dt: number, gameContext: GameContext) => void)[] = []
    public onHitHooks: ((enemy: Enemy, gameContext: GameContext) => void)[] = []
    public onDestroyHooks: ((gameContext: GameContext) => void)[] = []

    constructor(texture: PIXI.Texture, isPlayerProjectiles: boolean = false) {
        super(texture)
        this.anchor.set(0.5)
        this.visible = false
        this.isPlayerProjectiles = isPlayerProjectiles
    }

    spawn(position: PIXI.PointData, texture: PIXI.Texture, projectileStats: ProjectileStats, setupHooks: ProjectileSetupHook[], manager: ProjectileManager) {
        this.texture = texture
        this.projectileStats = projectileStats
        this.position.set(position.x, position.y)
        this.width = projectileStats.width * projectileStats.sizeScale
        this.height = projectileStats.height * projectileStats.sizeScale
        this.hitTargets.clear()
        this.onUpdateHooks = []
        this.onHitHooks = []
        this.onDestroyHooks = []

        setupHooks.forEach(hook => hook(this, manager))

        this.isActive = true
        this.visible = true
    }

    update(dt: number, gameContext: GameContext) {
        if (!this.isActive) return

        // Modify bullet based on behaviours
        for (const hook of this.onUpdateHooks) {
            hook(dt, gameContext)
        }

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