import { GameContext } from '../GameContext'
import type { Upgrade, UpgradeRarity } from './Upgrades'
import { UPGRADES } from './Upgrades'

export type UpgradeSource = 'levelUp' | 'bossWave'

export class UpgradeManager {
    private allUpgrades: Upgrade[]
    private acquiredUpgradeIds: Set<string> = new Set()
    private readonly RARITY_WEIGHTS: Record<UpgradeRarity, number> = {
        'common': 45,
        'rare': 35,
        'epic': 15,
        'legendary': 5
    }
    private upgradeCount: number = 3
    private hasAcquiredLegendary: boolean = false

    constructor() {
        this.allUpgrades = UPGRADES
    }

    public getUpgradeOptions(context: GameContext, upgradeSource: UpgradeSource): Upgrade[] {
        const options: Upgrade[] = []

        // Get pool of available upgrades
        let currentPool = this.allUpgrades.filter(u => {
            // If unique and already acquired, skip
            if (u.unique && this.acquiredUpgradeIds.has(u.id)) return false

            // Check if item has appear condition
            if (u.canAppear && !u.canAppear(context)) return false

            return true
        })

        let seenLegendary = false
        // Select upgrades
        for (let i = 0; i < this.upgradeCount; i++) {
            // If run out of upgrades
            if (currentPool.length === 0) break

            // Boss waves guarantee 1 unique item
            const mustBeUnique = upgradeSource === 'bossWave' && i < 1

            // Get only unique items if mustBeUnique is true
            let slotPool = mustBeUnique ? currentPool.filter(u => u.unique) : currentPool
            // If no unique items are available, use the current pool
            if (slotPool.length === 0) {
                slotPool = currentPool
            }

            // If legendary has not been selected and not seen, roll 4 times
            const rollCount = !this.hasAcquiredLegendary && !seenLegendary ? 4 : 1
            let selectedRarity: UpgradeRarity
            for (let j = 0; j < rollCount; j++) {
                selectedRarity = this.rollRarity(slotPool)
                if (selectedRarity === 'legendary') {
                    seenLegendary = true
                    break
                }
            }

            // Get only upgrades of that rarity
            const rarityPool = slotPool.filter(u => u.rarity === selectedRarity)

            // Select an upgrade of that rarity
            const selectedUpgrade = this.getRandomWeighted(rarityPool)
            options.push(selectedUpgrade)

            // Remove selected upgrade from pool
            currentPool = currentPool.filter(u => u.id !== selectedUpgrade.id)
        }

        // Shuffle options so that guaranteed items are not always first
        return this.shuffle(options)
    }

    private rollRarity(pool: Upgrade[]): UpgradeRarity {
        const availableRarities = Array.from(new Set(pool.map(u => u.rarity)))

        let totalRarityWeight = 0
        for (const rarity of availableRarities) {
            totalRarityWeight += this.RARITY_WEIGHTS[rarity]
        }

        const roll = Math.random() * totalRarityWeight
        let cumulativeWeight = 0
        for (const rarity of availableRarities) {
            cumulativeWeight += this.RARITY_WEIGHTS[rarity]
            if (roll <= cumulativeWeight) {
                return rarity
            }
        }

        return 'common'
    }

    private getRandomWeighted(list: Upgrade[]): Upgrade {
        const totalWeight = list.reduce((sum, u) => sum + u.weight, 0)
        let roll = Math.random() * totalWeight

        for (const upgrade of list) {
            roll -= upgrade.weight
            if (roll <= 0) {
                return upgrade
            }
        }
        return list[0]
    }

    public applyUpgrade(upgrade: Upgrade, context: GameContext) {
        upgrade.onApply(context)
        if (upgrade.unique) {
            this.acquiredUpgradeIds.add(upgrade.id)
        }
        if (upgrade.rarity === 'legendary') {
            this.hasAcquiredLegendary = true
        }
    }

    private shuffle(array: Upgrade[]): Upgrade[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
