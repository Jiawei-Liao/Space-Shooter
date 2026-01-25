import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { PARTICLE_POOL_SIZE } from '../GameConfig'
import { ExpParticle } from '../entities/ExpParticle'
import { EXP_TIERS, type ExpTier } from '../types/Exp'

export class ExpManager {
    private container: PIXI.Container
    private particlePool: ExpParticle[] = []
    private activeParticles: ExpParticle[] = []
    private readonly INITIAL_POOL_SIZE = PARTICLE_POOL_SIZE

    constructor(container: PIXI.Container) {
        this.container = new PIXI.Container()
        container.addChild(this.container)

        for (let i = 0; i < this.INITIAL_POOL_SIZE; i++) {
            this.createParticle()
        }
    }

    private createParticle(): ExpParticle {
        const p = new ExpParticle()
        this.particlePool.push(p)
        this.container.addChild(p)
        return p
    }

    private getParticle(): ExpParticle {
        let p = this.particlePool.find(p => !p.isActive)
        if (!p) {
            p = this.createParticle()
        }
        return p
    }

    spawn(x: number, y: number, totalValue: number) {
        let remaining = totalValue

        const sortedTiers = (Object.keys(EXP_TIERS) as ExpTier[]).sort(
            (a, b) => EXP_TIERS[b].value - EXP_TIERS[a].value
        )

        for (const tier of sortedTiers) {
            const tierValue = EXP_TIERS[tier].value
            while (remaining >= tierValue) {
                this.spawnParticle(x, y, tier)
                remaining -= tierValue
            }
        }
    }

    private spawnParticle(x: number, y: number, tier: ExpTier) {
        const p = this.getParticle()
        const r = 10
        const rx = x + (Math.random() * r * 2 - r)
        const ry = y + (Math.random() * r * 2 - r)
        p.spawn(rx, ry, tier)
        if (!this.activeParticles.includes(p)) {
            this.activeParticles.push(p)
        }
    }

    update(dt: number, context: GameContext) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i]
            p.update(dt, context)

            // Check collision with player
            if (p.isActive) {
                const player = context.player
                const dx = player.x - p.x
                const dy = player.y - p.y
                const distSq = dx * dx + dy * dy
                const collectRadius = 30 // Close enough to collect

                if (distSq < collectRadius * collectRadius) {
                    this.collect(p, context)
                }
            }
        }
    }

    private collect(p: ExpParticle, context: GameContext) {
        p.isActive = false
        p.visible = false
        // Remove from active list
        const idx = this.activeParticles.indexOf(p)
        if (idx >= 0) this.activeParticles.splice(idx, 1)

        // Add to player stats
        context.player.addExp(p.value)
    }
}
