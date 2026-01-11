import * as PIXI from 'pixi.js'
import type { ProjectileBehavior } from '../systems/ProjectileBehaviours'
import { ProjectileBehaviours } from '../systems/ProjectileBehaviours'

export interface PlayerStats {
    hp: number,
    maxHp: number,
    score: number,
    invincibilityTimer: number,
    invincibilityDuration: number
}

export interface ProjectileStats {
    fireTimer: number,
    fireRate: number,
    damage: number,
    width: number,
    height: number
    sizeScale: number,
    speed: number,
    angle: number
    numProjectiles: number,
    pierce: number
}

interface QueuedShot {
    offsetX: number,
    stats: ProjectileStats,
    behaviours: ProjectileBehavior[]
    delayTimer: number
}

export class Player extends PIXI.Container {
    public sprite: PIXI.Sprite
    public hitbox: PIXI.Graphics
    public onShoot?: (position: PIXI.PointData, projectileStats: ProjectileStats, behaviours: ProjectileBehavior[]) => void
    private queuedShots: QueuedShot[] = []
    private readonly QUEUED_SHOTS_DELAY = 0.03
    public hitboxRadius: number = 4

    public playerStats: PlayerStats = {
        hp: 1,
        maxHp: 1,
        score: 0,
        invincibilityTimer: 0,
        invincibilityDuration: 1
    }

    public projectileStats: ProjectileStats = {
        fireTimer: 0,
        fireRate: 0.5,
        damage: 1,
        width: 15,
        height: 15,
        sizeScale: 1,
        speed: 600,
        angle: -Math.PI / 2,
        numProjectiles: 1,
        pierce: 1,
    }

    public behaviours: (() => ProjectileBehavior)[] = []

    constructor(texture: PIXI.Texture) {
        super()

        this.sprite = new PIXI.Sprite(texture)
        this.sprite.anchor.set(0.5)
        this.sprite.width = 60
        this.sprite.height = 60
        this.addChild(this.sprite)

        this.hitbox = new PIXI.Graphics()
            .circle(0, 0, this.hitboxRadius)
            .fill({ color: 0x90E0EF })
        this.addChild(this.hitbox)
    }

    public get isInvincible(): boolean {
        return this.playerStats.invincibilityTimer > 0
    }

    public hit(damage: number = 1) {
        this.playerStats.hp -= damage
        this.playerStats.invincibilityTimer = this.playerStats.invincibilityDuration
        this.sprite.tint = 0xFF0000
        setTimeout(() => this.sprite.tint = 0xFFFFFF, 100)
    }

    update(targetX: number, targetY: number, dt: number) {
        // Move
        this.x += (targetX - this.x)
        this.y += (targetY - this.y)

        // Invincibility
        if (this.playerStats.invincibilityTimer > 0) {
            this.playerStats.invincibilityTimer -= dt
        }
        if (this.isInvincible) {
            this.sprite.alpha = 0.5 + Math.sin(this.playerStats.invincibilityTimer * 30) * 0.3
        } else {
            this.sprite.alpha = 1.0
        }

        // Generate shots
        this.projectileStats.fireTimer -= dt
        if (this.projectileStats.fireTimer <= 0) {
            this.projectileStats.fireTimer = this.projectileStats.fireRate

            const totalProjectiles = this.projectileStats.numProjectiles
            const shotOffsets = [0, -this.sprite.width / 2, this.sprite.width / 2, -this.sprite.width / 4, this.sprite.width / 4]

            for (let i = 0; i < totalProjectiles; i++) {
                const waveIndex = Math.floor(i / 5)
                const shotDelay = waveIndex * this.QUEUED_SHOTS_DELAY + dt
                const shotOffsetIndex = i % 5

                this.queuedShots.push({
                    offsetX: shotOffsets[shotOffsetIndex],
                    stats: { ...this.projectileStats },
                    behaviours: this.behaviours.map(f => f()),
                    delayTimer: shotDelay
                })
            }
        }

        // Process shots queue backlog
        for (let i = this.queuedShots.length - 1; i >= 0; i--) {
            const shot = this.queuedShots[i]
            shot.delayTimer -= dt

            if (shot.delayTimer <= 0) {
                this.onShoot?.({ x: this.x + shot.offsetX, y: this.y }, shot.stats, shot.behaviours)
                this.queuedShots.splice(i, 1)
            }
        }
    }
}