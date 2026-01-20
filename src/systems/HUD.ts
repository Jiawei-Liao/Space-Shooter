// systems/HUD.ts
import * as PIXI from 'pixi.js'

export class HUD extends PIXI.Container {
    private healthGraphics: PIXI.Graphics
    private scoreText: PIXI.Text

    // HP bar style
    private readonly TOTAL_BAR_WIDTH = 240
    private readonly BAR_HEIGHT = 16
    private readonly GAP = 2

    // HP bar colours
    private readonly HEALTHY_COLOUR = 0x00F5D4
    private readonly WARNING_RATIO = 0.5
    private readonly WARNING_COLOUR = 0xFEE440
    private readonly CRITICAL_RATIO = 0.25
    private readonly CRITICAL_COLOUR = 0xFF5400

    constructor() {
        super()

        this.healthGraphics = new PIXI.Graphics()
        this.healthGraphics.position.set(20, 20)
        this.addChild(this.healthGraphics)

        const scoreStyle = new PIXI.TextStyle({
            fontFamily: 'monospace',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0x90E0EF,
        })

        this.scoreText = new PIXI.Text({ text: 'SCORE: 000000', style: scoreStyle })
        this.scoreText.position.set(20, 50)
        this.addChild(this.scoreText)
    }

    update(hp: number, maxHp: number, score: number) {
        this.healthGraphics.clear()

        const safeMaxHp = Math.max(1, maxHp)
        const totalGapWidth = this.GAP * (safeMaxHp - 1)
        const blockWidth = (this.TOTAL_BAR_WIDTH - totalGapWidth) / safeMaxHp

        // HP level colors
        const ratio = hp / safeMaxHp
        let color = this.HEALTHY_COLOUR
        if (ratio < this.WARNING_RATIO) color = this.WARNING_COLOUR
        if (ratio < this.CRITICAL_RATIO) color = this.CRITICAL_COLOUR

        // Draw HP bar
        this.healthGraphics
            .roundRect(-4, -4, this.TOTAL_BAR_WIDTH + 8, this.BAR_HEIGHT + 8, 4)
            .fill({ color: 0x000000, alpha: 0.5 })
            .stroke({ width: 2, color: 0x90E0EF, alpha: 0.3 })

        // HP blocks
        for (let i = 0; i < safeMaxHp; i++) {
            const xPos = i * (blockWidth + this.GAP)
            const isFilled = i < hp

            if (isFilled) {
                this.healthGraphics
                    .rect(xPos, 0, blockWidth, this.BAR_HEIGHT)
                    .fill({ color: color })
                    .rect(xPos, 0, blockWidth, this.BAR_HEIGHT / 2)
                    .fill({ color: 0xFFFFFF, alpha: 0.2 })
            } else {
                this.healthGraphics
                    .rect(xPos, 0, blockWidth, this.BAR_HEIGHT)
                    .fill({ color: 0xFFFFFF, alpha: 0.05 })
                    .stroke({ width: 1, color: 0xFFFFFF, alpha: 0.1 })
            }
        }

        // Update score
        this.scoreText.text = `SCORE: ${score.toString().padStart(6, '0')}`
    }
}