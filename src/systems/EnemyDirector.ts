import { GameContext } from '../GameContext'
import { ENEMY_SETS, type EnemySet, type SpawnInstruction } from './EnemySets'

export class EnemyDirector {
    private currentWave = 0
    private waveTimer = 0 // Time left before spawning next wave
    private waveCostRemaining = 0 // Amount to spend on next wave

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
                const finalMoveFn = enemy.moveFn || ((e, dt, _ctx) => {
                    e.y += e.stats.speed * dt
                })
                context.enemyManager.spawn({ x: enemy.x, y: enemy.y }, enemy.blueprint, finalMoveFn, enemy.setId)
                this.spawnQueue.splice(i, 1)
            }
        }
    }

    private startNewWave(context: GameContext) {
        this.currentWave++
        console.log(`Starting Wave ${this.currentWave}`)
        // Wave cost scaling
        this.waveCostRemaining = Math.pow(this.currentWave, 1.5) * 10
        this.waveTimer = 2.0

        // Reset pending sets
        this.pendingSets = []

        // Generate sets
        let attempts = 0
        while (this.waveCostRemaining > 0 && attempts < 50) {
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
