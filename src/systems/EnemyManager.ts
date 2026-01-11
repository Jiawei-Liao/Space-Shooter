import * as PIXI from 'pixi.js'
import { ENEMY_LIMIT } from '../gameConfig'
import { Enemy } from '../entities/Enemy'
import type { EnemyBehaviorFn, EnemyBlueprint } from '../entities/EnemyBlueprint'

import type { ProjectileManager } from './ProjectileManager'

export class EnemyManager {
    private enemyPool: Enemy[] = []
    public activeEnemies: Enemy[] = []
    private projectileManager: ProjectileManager

    constructor(app: PIXI.Application, projectileManager: ProjectileManager) {
        this.projectileManager = projectileManager
        for (let i = 0; i < ENEMY_LIMIT; i++) {
            const enemy = new Enemy()
            app.stage.addChild(enemy)
            this.enemyPool.push(enemy)
        }
    }

    spawn(position: PIXI.PointData, blueprint: EnemyBlueprint, moveFn: EnemyBehaviorFn) {
        const enemy = this.enemyPool.find(e => !e.isActive)
        if (enemy) {
            enemy.spawn(position, blueprint, moveFn)
            this.activeEnemies.push(enemy)
        }
    }

    update(dt: number, playerPos: PIXI.PointData) {
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i]
            enemy.update(dt, playerPos, this.projectileManager)

            if (!enemy.isActive) {
                this.activeEnemies.splice(i, 1)
            }
        }
    }
}