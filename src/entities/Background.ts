import * as PIXI from 'pixi.js'
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig'

interface Star {
    sprite: PIXI.Graphics
    baseSpeed: number
    depth: number
}

interface StarConfig {
    weight: number,
    graphic: PIXI.GraphicsContext
}

export class Background extends PIXI.Container {
    private stars: Star[] = []
    warpFactor: number = 1.0
    private targetWarpFactor: number = 1.0
    public readonly BASE_SPEED: number = 50
    backgroundSpeed = 50

    private readonly STAR_CONFIG: StarConfig[] = [
        { // Circle star
            weight: 80,
            graphic: new PIXI.GraphicsContext().circle(0, 0, 1.5).fill({ color: 0xffffff, alpha: 0.5 })
        },
        { // Diamond star
            weight: 20,
            graphic: new PIXI.GraphicsContext()
                .moveTo(0, -2.2)
                .lineTo(2.2, 0)
                .lineTo(0, 2.2)
                .lineTo(-2.2, 0)
                .closePath()
                .fill({ color: 0xffffff, alpha: 0.8 })
        }
    ]

    private readonly STAR_COUNT = 200
    private readonly SCREEN_Y_OFFSET = 100

    constructor() {
        super()
        this.createStars()
    }

    private createStars() {
        const totalWeight = this.STAR_CONFIG.reduce((sum, c) => sum + c.weight, 0)

        for (let i = 0; i < this.STAR_COUNT; i++) {
            // Randomly choose a star type
            const random = Math.random() * totalWeight
            let currentWeight = 0

            let selectedStar = this.STAR_CONFIG[0]

            for (const star of this.STAR_CONFIG) {
                currentWeight += star.weight
                if (random <= currentWeight) {
                    selectedStar = star
                    break
                }
            }


            // Depth factor (0.5 to 1.5) - affects speed and size
            const depth = 0.5 + Math.random()

            // Create star
            const starGraphics = new PIXI.Graphics(selectedStar.graphic)
            starGraphics.x = Math.random() * GAME_WIDTH
            starGraphics.y = Math.random() * (GAME_HEIGHT + this.SCREEN_Y_OFFSET * 2) - this.SCREEN_Y_OFFSET
            starGraphics.scale.set(depth)

            this.addChild(starGraphics)

            this.stars.push({
                sprite: starGraphics,
                baseSpeed: this.BASE_SPEED * depth,
                depth: depth
            })
        }
    }

    public setWarpFactor(factor: number) {
        this.targetWarpFactor = factor
    }

    public update(dt: number) {
        // Smoothly increase current warp factor to target
        this.warpFactor += (this.targetWarpFactor - this.warpFactor) * 5.0 * dt
        this.backgroundSpeed = this.BASE_SPEED * this.warpFactor

        for (const star of this.stars) {
            // Move star
            star.sprite.y += this.backgroundSpeed * dt

            // Star reached the end, wrap around to a new random position
            if (star.sprite.y > GAME_HEIGHT + this.SCREEN_Y_OFFSET) {
                star.sprite.y = -this.SCREEN_Y_OFFSET
                star.sprite.x = Math.random() * GAME_WIDTH
            }

            // Stretch stars based on warp factor
            star.sprite.scale.y = Math.max(1, this.warpFactor * star.depth)
        }
    }
}
