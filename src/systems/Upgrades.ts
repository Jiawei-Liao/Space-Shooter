import { GameContext } from '../GameContext'

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Upgrade {
    id: string
    name: string
    description: string
    rarity: UpgradeRarity
    unique: boolean
    weight: number
    onApply: (context: GameContext) => void
    canAppear?: (context: GameContext) => boolean
}

import { getWallHit } from '../GameConfig'

// Base weight is 10

export const UPGRADES: Upgrade[] = [
    {
        id: 'weapon_overclocking',
        name: 'Weapon Overclocking',
        description: '+10% attack speed',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.playerStats.bonusAttackSpeed += context.player.playerStats.baseAttackSpeed * 0.1
        }
    },
    {
        id: 'parallel_emitters',
        name: 'Parallel Emitters',
        description: '+1 projectile',
        rarity: 'epic',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.playerStats.numProjectiles += 1
        }
    },
    {
        id: 'nanite_repair_burst',
        name: 'Nanite Repair Burst',
        description: 'Heals 5 HP',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.heal(5)
        },
        canAppear: (context) => {
            return context.player.playerStats.hp < context.player.playerStats.maxHp
        }
    },
    {
        id: 'frame_hardening',
        name: 'Frame Hardening',
        description: '+1 max HP',
        rarity: 'rare',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.playerStats.maxHp += 1
            context.player.heal(1)
        }
    },
    {
        id: 'weapon_tuning',
        name: 'Weapon Tuning',
        description: '+0.2 damage',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.projectileStats.damage += 0.2
        }
    },
    {
        id: 'coherence_lensing',
        name: 'Coherence Lensing',
        description: '+1 pierce',
        rarity: 'rare',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.projectileStats.pierce += 1
        }
    },
    {
        id: 'zenith_shield',
        name: 'Zenith Shield',
        description: 'Negates first instance of damage per wave',
        rarity: 'epic',
        unique: true,
        weight: 10,
        onApply: (context) => {
            let lastWaveHit = 0
            context.player.onHitHooks.push({
                id: 'zenith_shield',
                hook: (event, gameContext) => {
                    if (gameContext.enemyDirector.currentWave !== lastWaveHit) {
                        lastWaveHit = gameContext.enemyDirector.currentWave
                        event.damage = 0
                    }
                }
            })
        }
    },
    {
        id: 'vector_slugs',
        name: 'Vector Slugs',
        description: 'Projectiles bounce off walls',
        rarity: 'epic',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.projectileSetupHooks.push({
                id: 'vector_slugs',
                hook: (p, _manager) => {
                    let remainingBounces = p.projectileStats.pierce
                    p.onUpdateHooks.push((_dt, _ctx) => {
                        if (remainingBounces <= 0) return

                        const hit = getWallHit(p.position)
                        if (!hit) return

                        switch (hit) {
                            case 'left':
                            case 'right':
                                p.projectileStats.angle = Math.PI - p.projectileStats.angle
                                break
                            case 'top':
                            case 'bottom':
                                p.projectileStats.angle = -p.projectileStats.angle
                                break
                        }
                        remainingBounces--
                        p.hitTargets.clear()
                    })
                }
            })
        }
    },
    {
        id: 'oscillation_drive',
        name: 'Oscillation Drive',
        description: 'Projectiles travel in a wave pattern',
        rarity: 'rare',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const frequency = 20
            const amplitude = 0.5

            context.player.projectileSetupHooks.push({
                id: 'oscillation_drive',
                hook: (p, _manager) => {
                    let time = 0
                    let previousWaveAngleOffset = 0

                    p.onUpdateHooks.push((dt, _ctx) => {
                        time += dt
                        const currentWaveAngleOffset = Math.cos(time * frequency) * amplitude
                        p.projectileStats.angle += currentWaveAngleOffset - previousWaveAngleOffset
                        previousWaveAngleOffset = currentWaveAngleOffset
                    })
                }
            })
        }
    },
    {
        id: 'terminal_fragments',
        name: 'Terminal Fragments',
        description: 'Projectiles split into 8 fragments on impact',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const numShrapnel = 8

            context.player.projectileSetupHooks.push({
                id: 'terminal_fragments',
                hook: (p, manager) => {
                    p.onDestroyHooks.push((_ctx) => {
                        const angleStep = (Math.PI * 2) / numShrapnel
                        // Random start angle so it's not always the same
                        const startAngle = Math.random() * Math.PI * 2

                        for (let i = 0; i < numShrapnel; i++) {
                            const stats = { ...p.projectileStats }
                            stats.angle = startAngle + (i * angleStep)
                            stats.projectileSpeed = stats.projectileSpeed / 2
                            stats.width = stats.width / 3
                            stats.height = stats.height / 3
                            stats.damage = stats.damage / 3
                            stats.pierce = 1

                            // Shrapnel rounds don't have behaviours
                            manager.spawn(p.position, 'player_bullet', stats, [])
                        }
                    })
                }
            })
        }
    },
    {
        id: 'impact_splinters',
        name: 'Impact Splinters',
        description: 'Projectiles split into 4 fragments on hit',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const numShrapnel = 4

            context.player.projectileSetupHooks.push({
                id: 'impact_splinters',
                hook: (p, manager) => {
                    p.onHitHooks.push((_dt, _ctx) => {
                        const angleStep = (Math.PI * 2) / numShrapnel
                        const startAngle = Math.random() * Math.PI * 2

                        for (let i = 0; i < numShrapnel; i++) {
                            const stats = { ...p.projectileStats }
                            stats.angle = startAngle + (i * angleStep)
                            stats.projectileSpeed = stats.projectileSpeed / 2
                            stats.width = stats.width / 4
                            stats.height = stats.height / 4
                            stats.damage = stats.damage / 4
                            stats.pierce = 1

                            manager.spawn(p.position, 'player_bullet', stats, [])
                        }
                    })
                }
            })
        }
    },
    {
        id: 'statis_discharge',
        name: 'Statis Discharge',
        description: 'On hit, damages all enemies',
        rarity: 'rare',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.onHitHooks.push({
                id: 'statis_discharge',
                hook: (_event, gameContext) => {
                    gameContext.enemyManager.activeEnemies.forEach((enemy) => {
                        enemy.hit(context.player.projectileStats.damage + 20)
                    })
                }
            })
        }
    }
]
