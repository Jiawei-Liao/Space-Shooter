export const GameState = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
    UPGRADE: 'UPGRADE'
} as const

export type GameState = typeof GameState[keyof typeof GameState]

export class UIManager {
    // Elements
    private uiLayer: HTMLElement
    private titleScreen: HTMLElement
    private deathScreen: HTMLElement
    private adPopup: HTMLElement
    private scoreList: HTMLElement
    private finalScoreEl: HTMLElement
    private finalWaveEl: HTMLElement
    private upgradeMenu: HTMLElement
    private upgradeCardsContainer: HTMLElement

    // Buttons
    private startBtn: HTMLElement
    private restartBtn: HTMLElement
    private homeBtn: HTMLElement
    private respawnAdBtn: HTMLElement

    constructor() {
        // Bind elements
        this.uiLayer = document.getElementById('ui-layer')!
        this.titleScreen = document.getElementById('title-screen')!
        this.deathScreen = document.getElementById('death-screen')!
        this.adPopup = document.getElementById('ad-banner')!
        this.scoreList = document.getElementById('score-list')!
        this.finalScoreEl = document.getElementById('final-score')!
        this.finalWaveEl = document.getElementById('final-wave')!
        this.upgradeMenu = document.getElementById('upgrade-menu')!
        this.upgradeCardsContainer = document.getElementById('upgrade-cards')!

        this.startBtn = document.getElementById('play-btn')!
        this.restartBtn = document.getElementById('restart-btn')!
        this.homeBtn = document.getElementById('home-btn')!
        this.respawnAdBtn = document.getElementById('ad-btn')!

        // Initial visibility
        this.uiLayer.style.display = ''
    }

    public get ScoreListElement() {
        return this.scoreList
    }

    public setGameState(state: GameState) {
        if (state === GameState.TITLE) {
            this.titleScreen.classList.remove('hidden')
            this.deathScreen.classList.add('hidden')
            this.adPopup.classList.add('hidden')
        } else if (state === GameState.PLAYING) {
            this.titleScreen.classList.add('hidden')
            this.deathScreen.classList.add('hidden')
            this.adPopup.classList.add('hidden')
            this.upgradeMenu.classList.add('hidden')
        } else if (state === GameState.GAME_OVER) {
            this.deathScreen.classList.remove('hidden')
            // Reset ad button functionality visually
            this.respawnAdBtn.removeAttribute('disabled')
            this.respawnAdBtn.style.display = 'block'
        }
    }

    public showGameOverStats(score: number, wave: number) {
        this.finalScoreEl.textContent = score.toString()
        this.finalWaveEl.textContent = wave.toString()
    }

    public updateScoreDisplay(score: number) {
        this.finalScoreEl.innerText = `${score}`
    }

    public showAdBanner() {
        this.adPopup.classList.remove('hidden')
        this.respawnAdBtn.setAttribute('disabled', 'true')
        this.respawnAdBtn.style.display = 'none'
    }

    public onStart(callback: () => void) {
        this.startBtn.addEventListener('click', callback)
    }

    public onRestart(callback: () => void) {
        this.restartBtn.addEventListener('click', callback)
    }

    public onHome(callback: () => void) {
        this.homeBtn.addEventListener('click', callback)
    }

    public onWatchAd(callback: () => void) {
        this.respawnAdBtn.addEventListener('click', () => {
            const adLinks = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll
                'https://www.youtube.com/watch?v=fC7oUOUEEi4', // Stick Bugged
                'https://www.youtube.com/watch?v=OgZzUJud3Q4', // Blue Lobster
            ]
            window.open(adLinks[Math.floor(Math.random() * adLinks.length)], '_blank')
            callback()
        })
    }

    public showUpgradeMenu(upgrades: any[], onSelect: (upgrade: any) => void) {

        this.upgradeMenu!.classList.remove('hidden')
        this.upgradeCardsContainer!.innerHTML = ''

        upgrades.forEach((upgrade) => {
            const card = document.createElement('div')
            card.className = `upgrade-card card-${upgrade.rarity}`

            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <small>${upgrade.unique ? 'UNIQUE' : ''}</small>
                `
            card.addEventListener('click', () => {
                this.upgradeMenu!.classList.add('hidden')
                onSelect(upgrade)
            })

            this.upgradeCardsContainer!.appendChild(card)
        })
    }
}
