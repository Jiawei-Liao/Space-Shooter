import * as PIXI from 'pixi.js'

export type INPUT_INTENTS = 'ACTIVATE_ITEM' | 'NEXT_ITEM' | 'PREVIOUS_ITEM'

export class InputManager extends PIXI.EventEmitter {
    private canvas: HTMLCanvasElement
    mousePos: PIXI.Point = new PIXI.Point(0, 0)
    private intents = new Set<INPUT_INTENTS>()

    constructor(canvas: HTMLCanvasElement) {
        super()
        this.canvas = canvas

        // Mouse movement
        window.addEventListener('mousemove', this.handleMouseMove)

        // Keybinds
        window.addEventListener('keydown', this.handleKeyDown)
    }

    private handleMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect()
        this.mousePos.x = e.clientX - rect.left
        this.mousePos.y = e.clientY - rect.top
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') this.intents.add('ACTIVATE_ITEM')
        if (e.code === 'KeyQ') this.intents.add('NEXT_ITEM')
        if (e.code === 'KeyE') this.intents.add('PREVIOUS_ITEM')
    }

    getIntents(): INPUT_INTENTS[] {
        const current = Array.from(this.intents)
        this.intents.clear()
        return current
    }

    cleanup() {
        window.removeEventListener('mousemove', this.handleMouseMove)
        window.removeEventListener('keydown', this.handleKeyDown)
    }
}
