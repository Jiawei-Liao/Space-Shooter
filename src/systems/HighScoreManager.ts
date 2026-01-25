export interface HighScore {
    score: number
    wave: number
    date: number
    watchedAd: boolean
}

export class HighScoreManager {
    private highScores: HighScore[] = []
    private readonly STORAGE_KEY = 'spaceShooterHighScores'
    private readonly MAX_SCORES = 5

    constructor() {
        this.loadScores()
    }

    private loadScores() {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        this.highScores = stored ? JSON.parse(stored) : []
    }

    private saveScores() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.highScores))
    }

    getScores(): HighScore[] {
        return [...this.highScores]
    }

    addScore(entry: HighScore) {
        // Check if current entry is already in the list (works for "ad watched" since its the same object)
        if (!this.highScores.includes(entry)) {
            this.highScores.push(entry)
        }

        // Sort descending
        this.highScores.sort((a, b) => b.score - a.score)

        // Keep top 5
        if (this.highScores.length > this.MAX_SCORES) {
            this.highScores.splice(this.MAX_SCORES)
        }

        this.saveScores()
    }

    render(listElement: HTMLElement) {
        listElement.innerHTML = ''

        // Ensure sorted before display
        this.highScores.sort((a, b) => b.score - a.score)

        this.highScores.forEach((entry, index) => {
            const li = document.createElement('li')
            li.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span>${entry.score}</span>
                <span>Wave ${entry.wave}</span>
            `
            listElement.appendChild(li)
        })
    }
}
