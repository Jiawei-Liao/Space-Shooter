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