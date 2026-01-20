import * as PIXI from 'pixi.js'
import { Enemy } from './Enemy'

import type { GameContext } from '../GameContext'

export type EnemyBehaviorFn = (enemy: Enemy, dt: number, gameContext: GameContext) => void

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
            let fireTimer = 2
            let burstTimer = 0;
            let bulletsToFire = 0;

            return (enemy, dt, gameContext) => {
                fireTimer -= dt
                if (fireTimer <= 0) {
                    bulletsToFire = 5
                    fireTimer = 2
                }

                // Shoot remaining shots in burst
                if (bulletsToFire > 0) {
                    burstTimer -= dt
                    if (burstTimer <= 0) {
                        bulletsToFire--
                        burstTimer = 0.1
                        gameContext.enemyProjectiles.spawn(
                            { x: enemy.x, y: enemy.y + enemy.height / 2 },
                            'enemy_bullet',
                            {
                                fireTimer: 0,
                                fireRate: 0,
                                damage: 1,
                                width: 20,
                                height: 20,
                                sizeScale: 1,
                                speed: 200,
                                angle: Math.PI / 2,
                                numProjectiles: 1,
                                pierce: 1
                            },
                            []
                        )
                    }
                }
            }
        },
    }
})