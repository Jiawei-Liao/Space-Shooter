import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { Projectile, type ProjectileSetupHook } from '../entities/Projectile'
import type { ProjectileStats } from '../entities/Player'


export class ProjectileManager {
    private textures: Record<string, PIXI.Texture>
    private projectilePool: Projectile[] = []
    public activeProjectilePool: Projectile[] = []

    constructor(app: PIXI.Application, textures: Record<string, PIXI.Texture>, projectileLimit: number, isPlayerProjectiles: boolean = false) {
        this.textures = textures
        for (let i = 0; i < projectileLimit; i++) {
            const p = new Projectile(PIXI.Texture.EMPTY, isPlayerProjectiles)
            app.stage.addChild(p)
            this.projectilePool.push(p)
        }
    }

    spawn(position: PIXI.PointData, type: string, projectileStats: ProjectileStats, setupHooks: ProjectileSetupHook[]) {
        const projectile = this.projectilePool.find(p => !p.isActive)
        if (projectile) {
            const texture = this.textures[type]
            projectile.spawn(position, texture || PIXI.Texture.EMPTY, projectileStats, setupHooks, this)
            this.activeProjectilePool.push(projectile)
        }
    }

    update(dt: number, gameContext: GameContext) {
        for (let i = this.activeProjectilePool.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectilePool[i]
            projectile.update(dt, gameContext)

            if (!projectile.isActive) {
                this.activeProjectilePool.splice(i, 1)
            }
        }
    }
}