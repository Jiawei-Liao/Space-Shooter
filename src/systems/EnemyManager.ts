import * as PIXI from 'pixi.js'
import { ENEMY_LIMIT } from '../GameConfig'
import { GameContext } from '../GameContext'
import { Enemy } from '../entities/Enemy'
import type { EnemyBehaviorFn, EnemyBlueprint } from '../entities/EnemyBlueprint'

export class EnemyManager {
    private enemyPool: Enemy[] = []
    public activeEnemies: Enemy[] = []

    constructor(app: PIXI.Application) {
        for (let i = 0; i < ENEMY_LIMIT; i++) {
            const enemy = new Enemy()
            app.stage.addChild(enemy)
            this.enemyPool.push(enemy)
        }
    }

    spawn(position: PIXI.PointData, wave: number, blueprint: EnemyBlueprint, moveFn: EnemyBehaviorFn, sourceSetId?: string) {
        const enemy = this.enemyPool.find(e => !e.isActive)
        if (enemy) {
            enemy.spawn(position, blueprint.generateStats(wave), blueprint, moveFn, sourceSetId)
            this.activeEnemies.push(enemy)
        }
    }

    update(dt: number, gameContext: GameContext) {
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i]
            enemy.update(dt, gameContext)

            if (!enemy.isActive) {
                this.activeEnemies.splice(i, 1)
            }
        }
    }
}