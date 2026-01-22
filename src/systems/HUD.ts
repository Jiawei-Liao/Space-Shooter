// systems/HUD.ts
import * as PIXI from 'pixi.js'

export class HUD extends PIXI.Container {
    private healthGraphics: PIXI.Graphics
    private scoreText: PIXI.Text
    private expGraphics: PIXI.Graphics

    // HP bar style
    private readonly TOTAL_BAR_WIDTH = 240
    private readonly BAR_HEIGHT = 16
    private readonly GAP = 2
    private readonly BORDER_PADDING = 4
    private readonly EXP_BAR_HEIGHT = 8

    // HP bar colours (matching CSS)
    private readonly HEALTHY_COLOUR = 0x00FFFF // --colour-primary
    private readonly WARNING_RATIO = 0.5
    private readonly WARNING_COLOUR = 0xFFAA00 // --colour-accent
    private readonly CRITICAL_RATIO = 0.25
    private readonly CRITICAL_COLOUR = 0xFF3333 // --colour-danger

    constructor() {
        super()

        this.healthGraphics = new PIXI.Graphics()
        this.healthGraphics.position.set(20, 20)
        this.addChild(this.healthGraphics)

        this.expGraphics = new PIXI.Graphics()
        this.expGraphics.position.set(20, 20)
        this.addChild(this.expGraphics)

        const scoreStyle = new PIXI.TextStyle({
            fontFamily: 'Orbitron',
            fontSize: 24,
            fontWeight: 'bold',
            fill: this.HEALTHY_COLOUR,
        })

        this.scoreText = new PIXI.Text({ text: 'SCORE: 000000', style: scoreStyle })
        this.scoreText.position.set(20, 50)
        this.addChild(this.scoreText)
    }

    update(hp: number, maxHp: number, score: number, exp: number, maxExp: number) {
        this.healthGraphics.clear()
        this.expGraphics.clear()

        const totalHeight = this.BAR_HEIGHT + 4 + this.EXP_BAR_HEIGHT
        this.healthGraphics
            .roundRect(-this.BORDER_PADDING, -this.BORDER_PADDING, this.TOTAL_BAR_WIDTH + this.BORDER_PADDING * 2, totalHeight + this.BORDER_PADDING * 2, 4)
            .fill({ color: 0x000000, alpha: 0.5 })
            .stroke({ width: 2, color: this.HEALTHY_COLOUR, alpha: 0.3 })

        const safeMaxHp = Math.max(1, maxHp)
        const totalGapWidth = this.GAP * (safeMaxHp - 1)
        const blockWidth = (this.TOTAL_BAR_WIDTH - totalGapWidth) / safeMaxHp

        // HP level colors
        const ratio = hp / safeMaxHp
        let color = this.HEALTHY_COLOUR
        if (ratio < this.WARNING_RATIO) color = this.WARNING_COLOUR
        if (ratio < this.CRITICAL_RATIO) color = this.CRITICAL_COLOUR

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

        const displayExp = Math.min(exp, maxExp)
        const expRatio = Math.max(0, displayExp / maxExp)
        const expColor = 0xFFD700
        const expY = this.BAR_HEIGHT + 4

        this.expGraphics
            .rect(0, expY, this.TOTAL_BAR_WIDTH, this.EXP_BAR_HEIGHT)
            .fill({ color: 0x000000, alpha: 0.3 })
        if (expRatio > 0) {
            this.expGraphics
                .rect(0, expY, this.TOTAL_BAR_WIDTH * expRatio, this.EXP_BAR_HEIGHT)
                .fill({ color: expColor })
        }

        // Update score
        this.scoreText.text = `SCORE: ${score.toString().padStart(6, '0')}`
    }
}