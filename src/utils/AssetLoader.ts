import * as PIXI from 'pixi.js'

export async function loadAssets(assetList: Record<string, unknown>): Promise<Record<string, PIXI.Texture>> {
    const aliases: string[] = []

    for (const path in assetList) {
        const alias = path.split('/').pop()?.replace(/\.\w+$/, '') || path

        PIXI.Assets.add({
            alias: alias,
            src: assetList[path] as string
        })
        aliases.push(alias)
    }

    return await PIXI.Assets.load<PIXI.Texture>(aliases)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

export function getHitFlashAlpha(timer: number, dropStart: number = 0.05): number {
    return smoothstep(0, dropStart, timer)
}