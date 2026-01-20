export function smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

export function getHitFlashAlpha(timer: number, dropStart: number = 0.05): number {
    return smoothStep(0, dropStart, timer)
}


export type ScalableValue<T> = T | ((wave: number) => T)
export interface StatStep<T> {
    minWave: number
    value: ScalableValue<T>
}

export function getSteppedValue<T>(currentWave: number, steps: StatStep<T>[]): T {
    const sortedSteps = [...steps].sort((a, b) => b.minWave - a.minWave)
    const match = sortedSteps.find(step => currentWave >= step.minWave)
    const result = match ? match.value : steps[0].value
    if (typeof result === 'function') {
        return (result as (wave: number) => T)(currentWave)
    }
    return result
}