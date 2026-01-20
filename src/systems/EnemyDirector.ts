import { GameContext } from '../GameContext'
import { getSteppedValue } from '../utils/Math'
import { ENEMY_SETS, type EnemySet, type SpawnInstruction } from './EnemySets'

export class EnemyDirector {
    public currentWave = 0
    private waveTimer = 0 // Time left before spawning next wave
    private readonly WAVE_INTERVAL = 2 // Time between waves
    private waveCostRemaining = 0 // Amount to spend on next wave
    private readonly ENEMY_SET_GENERATION_ATTEMPTS = 50

    private spawnQueue: SpawnInstruction[] = []
    private pendingSets: SpawnInstruction[][] = []
    private enemySets: EnemySet[] = []

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
        const isWaveClear = this.pendingSets.length === 0 &&
            this.spawnQueue.length === 0 &&
            context.enemyManager.activeEnemies.length === 0

        // Wait for timer before starting new wave
        if (isWaveClear) {
            this.waveTimer -= dt
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
        console.log(`Starting Wave ${this.currentWave}`)
        // Wave cost scaling
        this.waveCostRemaining = getSteppedValue(this.currentWave, [
            { minWave: 1, value: (w) => w * 10 },
            { minWave: 5, value: (w) => w * 15 - 20 },
            { minWave: 10, value: (w) => Math.pow(w, 1.5) - 170 },
        ])
        console.log(`Wave cost: ${this.waveCostRemaining}`)
        this.waveTimer = this.WAVE_INTERVAL

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
