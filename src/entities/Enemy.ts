import * as PIXI from 'pixi.js'
import { GameContext } from '../GameContext'
import { getHitFlashAlpha } from '../utils/Math'
import type { EnemyBehaviorFn, EnemyBlueprint, EnemyStats } from '../types/Enemy'

export class Enemy extends PIXI.Container {
    public sprite: PIXI.Sprite
    private hitFilter: PIXI.ColorMatrixFilter
    private hitFilterTimer: number = 0
    private hitFilterDuration: number = 0.1
    public isActive = false
    public hitboxType: 'circle' | 'rectangle' = 'circle'
    public stats!: EnemyStats
    public hp: number = 0
    private shootFn: EnemyBehaviorFn = () => { }
    private moveFn: EnemyBehaviorFn = () => { }
    public offset = { x: 0, y: 0 }
    public sourceSetId?: string

    constructor() {
        super()
        this.sprite = new PIXI.Sprite()
        this.sprite.anchor.set(0.5)
        this.addChild(this.sprite)

        this.hitFilter = new PIXI.ColorMatrixFilter()
        this.hitFilter.brightness(2, false)
        this.hitFilter.enabled = false
        this.sprite.filters = [this.hitFilter]

        this.isActive = false
        this.visible = false
    }

    spawn(position: PIXI.PointData, stats: EnemyStats, blueprint: EnemyBlueprint, moveFn: EnemyBehaviorFn, sourceSetId?: string) {
        this.position.set(position.x, position.y)
        this.stats = stats
        this.hp = stats.hp
        this.sprite.texture = blueprint.texture
        this.sprite.width = blueprint.width
        this.sprite.height = blueprint.height
        this.hitboxType = blueprint.hitboxType
        this.shootFn = blueprint.shootFn()
        this.moveFn = moveFn
        this.sourceSetId = sourceSetId

        this.isActive = true
        this.visible = true
    }

    public hit(damage: number) {
        this.hp -= damage

        this.hitFilterTimer = this.hitFilterDuration
        this.hitFilter.enabled = true
        this.hitFilter.alpha = 1.0

        if (this.hp <= 0) {
            this.die()
        }
    }

    private die() {
        this.isActive = false
        this.visible = false
    }

    update(dt: number, gameContext: GameContext) {
        if (!this.isActive) return

        if (this.hitFilterTimer > 0) {
            this.hitFilterTimer -= dt

            if (this.hitFilterTimer <= 0) {
                this.hitFilterTimer = 0
                this.hitFilter.enabled = false
            } else {
                this.hitFilter.alpha = getHitFlashAlpha(this.hitFilterTimer)
            }
        }

        this.shootFn(this, dt, gameContext)
        this.moveFn(this, dt, gameContext)
    }
}