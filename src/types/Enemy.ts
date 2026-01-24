import * as PIXI from 'pixi.js'
import type { Enemy } from '../entities/Enemy'
import type { GameContext } from '../GameContext'

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