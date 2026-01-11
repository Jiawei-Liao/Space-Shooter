import './style.css'
import * as PIXI from 'pixi.js'

import { GAME_WIDTH, GAME_HEIGHT, PLAYER_PROJECTILE_LIMIT, ENEMY_PROJECTILE_LIMIT } from './gameConfig'
import { HUD } from './systems/HUD'
import { ProjectileManager } from './systems/ProjectileManager'
import { Player } from './entities/Player'
import { EnemyManager } from './systems/EnemyManager'

import ship from './assets/ship.png'
import { createEnemyBlueprints } from './entities/EnemyBlueprint'
import { loadAssets } from './utils/AssetLoader'

async function start() {
    const app = new PIXI.Application()
    await app.init({ width: GAME_WIDTH, height: GAME_HEIGHT })
    document.body.appendChild(app.canvas)
    app.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    app.stage.eventMode = 'static'

    // Projectiles
    const projectileTextures = await loadAssets(
        import.meta.glob('./assets/projectiles/*.png', { eager: true, import: 'default' })
    )
    const playerProjectiles = new ProjectileManager(app, projectileTextures, PLAYER_PROJECTILE_LIMIT)
    const enemyProjectiles = new ProjectileManager(app, projectileTextures, ENEMY_PROJECTILE_LIMIT)

    // Player
    const shipTexture = await PIXI.Assets.load(ship)
    const player = new Player(shipTexture)
    player.x = GAME_WIDTH / 2
    player.y = GAME_HEIGHT / 2
    player.onShoot = (position, projectileStats, behaviours) => playerProjectiles.spawn(position, 'player_bullet', projectileStats, behaviours)
    app.stage.addChild(player)

    // Enemies
    const enemyTextures = await loadAssets(
        import.meta.glob('./assets/enemies/*.png', { eager: true, import: 'default' })
    )
    const enemyBlueprints = createEnemyBlueprints(enemyTextures)
    const enemyManager = new EnemyManager(app, enemyProjectiles)
    console.log("Loaded Texture Keys:", Object.keys(enemyTextures))

    // TODO: remove this, add to director
    setInterval(() => {
        enemyManager.spawn({ x: Math.random() * (GAME_WIDTH - 50) + 50, y: 50 }, enemyBlueprints.FIGHTER, () => { })
    }, 2000)

    // HUD
    const hud = new HUD()
    app.stage.addChild(hud)

    // Mouse Movement
    let mousePos = { x: player.x, y: player.y }
    app.canvas.addEventListener('mousemove', (e) => {
        const rect = app.canvas.getBoundingClientRect()
        mousePos.x = e.clientX - rect.left
        mousePos.y = e.clientY - rect.top
    })

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            player.hit()
        }
        if (e.key.toLowerCase() === 'o') {
            player.playerStats.hp += 1
            player.playerStats.maxHp += 1
        }
    })

    // Update Loop
    app.ticker.add((time) => {
        const dt = time.deltaTime / 60

        // Movement
        player.update(mousePos.x, mousePos.y, dt)
        playerProjectiles.update(dt)
        enemyManager.update(dt, { x: player.sprite.x, y: player.sprite.y })
        enemyProjectiles.update(dt)

        checkCollisions()

        // HUD
        hud.update(player.playerStats.hp, player.playerStats.maxHp, player.playerStats.score)
    })

    function checkCollisions() {
        const activePlayerProjectiles = playerProjectiles.activeProjectilePool
        const activeEnemies = enemyManager.activeEnemies
        const activeEnemyProjectiles = enemyProjectiles.activeProjectilePool

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

                if (enemy.stats.hitboxType === 'circle') {
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
                    enemy.hit(playerProjectile.projectileStats.damage)
                    playerProjectile.hit(enemy)

                    if (!enemy.isActive) {
                        player.playerStats.score += enemy.stats.scoreValue
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
            if (player.isInvincible) continue

            const dx = projectile.x - player.x
            const dy = projectile.y - player.y
            const dist = dx * dx + dy * dy
            const playerRadius = player.hitboxRadius
            const bulletRadius = projectile.width / 2

            if (dist < (playerRadius + bulletRadius) ** 2) {
                player.hit(projectile.projectileStats.damage)
                projectile.die()
            }
        }
    }
}

start()