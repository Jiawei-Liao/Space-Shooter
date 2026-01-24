import * as PIXI from 'pixi.js'

import { GAME_WIDTH, GAME_HEIGHT, PLAYER_PROJECTILE_LIMIT, ENEMY_PROJECTILE_LIMIT } from './GameConfig'

import { Player } from './entities/Player'
import { ProjectileManager } from './systems/ProjectileManager'
import { EnemyManager } from './systems/EnemyManager'
import { HUD } from './systems/HUD'
import { createEnemyBlueprints, type EnemyBlueprint } from './entities/EnemyBlueprint'
import { EnemyDirector } from './systems/EnemyDirector'
import { Background } from './entities/Background'
import { ExpManager } from './systems/ExpManager'
import { UpgradeManager } from './systems/UpgradeManager'
import { InputManager } from './systems/InputManager'

export class GameContext {
    public app: PIXI.Application
    public player: Player
    public playerProjectiles: ProjectileManager
    public enemyProjectiles: ProjectileManager
    public enemyManager: EnemyManager
    public enemyDirector: EnemyDirector
    public hud: HUD
    public enemyBlueprints: Record<string, EnemyBlueprint>
    public background: Background
    public expManager: ExpManager
    public upgradeManager: UpgradeManager
    public inputManager: InputManager

    constructor(app: PIXI.Application, inputManager: InputManager, playerShipTexture: PIXI.Texture, projectileTextures: Record<string, PIXI.Texture>, enemyTextures: Record<string, PIXI.Texture>, background: Background) {
        this.app = app
        this.inputManager = inputManager

        // Background
        this.background = background

        // Layers
        const playerShipLayer = new PIXI.Container()
        const enemyShipLayer = new PIXI.Container()
        const playerProjectileLayer = new PIXI.Container()
        const enemyProjectileLayer = new PIXI.Container()
        const expLayer = new PIXI.Container()

        app.stage.addChild(playerShipLayer)
        app.stage.addChild(enemyShipLayer)
        app.stage.addChild(playerProjectileLayer)
        app.stage.addChild(enemyProjectileLayer)
        app.stage.addChild(expLayer)

        // Projectiles
        this.playerProjectiles = new ProjectileManager(playerProjectileLayer, projectileTextures, PLAYER_PROJECTILE_LIMIT, true)
        this.enemyProjectiles = new ProjectileManager(enemyProjectileLayer, projectileTextures, ENEMY_PROJECTILE_LIMIT)

        // Setup Player
        this.player = new Player(playerShipTexture)
        this.player.x = GAME_WIDTH / 2
        this.player.y = GAME_HEIGHT / 2
        this.player.onShoot = (position, projectileStats, setupHooks) => this.playerProjectiles.spawn(position, 'player_bullet', projectileStats, setupHooks)
        playerShipLayer.addChild(this.player)

        // Setup Enemies
        this.enemyBlueprints = createEnemyBlueprints(enemyTextures)
        this.enemyManager = new EnemyManager(enemyShipLayer)
        this.enemyDirector = new EnemyDirector()
        this.expManager = new ExpManager(expLayer)
        this.upgradeManager = new UpgradeManager()

        this.hud = new HUD()
        app.stage.addChild(this.hud)
    }

    update(dt: number, gameContext: GameContext) {
        this.background.update(dt)

        this.player.update(dt, gameContext)
        this.playerProjectiles.update(dt, gameContext)
        this.enemyDirector.update(dt, gameContext)
        this.enemyManager.update(dt, gameContext)
        this.enemyProjectiles.update(dt, gameContext)
        this.expManager.update(dt, gameContext)

        this.checkCollisions()

        this.hud.update(this.player.playerStats.hp, this.player.playerStats.maxHp, this.player.playerStats.score, this.player.playerStats.exp, this.player.playerStats.maxExp)
    }

    checkCollisions() {
        const activePlayerProjectiles = this.playerProjectiles.activeProjectilePool
        const activeEnemies = this.enemyManager.activeEnemies
        const activeEnemyProjectiles = this.enemyProjectiles.activeProjectilePool

        // Player projectile vs Enemy
        for (let i = activePlayerProjectiles.length - 1; i >= 0; i--) {
            const playerProjectile = activePlayerProjectiles[i]

            for (let j = activeEnemies.length - 1; j >= 0; j--) {
                const enemy = activeEnemies[j]

                // If the enemy already died this loop
                if (!enemy.isActive) continue

                // If enemy was already hit by this projectile
                if (playerProjectile.hasAlreadyHit(enemy)) continue

                let isHit = false

                if (enemy.hitboxType === 'circle') {
                    // Circle collision
                    const dx = playerProjectile.x - enemy.x
                    const dy = playerProjectile.y - enemy.y
                    const dist = dx * dx + dy * dy

                    const enemyHitboxRadius = enemy.width / 2
                    const bulletHitbox = playerProjectile.width / 2

                    if (dist < (enemyHitboxRadius + bulletHitbox) * (enemyHitboxRadius + bulletHitbox)) {
                        isHit = true
                    }
                } else {
                    // Rectangle collision
                    const ew = enemy.width / 2
                    const eh = enemy.height / 2

                    if (playerProjectile.x > enemy.x - ew && playerProjectile.x < enemy.x + ew &&
                        playerProjectile.y > enemy.y - eh && playerProjectile.y < enemy.y + eh) {
                        isHit = true
                    }
                }

                if (isHit) {
                    enemy.hit(playerProjectile.projectileStats.damage * playerProjectile.projectileStats.damageMultiplier)
                    playerProjectile.hit(enemy, this)

                    if (!enemy.isActive) {
                        this.player.playerStats.score += enemy.stats.scoreValue
                        // Drop Exp
                        this.expManager.spawn(enemy.x, enemy.y, enemy.stats.expValue)
                    }
                    if (!playerProjectile.isActive) {
                        break
                    }
                }
            }
        }

        // Enemy Projectiles vs Player
        for (let i = activeEnemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = activeEnemyProjectiles[i]
            if (this.player.isInvincible || this.player.isDead) continue

            const dx = projectile.x - this.player.x
            const dy = projectile.y - this.player.y
            const dist = dx * dx + dy * dy
            const playerRadius = this.player.HITBOX_RADIUS
            const bulletRadius = projectile.width / 2

            if (dist < (playerRadius + bulletRadius) ** 2) {
                this.player.hit(projectile.projectileStats.damage, this)
                projectile.die(this)
            }
        }
    }

    cleanup() {
        this.app.stage.removeChild(this.background)
        this.app.stage.removeChild(this.hud)

        this.app.stage.removeChildren()
    }
}