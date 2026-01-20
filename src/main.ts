import './style.css'
import * as PIXI from 'pixi.js'

import { GAME_WIDTH, GAME_HEIGHT } from './GameConfig'
import { GameContext } from './GameContext'

import ship from './assets/ship.png'
import { loadAssets } from './utils/AssetLoader'

async function start() {
    const app = new PIXI.Application()
    await app.init({ width: GAME_WIDTH, height: GAME_HEIGHT })
    document.body.appendChild(app.canvas)
    app.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    app.stage.eventMode = 'static'

    // Load assets
    const playerShipTexture = await PIXI.Assets.load(ship)
    const projectileTextures = await loadAssets(
        import.meta.glob('./assets/projectiles/*.png', { eager: true, import: 'default' })
    )
    const enemyTextures = await loadAssets(
        import.meta.glob('./assets/enemies/*.png', { eager: true, import: 'default' })
    )

    // Create game context
    const gameContext = new GameContext(app, playerShipTexture, projectileTextures, enemyTextures)

    // Mouse Movement
    let mousePos = new PIXI.Point(GAME_WIDTH / 2, GAME_HEIGHT / 2)
    app.canvas.addEventListener('mousemove', (e) => {
        const rect = app.canvas.getBoundingClientRect()
        mousePos.x = e.clientX - rect.left
        mousePos.y = e.clientY - rect.top
    })

    // Update Loop
    app.ticker.add((time) => {
        const dt = time.deltaTime / 60
        gameContext.update(dt, mousePos, gameContext)
    })
}

start()