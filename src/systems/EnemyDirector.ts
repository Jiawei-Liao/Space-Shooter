import { GameContext } from '../GameContext'
import type { EnemySet, SpawnInstruction } from '../types/Enemy'
import { getSteppedValue } from '../utils/Math'
import { ENEMY_SETS } from './EnemySets'

export class EnemyDirector {
    currentWave = -1
    private waveTimer = 0 // Time left before spawning next wave
    isWaveClear = false
    // Time between waves
    private readonly WAVE_INTERVAL = 0.5
    private readonly BOSS_WAVE_INTERVAL = 2
    private waveCostRemaining = 0 // Amount to spend on next wave
    private readonly ENEMY_SET_GENERATION_ATTEMPTS = 50

    private readonly BOSS_WAVE_FREQUENCY = 5
    private readonly DEFAULT_WARP_SPEED = 1
    private readonly SLOW_WARP_SPEED = 5
    private readonly FAST_WARP_SPEED = 20

    private spawnQueue: SpawnInstruction[] = []
    private pendingSets: SpawnInstruction[][] = []
    private enemySets: EnemySet[] = []

    private upgradeAvailable = true
    claimUpgrade() {
        const canClaim = this.upgradeAvailable
        this.upgradeAvailable = false
        return canClaim
    }

    constructor() {
        this.enemySets = ENEMY_SETS
    }

    update(dt: number, context: GameContext) {
        // Try to spawn pending sets
        for (let i = 0; i < this.pendingSets.length; i++) {
            const instructions = this.pendingSets[i]
            if (instructions.length === 0) {
                this.pendingSets.splice(i, 1)
                i--
                continue
            }

            const setId = instructions[0].setId

            // Check if can spawn the set (no existing ID)
            let canSpawn = true
            if (setId) {
                // Active enemies
                const activeConflict = context.enemyManager.activeEnemies.some(e => e.sourceSetId === setId)
                // Currently spawning queue
                const queueConflict = this.spawnQueue.some(instruction => instruction.setId === setId)

                if (activeConflict || queueConflict) {
                    canSpawn = false
                }
            }

            if (canSpawn) {
                this.spawnQueue.push(...instructions)
                this.pendingSets.splice(i, 1)
                i--
            }
        }

        // Wave is complete when:
        // No more pending sets
        // No more enemies in the spawn queue
        // No more active enemies alive
        this.isWaveClear = this.pendingSets.length === 0 &&
            this.spawnQueue.length === 0 &&
            context.enemyManager.activeEnemies.length === 0

        // Wait for timer before starting new wave
        if (this.isWaveClear) {
            this.waveTimer -= dt
            context.player.setInvincibility(this.waveTimer + 0.5)

            // Speed up background during interval
            if (this.currentWave % this.BOSS_WAVE_FREQUENCY === 0) {
                context.background.setWarpFactor(this.FAST_WARP_SPEED)
            } else {
                context.background.setWarpFactor(this.SLOW_WARP_SPEED)
            }

            if (this.waveTimer <= 0) {
                this.startNewWave(context)
            }
        }

        // Spawn enemies from current queue
        for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
            const enemy = this.spawnQueue[i]
            enemy.delay -= dt
            if (enemy.delay <= 0) {
                context.enemyManager.spawn({ x: enemy.x, y: enemy.y }, this.currentWave, enemy.blueprint, enemy.moveFn, enemy.setId)
                this.spawnQueue.splice(i, 1)
            }
        }
    }

    private startNewWave(context: GameContext) {
        this.currentWave++

        // After boss wave, upgrade to be claimed
        if (this.currentWave % this.BOSS_WAVE_FREQUENCY === 0) {
            this.upgradeAvailable = true
        }

        // Reset background speed
        context.background.setWarpFactor(this.DEFAULT_WARP_SPEED)

        console.log(`Starting Wave ${this.currentWave}`)
        // Wave cost scaling
        this.waveCostRemaining = getSteppedValue(this.currentWave, [
            { minWave: 1, value: (w) => w * 10 },
            { minWave: 5, value: (w) => w * 15 - 20 },
            { minWave: 10, value: (w) => Math.pow(w, 1.5) * 10 - 170 },
        ])
        console.log(`Wave cost: ${this.waveCostRemaining}`)

        if (this.currentWave % this.BOSS_WAVE_FREQUENCY === 0) {
            this.waveTimer = this.BOSS_WAVE_INTERVAL
        } else {
            this.waveTimer = this.WAVE_INTERVAL
        }

        // Reset pending sets
        this.pendingSets = []

        // Generate sets
        let attempts = 0
        while (this.waveCostRemaining > 0 && attempts < this.ENEMY_SET_GENERATION_ATTEMPTS) {
            attempts++
            const applicableSets = this.enemySets.filter(s =>
                s.cost <= this.waveCostRemaining &&
                this.currentWave >= (s.minWave ?? 0) &&
                this.currentWave <= (s.maxWave ?? Infinity)
            )

            if (applicableSets.length === 0) break

            const totalWeight = applicableSets.reduce((sum, s) => sum + s.weight, 0)
            let random = Math.random() * totalWeight

            let selectedSet: EnemySet | null = null
            for (const set of applicableSets) {
                random -= set.weight
                if (random <= 0) {
                    selectedSet = set
                    break
                }
            }

            if (selectedSet) {
                this.waveCostRemaining -= selectedSet.cost
                const newInstructions = selectedSet.generateInstructions(context)
                this.pendingSets.push(newInstructions)
            }
        }
    }
}
