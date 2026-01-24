import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'
import type { EnemySet, SpawnInstruction } from '../types/Enemy'
import { getSteppedValue } from '../utils/Math'
import { randomWalkBehaviour, moveToBoundsBehaviour } from './EnemyMoveBehaviours'

export const ENEMY_SETS: EnemySet[] = [
    {
        setId: 'fighter_line',
        weight: 10,
        cost: 10,
        minWave: 1,
        maxWave: undefined,
        generateInstructions: (ctx) => {
            const instructions: SpawnInstruction[] = []
            const count = getSteppedValue(ctx.enemyDirector.currentWave, [
                { minWave: 1, value: 2 },
                { minWave: 3, value: 3 },
                { minWave: 5, value: 4 },
                { minWave: 7, value: 5 },
                { minWave: 10, value: 7 },
            ])
            const spacing = GAME_WIDTH / (count + 1)
            const blueprint = ctx.enemyBlueprints.FIGHTER

            const minY = 100
            const maxY = getSteppedValue(ctx.enemyDirector.currentWave, [
                { minWave: 1, value: 300 },
                { minWave: 3, value: GAME_HEIGHT / 3 },
                { minWave: 6, value: GAME_HEIGHT * 3 / 5 }
            ])

            const uniformChance = 0.5
            const isUniform = Math.random() > uniformChance
            const uniformY = Math.random() * (maxY - minY) + minY

            for (let i = 0; i < count; i++) {
                const targetX = spacing * (i + 1)
                const targetY = isUniform ? uniformY : Math.random() * (maxY - minY) + minY

                const entry = moveToBoundsBehaviour({
                    bounds: { minX: targetX, maxX: targetX, minY: targetY, maxY: targetY },
                    speed: 300
                })

                const randomWalk = randomWalkBehaviour({
                    bounds: { minX: targetX - 100, maxX: targetX + 100, minY: targetY - 30, maxY: targetY + 30 },
                    speed: 50,
                    minMoveDistX: 10,
                    minMoveDistY: 10,
                    threshold: 10
                })

                let isEntering = true

                instructions.push({
                    blueprint: blueprint,
                    x: targetX,
                    y: -50,
                    delay: 0,
                    setId: 'fighter_line',
                    moveFn: (enemy, dt, _context) => {
                        if (isEntering) {
                            if (entry(enemy, dt)) isEntering = false
                        } else {
                            randomWalk(enemy, dt)
                        }
                    }
                })
            }
            return instructions
        }
    },
    {
        setId: 'fighter_circle',
        weight: 10,
        cost: 10,
        minWave: 2,
        maxWave: undefined,
        generateInstructions: (ctx) => {
            const instructions: SpawnInstruction[] = []
            const count = getSteppedValue(ctx.enemyDirector.currentWave, [
                { minWave: 2, value: 1 },
                { minWave: 3, value: 2 },
                { minWave: 4, value: 3 },
                { minWave: 6, value: 4 },
                { minWave: 8, value: 5 },
            ])
            const radius = 100
            const rotationSpeed = 1.5

            const center = { x: Math.random() * (GAME_WIDTH + 400) - 200, y: -200 }

            const entry = moveToBoundsBehaviour({
                bounds: { minX: 100, maxX: GAME_WIDTH - 100, minY: 100, maxY: GAME_HEIGHT / 3 },
                speed: 300
            })

            const randomWalk = randomWalkBehaviour({
                bounds: { minX: 100, maxX: GAME_WIDTH - 100, minY: 100, maxY: GAME_HEIGHT / 3 },
                speed: 50,
                minMoveDistX: 100,
                minMoveDistY: 100,
                threshold: 10
            })

            let isEntering = true
            let lastUpdateTime = -1

            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2

                instructions.push({
                    blueprint: ctx.enemyBlueprints.FIGHTER,
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius,
                    delay: 0,
                    setId: 'fighter_circle',
                    moveFn: (enemy, dt, context) => {
                        // Only check once for new target center
                        if (lastUpdateTime !== context.app.ticker.lastTime) {
                            lastUpdateTime = context.app.ticker.lastTime

                            if (isEntering) {
                                if (entry(center as any, dt)) isEntering = false
                            } else {
                                randomWalk(center as any, dt)
                            }
                        }

                        // Move enemy
                        angle += rotationSpeed * dt
                        enemy.x = center.x + Math.cos(angle) * radius
                        enemy.y = center.y + Math.sin(angle) * radius
                    }
                })
            }
            return instructions
        }
    },
]