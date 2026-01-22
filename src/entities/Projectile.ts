import * as PIXI from 'pixi.js'
import { isOutOfBounds } from '../GameConfig'
import type { ProjectileStats } from './Player'
import type { ProjectileBehavior } from '../systems/ProjectileBehaviours'
import type { ProjectileManager } from '../systems/ProjectileManager'
import type { Enemy } from './Enemy'
import type { GameContext } from '../GameContext'

export class Projectile extends PIXI.Sprite {
    public isActive: boolean = false
    public projectileStats!: ProjectileStats
    public behaviours: ProjectileBehavior[] = []
    private hitTargets: Set<Enemy> = new Set()
    private manager!: ProjectileManager
    private isPlayerProjectiles: boolean = false

    constructor(texture: PIXI.Texture, isPlayerProjectiles: boolean = false) {
        super(texture)
        this.anchor.set(0.5)
        this.visible = false
        this.isPlayerProjectiles = isPlayerProjectiles
    }

    spawn(position: PIXI.PointData, texture: PIXI.Texture, projectileStats: ProjectileStats, behaviours: ProjectileBehavior[], manager: ProjectileManager) {
        this.texture = texture
        this.projectileStats = projectileStats
        this.behaviours = behaviours
        this.manager = manager
        this.position.set(position.x, position.y)
        this.width = projectileStats.width * projectileStats.sizeScale
        this.height = projectileStats.height * projectileStats.sizeScale
        this.hitTargets.clear()

        this.isActive = true
        this.visible = true
    }

    update(dt: number, gameContext: GameContext) {
        if (!this.isActive) return

        // Modify bullet based on behaviours
        for (const behaviour of this.behaviours) {
            behaviour.update({ p: this, dt, manager: this.manager })
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

    hit(enemy: Enemy) {
        if (this.hitTargets.has(enemy)) return

        this.hitTargets.add(enemy)
        this.projectileStats.pierce--

        for (const behaviour of this.behaviours) {
            behaviour.onHit?.({ p: this, manager: this.manager })
        }

        if (this.projectileStats.pierce <= 0) {
            this.die()
        }
    }

    hasAlreadyHit(enemy: Enemy): boolean {
        return this.hitTargets.has(enemy)
    }

    die() {
        for (const behaviour of this.behaviours) {
            behaviour.onDestroy?.({ p: this, manager: this.manager })
        }

        this.remove()
    }

    remove() {
        this.isActive = false
        this.visible = false
    }
}