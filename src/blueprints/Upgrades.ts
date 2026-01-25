import { getWallHit } from '../GameConfig'
import type { Upgrade } from '../types/Upgrade'

// Base weight is 10

export const UPGRADES: Upgrade[] = [
    {
        id: 'stained_mug',
        name: 'Stained Mug',
        description: '+10% attack speed',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('bonusAttackSpeed', 0.1, 'ADDITIVE')
        }
    },
    {
        id: 'lead_washers',
        name: 'Lead Washers',
        description: '+0.3 damage, -50 projectile speed',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('damage', 0.3, 'ADDITIVE')
            context.player.modifyStat('projectileSpeed', -50, 'ADDITIVE')
        }
    },
    {
        id: 'duct_tape',
        name: 'Duct Tape',
        description: '+1 HP up',
        rarity: 'common',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.playerStats.maxHp < 5
        },
        onApply: (context) => {
            context.player.modifyStat('maxHp', 1, 'ADDITIVE')
            context.player.heal(1)
        }
    },
    {
        id: 'scrap_metal',
        name: 'Scrap Metal',
        description: '+1 HP up',
        rarity: 'common',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.playerStats.maxHp < 5
        },
        onApply: (context) => {
            context.player.modifyStat('maxHp', 1, 'ADDITIVE')
            context.player.heal(1)
        }
    },
    {
        id: 'smuggled_sandwich',
        name: 'Smuggled Sandwich',
        description: '+1 HP up',
        rarity: 'common',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.playerStats.maxHp < 5
        },
        onApply: (context) => {
            context.player.modifyStat('maxHp', 1, 'ADDITIVE')
            context.player.heal(1)
        }
    },
    {
        id: 'lens_wipes',
        name: 'Lens Wipes',
        description: '+50 projectile speed',
        rarity: 'common',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.projectileStats.projectileSpeed < 1000
        },
        onApply: (context) => {
            context.player.modifyStat('projectileSpeed', 50, 'ADDITIVE')
        }
    },
    {
        id: 'spare_bolt',
        name: 'Spare Bolt',
        description: '+0.2 damage',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('damage', 0.2, 'ADDITIVE')
        }
    },
    {
        id: 'nanite_repair_burst',
        name: 'Nanite Repair Burst',
        description: '+5 HP',
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
        id: 'copper_wires',
        name: 'Copper Wires',
        description: '+10% attack speed',
        rarity: 'common',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('bonusAttackSpeed', 0.1, 'ADDITIVE')
        }
    },
    {
        id: 'industrial_coolant',
        name: 'Industrial Coolant',
        description: '+25% attack speed',
        rarity: 'rare',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('bonusAttackSpeed', 0.25, 'ADDITIVE')
        }
    },
    {
        id: 'tungsten_slugs',
        name: 'Tungsten Slugs',
        description: '+1 pierce, +0.5 damage',
        rarity: 'rare',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.projectileStats.pierce < 5
        },
        onApply: (context) => {
            context.player.modifyStat('pierce', 1, 'ADDITIVE')
            context.player.modifyStat('damage', 0.5, 'ADDITIVE')
        }
    },
    {
        id: 'monocle',
        name: 'Monocle',
        description: '+1 pierce, +20% projectile size',
        rarity: 'rare',
        unique: false,
        weight: 10,
        canAppear: (context) => {
            return context.player.projectileStats.pierce < 5
        },
        onApply: (context) => {
            context.player.modifyStat('pierce', 1, 'ADDITIVE')
            context.player.modifyStat('projectileSize', 0.2, 'ADDITIVE')
        }
    },
    {
        id: 'AAA_battery',
        name: 'AAA Battery',
        description: '+2 bullets per wave',
        rarity: 'rare',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('maxProjectilesPerWave', 2, 'ADDITIVE')
        }
    },
    {
        id: 'titanium_hull',
        name: 'Titanium Hull',
        description: '+3 HP up',
        rarity: 'epic',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('maxHp', 3, 'ADDITIVE')
            context.player.heal(3)
        }
    },
    {
        id: 'fuel_cell',
        name: 'Fuel Cell',
        description: '+25% attack speed, +100 projectile speed',
        rarity: 'epic',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('bonusAttackSpeed', 0.25, 'ADDITIVE')
            context.player.modifyStat('projectileSpeed', 100, 'ADDITIVE')
        }
    },
    {
        id: 'unsent_letter',
        name: 'Unsent Letter',
        description: '+25% attack speed, +0.5 damage',
        rarity: 'epic',
        unique: false,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('bonusAttackSpeed', 0.25, 'ADDITIVE')
            context.player.modifyStat('damage', 0.5, 'ADDITIVE')
        }
    },
    {
        id: 'cloaking_device',
        name: 'Cloaking Device',
        description: '+0.5s invincibility duration',
        rarity: 'epic',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('invincibilityDuration', 0.5, 'ADDITIVE')
        }
    },
    {
        id: 'ancient_relic',
        name: 'Ancient Relic',
        description: 'Large stat boost',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('maxHp', 1, 'ADDITIVE')
            context.player.heal(1)
            context.player.modifyStat('damageMultiplier', 0.5, 'ADDITIVE')
            context.player.modifyStat('attackSpeedMultiplier', 0.2, 'ADDITIVE')
            context.player.modifyStat('numProjectiles', 1, 'ADDITIVE')
            context.player.modifyStat('pierce', 1, 'ADDITIVE')
        }
    },
    {
        id: 'pilots_locket',
        name: 'Pilot\'s Locket',
        description: 'Negates first instance of damage per wave',
        rarity: 'epic',
        unique: true,
        weight: 10,
        onApply: (context) => {
            let lastWaveHit = 0
            context.player.onHitHooks.push({
                id: 'pilots_locket',
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
        id: 'billiard_ball',
        name: 'Billiard Ball',
        description: 'Projectiles bounce off walls',
        rarity: 'epic',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.onProjectileSetupHooks.push({
                id: 'billiard_ball',
                hook: (p, _manager) => {
                    let remainingBounces = p.projectileStats.pierce
                    p.onUpdateHooks.push((_dt, _context) => {
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
        id: 'broken_gyroscope',
        name: 'Broken Gyroscope',
        description: 'Projectiles travel in a wave pattern',
        rarity: 'rare',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const frequency = 20
            const amplitude = 0.5

            context.player.onProjectileSetupHooks.push({
                id: 'broken_gyroscope',
                hook: (p, _manager) => {
                    let time = 0
                    let previousWaveAngleOffset = 0

                    p.onUpdateHooks.push((dt, _context) => {
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
        id: 'parasitic_larva',
        name: 'Parasitic Larva',
        description: 'Projectiles pulse and surge',
        rarity: 'rare',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const frequency = 10

            context.player.onProjectileSetupHooks.push({
                id: 'parasitic_larva',
                hook: (p, _manager) => {
                    const baseSpeed = p.projectileStats.projectileSpeed
                    const baseSize = p.projectileStats.projectileSize
                    let time = 0

                    p.onUpdateHooks.push((dt, _context) => {
                        time += dt * frequency

                        const speedMultiplier = 1 + Math.cos(time)
                        p.projectileStats.projectileSpeed = baseSpeed * speedMultiplier

                        const sizePulse = baseSize + 0.375 * Math.sin(time) + 0.125 * Math.abs(Math.sin(time))
                        p.projectileStats.projectileSize = sizePulse
                    })
                }
            })
        }
    },
    {
        id: 'prince_ruperts_drop',
        name: 'Prince Rupert\'s Drop',
        description: 'Projectiles burst into 16 fragments on death',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const numShrapnel = 16

            context.player.onProjectileSetupHooks.push({
                id: 'prince_ruperts_drop',
                hook: (p, _context) => {
                    p.onDestroyHooks.push((context) => {
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
                            context.playerProjectiles.spawn(p.position, 'player_bullet', stats, [], context)
                        }
                    })
                }
            })
        }
    },
    {
        id: 'shattered_mirror',
        name: 'Shattered Mirror',
        description: 'Projectiles release 4 fragments on enemy hit',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            const numShrapnel = 4

            context.player.onProjectileSetupHooks.push({
                id: 'shattered_mirror',
                hook: (p, _context) => {
                    p.onHitHooks.push((_dt, context) => {
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

                            context.playerProjectiles.spawn(p.position, 'player_bullet', stats, [], context)
                        }
                    })
                }
            })
        }
    },
    {
        id: 'icarus_wings',
        name: 'Icarus\' Wings',
        description: '1.5x damage, but be careful of the edge',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('damageMultiplier', 1.5, 'ADDITIVE')

            context.player.onUpdateHooks.push({
                id: 'icarus_wings',
                hook: (_dt, context) => {
                    if (getWallHit(context.player.position)) {
                        context.player.hit(Math.ceil(context.player.playerStats.maxHp / 2), context)
                    }
                }
            })
        }
    },
    {
        id: 'stress_ball',
        name: 'Stress Ball',
        description: '+0.05 damage per enemy projectile',
        rarity: 'legendary',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.onProjectileSetupHooks.push({
                id: 'stress_ball',
                hook: (p, context) => {
                    p.projectileStats.damage += 0.05 * context.enemyProjectiles.activeProjectilePool.length
                }
            })
        }
    },
    {
        id: 'bent_gun_mount',
        name: 'Bent Gun Mount',
        description: '+1 projectiles, but they fan out',
        rarity: 'rare',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('numProjectiles', 1, 'ADDITIVE')

            context.player.onProjectileSetupHooks.push({
                id: 'bent_gun_mount',
                hook: (p, context) => {
                    const dx = p.position.x - context.player.position.x
                    p.projectileStats.angle += dx * 0.01
                }
            })
        }
    },
    {
        id: 'fractured_lens',
        name: 'Fractured Lens',
        description: '+0.2 damage, but unstable aim',
        rarity: 'common',
        unique: true,
        weight: 10,
        onApply: (context) => {
            context.player.modifyStat('damage', 0.2, 'ADDITIVE')

            context.player.onProjectileSetupHooks.push({
                id: 'fractured_lens',
                hook: (p, _context) => {
                    const jitter = (Math.random() - 0.5) * 0.3
                    p.projectileStats.angle += jitter
                }
            })
        }
    }
]
