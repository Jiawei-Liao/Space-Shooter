import * as PIXI from 'pixi.js'
import { type ProjectileSetupHook } from './Projectile'
import { GameContext } from '../GameContext'
import { getHitFlashAlpha } from '../utils/Math'

export interface PlayerStats {
    hp: number,
    maxHp: number,
    score: number,
    invincibilityTimer: number,
    invincibilityDuration: number,
    exp: number,
    level: number,
    maxExp: number,
    baseAttackSpeed: number,
    bonusAttackSpeed: number,
    attackSpeedMultiplier: number,
    numProjectiles: number,
}

export interface ProjectileStats {
    damage: number,
    damageMultiplier: number,
    width: number,
    height: number
    sizeScale: number,
    projectileSpeed: number,
    angle: number
    pierce: number
}

interface QueuedShot {
    offsetX: number,
    stats: ProjectileStats,
    setupHooks: ProjectileSetupHook[]
    delayTimer: number
}

export interface DamageEvent {
    damage: number
}

export interface Hook<T> {
    id: string,
    hook: T
}

export class Player extends PIXI.Container {
    public sprite: PIXI.Sprite
    public hitbox: PIXI.Graphics
    private hitFilter: PIXI.ColorMatrixFilter
    private hitTimer: number = 0
    private fireTimer: number = 0
    public onShoot?: (position: PIXI.PointData, projectileStats: ProjectileStats, setupHooks: ProjectileSetupHook[]) => void
    private queuedShots: QueuedShot[] = []
    private readonly QUEUED_SHOTS_INTERVAL = 0.03
    public readonly HITBOX_RADIUS: number = 4

    public playerStats: PlayerStats = {
        hp: 1,
        maxHp: 1,
        score: 0,
        invincibilityTimer: 0,
        invincibilityDuration: 1,
        exp: 0,
        level: 1,
        maxExp: 10,
        baseAttackSpeed: 2,
        bonusAttackSpeed: 0,
        attackSpeedMultiplier: 1,
        numProjectiles: 1,
    }

    public projectileStats: ProjectileStats = {
        damage: 1,
        damageMultiplier: 1,
        width: 15,
        height: 15,
        sizeScale: 1,
        projectileSpeed: 600,
        angle: -Math.PI / 2,
        pierce: 1,
    }

    public onFireShot: Hook<(stats: ProjectileStats, gameContext: GameContext) => void>[] = []
    public onShootHooks: Hook<(stats: ProjectileStats, gameContext: GameContext) => void>[] = []
    public onHitHooks: Hook<(event: DamageEvent, gameContext: GameContext) => void>[] = []
    public projectileSetupHooks: Hook<ProjectileSetupHook>[] = []

    constructor(texture: PIXI.Texture) {
        super()

        this.sprite = new PIXI.Sprite(texture)
        this.sprite.anchor.set(0.5)
        this.sprite.width = 50
        this.sprite.height = 60
        this.addChild(this.sprite)

        this.hitbox = new PIXI.Graphics()
            .circle(0, 0, this.HITBOX_RADIUS)
            .fill({ color: 0xFF0000 })

        this.hitFilter = new PIXI.ColorMatrixFilter()
        this.hitFilter.matrix = [
            1, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 1, 0
        ]
        this.hitFilter.enabled = false
        this.sprite.filters = [this.hitFilter]

        this.addChild(this.hitbox)
    }

    public removeUpgradeById(upgradeId: string) {
        this.onFireShot = this.onFireShot.filter(h => h.id !== upgradeId)
        this.onShootHooks = this.onShootHooks.filter(h => h.id !== upgradeId)
        this.onHitHooks = this.onHitHooks.filter(h => h.id !== upgradeId)
        this.projectileSetupHooks = this.projectileSetupHooks.filter(h => h.id !== upgradeId)
    }

    public addExp(amount: number) {
        this.playerStats.exp += amount
    }

    public checkLevelUp(): boolean {
        if (this.playerStats.exp >= this.playerStats.maxExp) {
            this.playerStats.exp -= this.playerStats.maxExp
            this.playerStats.level++
            this.playerStats.maxExp = Math.floor(10 * Math.pow(1.2, this.playerStats.level))
            return true
        }
        return false
    }

    public get isInvincible(): boolean {
        return this.playerStats.invincibilityTimer > 0
    }

    public get isDead(): boolean {
        return this.playerStats.hp <= 0
    }

    public setInvincibility(duration: number) {
        if (duration > this.playerStats.invincibilityTimer) {
            this.playerStats.invincibilityTimer = duration
        }
    }

    public hit(damage: number = 1, gameContext: GameContext) {
        if (this.isInvincible || this.isDead) return

        // Makes damage mutable, so it can be changed by hooks
        const event: DamageEvent = { damage }

        for (const hookWrapper of this.onHitHooks) {
            hookWrapper.hook(event, gameContext)
        }

        this.playerStats.hp -= event.damage

        if (!this.isDead) {
            this.setInvincibility(this.playerStats.invincibilityDuration)
            this.hitTimer = 0.1
            this.hitFilter.enabled = true
            this.hitFilter.alpha = 1.0
        } else {
            this.hitFilter.enabled = false
            this.sprite.alpha = 0.5
        }
    }

    public heal(amount: number) {
        if (this.isDead) return
        this.playerStats.hp += amount
        if (this.playerStats.hp > this.playerStats.maxHp) {
            this.playerStats.hp = this.playerStats.maxHp
        }
    }

    update(dt: number, mousePos: { x: number, y: number }, gameContext: GameContext) {
        if (this.isDead) return

        // Move
        this.x += (mousePos.x - this.x)
        this.y += (mousePos.y - this.y)

        // Hit tint filter
        if (this.hitTimer > 0) {
            this.hitTimer -= dt

            if (this.hitTimer <= 0) {
                this.hitTimer = 0
                this.hitFilter.enabled = false
            } else {
                this.hitFilter.alpha = getHitFlashAlpha(this.hitTimer)
            }
        }

        // Invincibility
        if (this.playerStats.invincibilityTimer > 0) {
            this.playerStats.invincibilityTimer -= dt

            // Only blink when outside of red hit tint filter
            if (this.hitTimer <= 0) {
                this.sprite.alpha = 0.5 + Math.sin(this.playerStats.invincibilityTimer * 30) * 0.3
            }
        } else {
            this.sprite.alpha = 1.0
        }

        // Generate shots
        this.fireTimer -= dt
        if (this.fireTimer <= 0) {
            const currentAttackSpeed = (this.playerStats.baseAttackSpeed + this.playerStats.bonusAttackSpeed) * this.playerStats.attackSpeedMultiplier
            this.fireTimer = 1 / currentAttackSpeed

            const totalProjectiles = this.playerStats.numProjectiles
            const shotOffsets = [0, -this.sprite.width / 2, this.sprite.width / 2, -this.sprite.width / 4, this.sprite.width / 4]

            this.onFireShot.forEach(hook => hook.hook({ ...this.projectileStats }, gameContext))
            const setupHooks = this.projectileSetupHooks.map(h => h.hook)

            for (let i = 0; i < totalProjectiles; i++) {
                const waveIndex = Math.floor(i / 5)
                const shotDelay = waveIndex * this.QUEUED_SHOTS_INTERVAL + dt
                const shotOffsetIndex = i % 5

                this.queuedShots.push({
                    offsetX: shotOffsets[shotOffsetIndex],
                    stats: { ...this.projectileStats },
                    setupHooks: setupHooks,
                    delayTimer: shotDelay
                })
            }
        }

        // Process shots queue backlog
        for (let i = this.queuedShots.length - 1; i >= 0; i--) {
            const shot = this.queuedShots[i]
            shot.delayTimer -= dt

            if (shot.delayTimer <= 0) {
                this.onShoot?.({ x: this.x + shot.offsetX, y: this.y }, shot.stats, shot.setupHooks)
                this.queuedShots.splice(i, 1)
            }
        }
    }
}