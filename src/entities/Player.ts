import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { getHitFlashAlpha } from '../utils/Math'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'
import { PROJECTILE_STAT_CONSTRAINTS, type ProjectileStats } from '../types/Projectile'
import { PLAYER_STAT_CONSTRAINTS, type PlayerStats } from '../types/Player'
import type { OnProjectileSetupHook, OnUpdateHook, OnFireShotHook, OnShootHook, OnHitHook, DamageEvent, ProjectileSetupFn } from '../types/Upgrade'
import type { ModifyerType, StatConstraint } from '../types/Stats'

interface QueuedShot {
    offsetX: number,
    stats: ProjectileStats,
    projectileSetupFns: ProjectileSetupFn[]
    delayTimer: number
}

export class Player extends PIXI.Container {
    sprite: PIXI.Sprite
    hitbox: PIXI.Graphics
    private hitFilter: PIXI.ColorMatrixFilter
    private hitTimer: number = 0
    private fireTimer: number = 0
    onShoot?: (position: PIXI.PointData, projectileStats: ProjectileStats, projectileSetupFns: ProjectileSetupFn[]) => void
    private queuedShots: QueuedShot[] = []
    private readonly QUEUED_SHOTS_INTERVAL = 0.03
    readonly HITBOX_RADIUS: number = 4
    private readonly MIN_ATTACK_SPEED: number = 0.1 // Player has to be able to attack

    playerStats: PlayerStats = {
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

    projectileStats: ProjectileStats = {
        damage: 1,
        damageMultiplier: 1,
        width: 15,
        height: 15,
        projectileSize: 1,
        projectileSpeed: 600,
        angle: -Math.PI / 2,
        pierce: 1,
    }

    onProjectileSetupHooks: OnProjectileSetupHook[] = []
    onUpdateHooks: OnUpdateHook[] = []
    onFireShotHooks: OnFireShotHook[] = []
    onShootHooks: OnShootHook[] = []
    onHitHooks: OnHitHook[] = []

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

    modifyStat(stat: keyof PlayerStats | keyof ProjectileStats, amount: number, type: ModifyerType = 'ADDITIVE') {
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

    removeUpgradeById(upgradeId: string) {
        this.onUpdateHooks = this.onUpdateHooks.filter(h => h.id !== upgradeId)
        this.onFireShotHooks = this.onFireShotHooks.filter(h => h.id !== upgradeId)
        this.onShootHooks = this.onShootHooks.filter(h => h.id !== upgradeId)
        this.onHitHooks = this.onHitHooks.filter(h => h.id !== upgradeId)
        this.onProjectileSetupHooks = this.onProjectileSetupHooks.filter(h => h.id !== upgradeId)
    }

    addExp(amount: number) {
        this.playerStats.exp += amount
    }

    checkLevelUp(): boolean {
        if (this.playerStats.exp >= this.playerStats.maxExp) {
            this.playerStats.exp -= this.playerStats.maxExp
            this.playerStats.level++
            this.playerStats.maxExp = Math.floor(10 * Math.pow(1.2, this.playerStats.level))
            return true
        }
        return false
    }

    get isInvincible(): boolean {
        return this.playerStats.invincibilityTimer > 0
    }

    get isDead(): boolean {
        return this.playerStats.hp <= 0
    }

    get currentAttackSpeed(): number {
        const raw = (this.playerStats.baseAttackSpeed * (1 + this.playerStats.bonusAttackSpeed)) * this.playerStats.attackSpeedMultiplier
        return Math.max(raw, this.MIN_ATTACK_SPEED)
    }

    setInvincibility(duration: number) {
        if (duration > this.playerStats.invincibilityTimer) {
            this.playerStats.invincibilityTimer = duration
        }
    }

    hit(damage: number = 1, gameContext: GameContext) {
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

    heal(amount: number) {
        if (this.isDead) return
        this.playerStats.hp += amount
        if (this.playerStats.hp > this.playerStats.maxHp) {
            this.playerStats.hp = this.playerStats.maxHp
        }
    }

    update(dt: number, gameContext: GameContext) {
        if (this.isDead) return

        for (const hookWrapper of this.onUpdateHooks) {
            hookWrapper.hook(dt, gameContext)
        }

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

            this.onFireShotHooks.forEach(hook => hook.hook({ ...this.projectileStats }, gameContext))
            const projectileSetupFns = this.onProjectileSetupHooks.map(h => h.hook)

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
                        projectileSetupFns: projectileSetupFns,
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
                this.onShoot?.({ x: this.x + shot.offsetX, y: this.y }, shot.stats, shot.projectileSetupFns)
                this.queuedShots.splice(i, 1)
            }
        }
    }
}