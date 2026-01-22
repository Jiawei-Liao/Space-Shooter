import * as PIXI from 'pixi.js'

export const GAME_WIDTH = 600
export const GAME_HEIGHT = 1000
export const PLAYER_PROJECTILE_LIMIT = 200
export const ENEMY_PROJECTILE_LIMIT = 500
export const PARTICLE_POOL_SIZE = 200
export const ENEMY_LIMIT = 100

export const PROJECTILE_DIE_ZONE = 50
export const isOutOfBounds = (position: PIXI.PointData): boolean => {
    return (
        position.x < -PROJECTILE_DIE_ZONE ||
        position.x > GAME_WIDTH + PROJECTILE_DIE_ZONE ||
        position.y < -PROJECTILE_DIE_ZONE ||
        position.y > GAME_HEIGHT + PROJECTILE_DIE_ZONE
    )
}

export type WallSide = 'left' | 'right' | 'top' | 'bottom'
export const getWallHit = (position: PIXI.PointData): WallSide | null => {
    if (position.x <= 0) return 'left'
    if (position.x >= GAME_WIDTH) return 'right'
    if (position.y <= 0) return 'top'
    if (position.y >= GAME_HEIGHT) return 'bottom'
    return null
}