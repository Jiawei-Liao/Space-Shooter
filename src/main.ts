import './style.css'
import * as PIXI from 'pixi.js'

import { GAME_WIDTH, GAME_HEIGHT } from './GameConfig'
import { GameContext } from './GameContext'
import { Background } from './entities/Background'
import { GameState } from './systems/UIManager'

import { UIManager } from './systems/UIManager'
import { HighScoreManager, type HighScore } from './systems/HighScoreManager'
import { InputManager } from './systems/InputManager'

import ship from './assets/ship.png'
import { loadAssets } from './utils/AssetLoader'
import type { UpgradeSource } from './systems/UpgradeManager'

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

    // Background (persistent through all states)
    const background = new Background()
    app.stage.addChild(background)

    // Systems
    const uiManager = new UIManager()
    const highScoreManager = new HighScoreManager()
    const inputManager = new InputManager(app.canvas)

    // Game context
    let gameContext: GameContext | null = null

    // State
    let currentState: GameState = GameState.TITLE
    let currentRunEntry: HighScore | null = null

    function setGameState(state: GameState) {
        const previousState = currentState
        currentState = state
        uiManager.setGameState(state)

        if (state === GameState.TITLE) {
            app.stage.addChildAt(background, 0)

            // Render scores
            highScoreManager.render(uiManager.ScoreListElement)

            // Clean up game if exists
            if (gameContext) {
                gameContext.cleanup()
                app.stage.addChildAt(background, 0)
                gameContext = null
            }
        } else if (state === GameState.PLAYING) {
            // If returning from upgrade menu, resume existing game
            if (previousState === GameState.UPGRADE) return

            if (gameContext) gameContext.cleanup()
            app.stage.addChildAt(background, 0)
            gameContext = new GameContext(app, inputManager, playerShipTexture, projectileTextures, enemyTextures, background)
        } else if (state === GameState.GAME_OVER) {
            if (gameContext) {
                const score = gameContext.player.playerStats.score
                const wave = gameContext.enemyDirector.currentWave

                uiManager.showGameOverStats(score, wave)

                // Add to high score and track the current run
                currentRunEntry = { score, wave, date: Date.now(), watchedAd: false }
                highScoreManager.addScore(currentRunEntry)
            }
        }
    }

    // Bind UI Events
    uiManager.onStart(() => setGameState(GameState.PLAYING))
    uiManager.onRestart(() => setGameState(GameState.PLAYING))
    uiManager.onHome(() => setGameState(GameState.TITLE))

    uiManager.onWatchAd(() => {
        if (currentRunEntry && !currentRunEntry.watchedAd) {
            currentRunEntry.score += 1
            currentRunEntry.watchedAd = true

            uiManager.updateScoreDisplay(currentRunEntry.score)
            uiManager.showAdBanner()

            // Update persistence
            highScoreManager.addScore(currentRunEntry)
        }
    })

    // Initial State
    setGameState(GameState.TITLE)

    function triggerUpgrade(upgradeSource: UpgradeSource) {
        setGameState(GameState.UPGRADE)
        const options = gameContext!.upgradeManager.getUpgradeOptions(gameContext!, upgradeSource)
        uiManager.showUpgradeMenu(options, (selectedUpgrade) => {
            gameContext!.upgradeManager.applyUpgrade(selectedUpgrade, gameContext!)
            setGameState(GameState.PLAYING)
        })
    }

    // Game Loop
    app.ticker.add((time) => {
        const dt = time.deltaTime / 60

        if (currentState === GameState.TITLE) {
            background.update(dt)
        } else if ((currentState === GameState.PLAYING || currentState === GameState.GAME_OVER) && gameContext) {
            // Allow the game to continue in the background while dead
            gameContext.update(dt, gameContext)

            if (currentState === GameState.PLAYING) {
                if (gameContext.player.isDead) {
                    setGameState(GameState.GAME_OVER)
                } else {
                    // Upgrades can only be claimed after wave is cleared
                    if (gameContext.enemyDirector.isWaveClear) {
                        // Check has upgrade to be claimed (after boss wave cleared)
                        if (gameContext.enemyDirector.claimUpgrade()) {
                            triggerUpgrade('bossWave')
                        }
                        // Check Level Up
                        if (gameContext.player.checkLevelUp()) {
                            triggerUpgrade('levelUp')
                        }
                    }
                }
            }
        }
    })
}

start()