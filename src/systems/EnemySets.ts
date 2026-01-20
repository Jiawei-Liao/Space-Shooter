import { GameContext } from '../GameContext'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'
import type { EnemyBlueprint, EnemyBehaviorFn } from '../entities/EnemyBlueprint'
import { getSteppedValue } from '../utils/Math'

export interface SpawnInstruction {
    blueprint: EnemyBlueprint
    x: number
    y: number
    delay: number
    moveFn: EnemyBehaviorFn
    setId?: string
}

export interface EnemySet {
    setId?: string
    weight: number
    cost: number
    minWave?: number
    maxWave?: number
    generateInstructions: (gameContext: GameContext) => SpawnInstruction[]
}

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

            for (let i = 0; i < count; i++) {
                instructions.push({
                    blueprint: blueprint,
                    x: spacing * (i + 1),
                    y: -50,
                    delay: 0,
                    setId: 'fighter_line',
                    moveFn: (enemy, dt, _context) => {
                        if (enemy.y < 200) {
                            enemy.y += 200 * dt
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
            let isWalking = false // Whether the circle is walking around after reaching initial target

            // Current circle center
            let centerX = Math.random() * (GAME_WIDTH + 400) - 200
            let centerY = -200

            // Where the circle should move to (Random within top third with 100 padding)
            let targetX = Math.random() * (GAME_WIDTH - 200) + 100
            let targetY = Math.random() * (GAME_HEIGHT / 3) + 100

            let lastUpdateTime = -1

            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2

                instructions.push({
                    blueprint: ctx.enemyBlueprints.FIGHTER,
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    delay: 0,
                    setId: 'fighter_circle',
                    moveFn: (enemy, dt, context) => {
                        // Only check once for new target center
                        if (lastUpdateTime !== context.app.ticker.lastTime) {
                            lastUpdateTime = context.app.ticker.lastTime

                            const dx = targetX - centerX
                            const dy = targetY - centerY
                            const distToTarget = Math.sqrt(dx * dx + dy * dy)

                            if (distToTarget < 20) {
                                let newTargetX, newTargetY, distFromOldCenter
                                let attempts = 0

                                do {
                                    newTargetX = Math.random() * (GAME_WIDTH - 200) + 100
                                    newTargetY = Math.random() * (GAME_HEIGHT / 3) + 100

                                    const diffX = newTargetX - centerX
                                    const diffY = newTargetY - centerY
                                    distFromOldCenter = Math.sqrt(diffX * diffX + diffY * diffY)
                                } while (distFromOldCenter < 100 && attempts++ < 10)

                                targetX = newTargetX
                                targetY = newTargetY

                                isWalking = true
                            } else {
                                // Move center towards target
                                const moveSpeed = isWalking ? 80 : 400
                                centerX += (dx / distToTarget) * moveSpeed * dt
                                centerY += (dy / distToTarget) * moveSpeed * dt
                            }


                        }

                        // Move enemy
                        angle += rotationSpeed * dt
                        enemy.x = centerX + Math.cos(angle) * radius
                        enemy.y = centerY + Math.sin(angle) * radius
                    }
                })
            }
            return instructions
        }
    },
]