import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { Projectile } from '../entities/Projectile'
import type { ProjectileBehavior } from './ProjectileBehaviours'
import type { ProjectileStats } from '../entities/Player'


export class ProjectileManager {
    private textures: Record<string, PIXI.Texture>
    private projectilePool: Projectile[] = []
    public activeProjectilePool: Projectile[] = []
    private warpFactor: number = 1.0
    private targetWarpFactor: number = 1.0

    constructor(app: PIXI.Application, textures: Record<string, PIXI.Texture>, projectileLimit: number) {
        this.textures = textures
        for (let i = 0; i < projectileLimit; i++) {
            const p = new Projectile(PIXI.Texture.EMPTY)
            app.stage.addChild(p)
            this.projectilePool.push(p)
        }
    }

    setWarpFactor(factor: number) {
        this.targetWarpFactor = factor
    }

    spawn(position: PIXI.PointData, type: string, projectileStats: ProjectileStats, behaviours: ProjectileBehavior[]) {
        const projectile = this.projectilePool.find(p => !p.isActive)
        if (projectile) {
            const texture = this.textures[type]
            projectile.spawn(position, texture || PIXI.Texture.EMPTY, projectileStats, behaviours, this)
            this.activeProjectilePool.push(projectile)
        }
    }

    update(dt: number, _playerPos: PIXI.PointData, _gameContext: GameContext) {
        // Smoothly increase current warp factor to target (Same as in Background)
        this.warpFactor += (this.targetWarpFactor - this.warpFactor) * 5.0 * dt

        for (let i = this.activeProjectilePool.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectilePool[i]
            projectile.update(dt, this.warpFactor)

            if (!projectile.isActive) {
                this.activeProjectilePool.splice(i, 1)
            }
        }
    }
}