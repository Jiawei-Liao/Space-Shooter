import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { EXP_TIERS, type ExpTier } from '../types/Exp'

export class ExpParticle extends PIXI.Container {
    private graphics: PIXI.Graphics
    private glow: PIXI.Graphics
    public velocity: { x: number, y: number } = { x: 0, y: 0 }
    public isActive: boolean = false
    public value: number = 0
    private magnetSpeed: number = 0
    private readonly MAX_MAGNET_SPEED = 800
    private readonly MAGNET_ACCEL = 1500
    private readonly MAGNET_RADIUS = 200

    constructor() {
        super()
        this.graphics = new PIXI.Graphics()
        this.glow = new PIXI.Graphics()
        this.glow.blendMode = 'add'

        this.addChild(this.glow)
        this.addChild(this.graphics)
        this.visible = false
    }

    public spawn(x: number, y: number, tier: ExpTier) {
        const config = EXP_TIERS[tier]
        this.position.set(x, y)
        this.isActive = true
        this.visible = true
        this.magnetSpeed = 0
        this.value = config.value

        // Random scatter velocity
        const angle = Math.random() * Math.PI * 2
        const speed = 50 + Math.random() * 100
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        }

        this.drawShape(tier)
    }

    private drawShape(tier: ExpTier) {
        const config = EXP_TIERS[tier]
        const size = config.size

        // Random polygon (4-7 sides)
        const points: number[] = []
        const numPoints = 4 + Math.floor(Math.random() * 4)
        // Random side lengths
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2
            const r = size * (0.7 + Math.random() * 0.6)
            points.push(Math.cos(angle) * r, Math.sin(angle) * r)
        }

        this.graphics.clear()
        this.graphics.poly(points)
        this.graphics.fill({ color: config.color })
        this.graphics.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.5 })

        this.glow.clear()
        this.glow.circle(0, 0, size * 2)
        this.glow.fill({ color: config.color, alpha: config.glow })
    }

    public update(dt: number, context: GameContext) {
        if (!this.isActive) return

        const player = context.player
        const isBelowPlayer = this.y > player.y
        const distSq = (player.x - this.x) ** 2 + (player.y - this.y) ** 2

        let attracted = false

        // Magnetise to player if below player or within magnet radius
        if (isBelowPlayer || distSq < this.MAGNET_RADIUS ** 2) {
            attracted = true
        }

        if (attracted) {
            // Move towards player
            const angle = Math.atan2(player.y - this.y, player.x - this.x)
            this.magnetSpeed = Math.min(this.magnetSpeed + this.MAGNET_ACCEL * dt, this.MAX_MAGNET_SPEED)

            this.velocity.x = Math.cos(angle) * this.magnetSpeed
            this.velocity.y = Math.sin(angle) * this.magnetSpeed
        } else {
            // Apply drag to scatter velocity
            this.velocity.x *= 0.95
            this.velocity.y *= 0.95
            this.velocity.y += context.background.backgroundSpeed * dt * 5
        }

        this.x += this.velocity.x * dt
        this.y += this.velocity.y * dt
        this.rotation += 2 * dt
    }
}
