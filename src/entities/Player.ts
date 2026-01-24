import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { getHitFlashAlpha } from '../utils/Math'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'
import { PROJECTILE_STAT_CONSTRAINTS, type ProjectileStats } from '../types/Projectile'
import { PLAYER_STAT_CONSTRAINTS, type PlayerStats } from '../types/Player'
import type { Hook, ProjectileSetupHook } from '../types/Upgrade'
import type { ModifyerType, StatConstraint } from '../types/Stats'

interface QueuedShot {
    offsetX: number,
    stats: ProjectileStats,
    setupHooks: ProjectileSetupHook[]
    delayTimer: number
}

export interface DamageEvent {
    damage: number
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
    private readonly MIN_ATTACK_SPEED: number = 0.1 // Player has to be able to attack

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
        maxProjectilesPerWave: 5,
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

    public modifyStat(stat: keyof PlayerStats | keyof ProjectileStats, amount: number, type: ModifyerType = 'ADDITIVE') {
        if (stat in this.playerStats) {
            this.applyAdjustment(
                this.playerStats,
                stat as keyof PlayerStats,
                amount,
                type,
                PLAYER_STAT_CONSTRAINTS
            )

            // Handle side-effects
            if (stat === 'maxHp') {
                this.playerStats.hp = Math.min(this.playerStats.hp, this.playerStats.maxHp);
            }
        } else if (stat in this.projectileStats) {
            this.applyAdjustment(
                this.projectileStats,
                stat as keyof ProjectileStats,
                amount,
                type,
                PROJECTILE_STAT_CONSTRAINTS
            );
        }
    }

    private applyAdjustment<T extends object>(target: T, stat: keyof T, amount: number, type: ModifyerType, constraints: Partial<Record<keyof T, StatConstraint>>) {
        // Cast to number to do math operations
        let value = target[stat] as unknown as number;

        switch (type) {
            case 'ADDITIVE':
                value += amount;
                break;
            case 'SUBTRACTIVE':
                value -= amount;
                break;
            case 'MULTIPLIER':
                value *= amount;
                break;
        }

        // Apply min/max stat constraints
        const constraint = constraints[stat];
        if (constraint) {
            if (constraint.min !== undefined) value = Math.max(value, constraint.min);
            if (constraint.max !== undefined) value = Math.min(value, constraint.max);
        }

        target[stat] = value as any;
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

    get currentAttackSpeed(): number {
        const raw = this.playerStats.baseAttackSpeed * this.playerStats.attackSpeedMultiplier + this.playerStats.bonusAttackSpeed
        return Math.max(raw, this.MIN_ATTACK_SPEED)
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

    update(dt: number, gameContext: GameContext) {
        if (this.isDead) return

        // Movement
        const mousePos = gameContext.inputManager.mousePos
        this.x += (mousePos.x - this.x)
        this.y += (mousePos.y - this.y)

        // Clamp to game bounds
        if (this.x < 0) this.x = 0
        if (this.x > GAME_WIDTH) this.x = GAME_WIDTH
        if (this.y < 0) this.y = 0
        if (this.y > GAME_HEIGHT) this.y = GAME_HEIGHT

        // Inputs
        for (const intent of gameContext.inputManager.getIntents()) {
            if (intent === 'ACTIVATE_ITEM') {
                console.log('TODO: ACTIVATE_ITEM')
            }
            if (intent === 'NEXT_ITEM') {
                console.log('TODO: NEXT_ITEM')
            }
            if (intent === 'PREVIOUS_ITEM') {
                console.log('TODO: PREVIOUS_ITEM')
            }
        }

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
            // Can't let player not be able to shoot
            this.fireTimer = 1 / this.currentAttackSpeed

            this.onFireShot.forEach(hook => hook.hook({ ...this.projectileStats }, gameContext))
            const setupHooks = this.projectileSetupHooks.map(h => h.hook)

            const maxPerWave = this.playerStats.maxProjectilesPerWave
            const fireWidth = this.sprite.width
            let projectilesLeft = this.playerStats.numProjectiles
            let waveIndex = 0

            while (projectilesLeft > 0) {
                const bulletsInThisWave = Math.min(projectilesLeft, maxPerWave)
                const shotDelay = waveIndex * this.QUEUED_SHOTS_INTERVAL

                for (let i = 0; i < bulletsInThisWave; i++) {
                    const relativePos = (i + 1) / (bulletsInThisWave + 1)
                    const offsetX = (relativePos - 0.5) * fireWidth

                    this.queuedShots.push({
                        offsetX: offsetX,
                        stats: { ...this.projectileStats },
                        setupHooks: setupHooks,
                        delayTimer: shotDelay
                    })
                }

                waveIndex++
                projectilesLeft -= maxPerWave
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