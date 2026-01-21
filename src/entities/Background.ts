import * as PIXI from 'pixi.js'
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig'

interface Star {
    sprite: PIXI.Graphics
    baseSpeed: number
    x: number
    y: number
    scale: number
}

export class Background extends PIXI.Container {
    private stars: Star[] = []
    private warpFactor: number = 1.0
    private targetWarpFactor: number = 1.0
    private readonly STAR_COUNT = 200
    private readonly DIAMOND_CHANCE = 0.2
    private readonly CIRCLE_STAR_SIZE = 1.5
    private readonly DIAMOND_STAR_SIZE = 2.2

    constructor() {
        super()
        this.createStars()
    }

    private createStars() {
        for (let i = 0; i < this.STAR_COUNT; i++) {
            const isDiamond = Math.random() < this.DIAMOND_CHANCE

            const starGraphics = new PIXI.Graphics()

            // Depth factor (0.5 to 1.5) - affects speed and size
            const depth = 0.5 + Math.random()

            if (isDiamond) {
                starGraphics.moveTo(0, -this.DIAMOND_STAR_SIZE)
                starGraphics.lineTo(this.DIAMOND_STAR_SIZE, 0)
                starGraphics.lineTo(0, this.DIAMOND_STAR_SIZE)
                starGraphics.lineTo(-this.DIAMOND_STAR_SIZE, 0)
                starGraphics.closePath()
                starGraphics.fill({ color: 0xffffff, alpha: 0.8 * depth })
            } else {
                starGraphics.circle(0, 0, this.CIRCLE_STAR_SIZE)
                starGraphics.fill({ color: 0xffffff, alpha: 0.5 * depth })
            }

            const star: Star = {
                sprite: starGraphics,
                baseSpeed: 50 * depth,
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                scale: depth
            }

            starGraphics.x = star.x
            starGraphics.y = star.y
            starGraphics.scale.set(star.scale)

            this.addChild(starGraphics)
            this.stars.push(star)
        }
    }

    public setWarpFactor(factor: number) {
        this.targetWarpFactor = factor
    }

    public update(dt: number) {
        // Smoothly increase current warp factor to target (Same as in ProjectileManager)
        this.warpFactor += (this.targetWarpFactor - this.warpFactor) * 5.0 * dt

        for (const star of this.stars) {
            // Move star
            star.y += star.baseSpeed * this.warpFactor * dt

            // Star reached the end, wrap around to a new random position
            if (star.y > GAME_HEIGHT + 100) {
                star.y = Math.random() * 40 - 50
                star.x = Math.random() * GAME_WIDTH
            }

            // Update sprite position
            star.sprite.y = star.y
            star.sprite.x = star.x

            // Stretch stars based on warp factor
            star.sprite.scale.y = Math.max(1, this.warpFactor * star.scale)
        }
    }
}
