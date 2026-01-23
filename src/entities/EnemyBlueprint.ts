import * as PIXI from 'pixi.js'
import { Enemy } from './Enemy'
import type { GameContext } from '../GameContext'
import { getSteppedValue } from '../utils/Math'

export type EnemyBehaviorFn = (enemy: Enemy, dt: number, gameContext: GameContext) => void

export interface EnemyStats {
    hp: number
    scoreValue: number
    expValue: number
}
export interface EnemyBlueprint {
    texture: PIXI.Texture
    width: number
    height: number
    hitboxType: 'circle' | 'rectangle'
    generateStats: (wave: number) => EnemyStats
    shootFn: () => EnemyBehaviorFn
}

export const createEnemyBlueprints = (textures: Record<string, PIXI.Texture>): Record<string, EnemyBlueprint> => ({
    FIGHTER: {
        texture: textures['fighter'],
        width: 50,
        height: 50,
        hitboxType: 'circle',
        generateStats: (wave: number) => {
            return {
                hp: getSteppedValue(wave, [
                    { minWave: 1, value: 3 },
                    { minWave: 5, value: 5 },
                    { minWave: 10, value: 10 },
                    { minWave: 20, value: 20 },
                    { minWave: 30, value: (w) => w },
                    { minWave: 50, value: (w) => 0.7 * Math.pow(w, 1.1) },
                ]),
                scoreValue: 10,
                expValue: 3
            }
        },
        shootFn: () => {
            let fireTimer = 2
            const FIRE_INTERVAL = 2
            let burstTimer = 0
            const BURST_INTERVAL = 0.1
            let bulletsToFire = 0
            const BURST_PROJECTILES = 5

            return (enemy, dt, gameContext) => {
                fireTimer -= dt
                if (fireTimer <= 0) {
                    bulletsToFire = BURST_PROJECTILES
                    fireTimer = FIRE_INTERVAL
                }

                // Shoot remaining shots in burst
                if (bulletsToFire > 0) {
                    burstTimer -= dt
                    if (burstTimer <= 0) {
                        bulletsToFire--
                        burstTimer = BURST_INTERVAL
                        gameContext.enemyProjectiles.spawn(
                            { x: enemy.x, y: enemy.y + enemy.height / 2 },
                            'enemy_bullet',
                            {

                                damage: getSteppedValue(gameContext.enemyDirector.currentWave, [
                                    { minWave: 1, value: 1 },
                                    { minWave: 10, value: 2 },
                                    { minWave: 20, value: 4 }
                                ]),
                                damageMultiplier: 1,
                                width: 20,
                                height: 20,
                                sizeScale: 1,
                                projectileSpeed: 200,
                                angle: Math.PI / 2,
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