import * as PIXI from 'pixi.js'
import { Enemy } from './Enemy'

import type { ProjectileManager } from '../systems/ProjectileManager'
// import { ProjectileBehaviours } from '../systems/ProjectileBehaviours'

export type EnemyBehaviorFn = (enemy: Enemy, dt: number, playerPos: PIXI.PointData, projectileManager: ProjectileManager) => void

export interface EnemyBlueprint {
    texture: PIXI.Texture
    width: number
    height: number
    hitboxType: 'circle' | 'rectangle'
    hp: number
    speed: number
    scoreValue: number
    shootFn: () => EnemyBehaviorFn
}

export const createEnemyBlueprints = (textures: Record<string, PIXI.Texture>): Record<string, EnemyBlueprint> => ({
    FIGHTER: {
        texture: textures['fighter'],
        width: 50,
        height: 50,
        hitboxType: 'circle',
        hp: 3,
        speed: 150,
        scoreValue: 100,
        shootFn: () => {
            let fireTimer = 0

            return (enemy, dt, _playerPos, projectileManager) => {
                fireTimer -= dt
                if (fireTimer <= 0) {
                    fireTimer = 2

                    projectileManager.spawn(
                        { x: enemy.x, y: enemy.y + enemy.height / 2 },
                        'enemy_bullet',
                        {
                            fireTimer: 0,
                            fireRate: 0,
                            damage: 1,
                            width: 20,
                            height: 20,
                            sizeScale: 1,
                            speed: 300,
                            angle: Math.PI / 2,
                            numProjectiles: 1,
                            pierce: 1
                        },
                        []
                    )
                }
            }
        },
    }
})