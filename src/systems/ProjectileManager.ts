import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { Projectile } from '../entities/Projectile'
import type { ProjectileStats } from '../types/Projectile'
import type { ProjectileSetupFn } from '../types/Upgrade'


export class ProjectileManager {
    private textures: Record<string, PIXI.Texture>
    private projectilePool: Projectile[] = []
    activeProjectilePool: Projectile[] = []

    constructor(container: PIXI.Container, textures: Record<string, PIXI.Texture>, projectileLimit: number, isPlayerProjectiles: boolean = false) {
        this.textures = textures
        for (let i = 0; i < projectileLimit; i++) {
            const p = new Projectile(PIXI.Texture.EMPTY, isPlayerProjectiles)
            container.addChild(p)
            this.projectilePool.push(p)
        }
    }

    spawn(position: PIXI.PointData, type: string, projectileStats: ProjectileStats, projectileSetupFns: ProjectileSetupFn[], gameContext: GameContext) {
        const projectile = this.projectilePool.find(p => !p.isActive)
        if (projectile) {
            const texture = this.textures[type]
            projectile.spawn(position, texture || PIXI.Texture.EMPTY, projectileStats, projectileSetupFns, gameContext)
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