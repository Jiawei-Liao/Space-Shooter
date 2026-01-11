import * as PIXI from 'pixi.js'
import type { EnemyBehaviorFn, EnemyBlueprint } from './EnemyBlueprint'
import type { ProjectileManager } from '../systems/ProjectileManager'

export class Enemy extends PIXI.Container {
    public sprite: PIXI.Sprite
    public isActive = false
    public stats!: EnemyBlueprint
    public hp: number = 0
    private shootFn: EnemyBehaviorFn = () => { }
    private moveFn: EnemyBehaviorFn = () => { }
    public offset = { x: 0, y: 0 }

    constructor() {
        super()
        this.sprite = new PIXI.Sprite()
        this.sprite.anchor.set(0.5)
        this.addChild(this.sprite)

        this.isActive = false
        this.visible = false
    }

    spawn(position: PIXI.PointData, blueprint: EnemyBlueprint, moveFn: EnemyBehaviorFn) {
        this.position.set(position.x, position.y)
        this.stats = blueprint
        this.hp = blueprint.hp
        this.sprite.texture = blueprint.texture
        this.sprite.width = blueprint.width
        this.sprite.height = blueprint.height
        this.shootFn = blueprint.shootFn()
        this.moveFn = moveFn

        this.isActive = true
        this.visible = true
    }

    public hit(damage: number) {
        this.hp -= damage
        this.sprite.tint = 0xFF0000
        setTimeout(() => this.sprite.tint = 0xFFFFFF, 100)
        if (this.hp <= 0) {
            this.die()
        }
    }

    private die() {
        this.isActive = false
        this.visible = false
    }

    update(dt: number, playerPos: PIXI.PointData, projectileManager: ProjectileManager) {
        if (!this.isActive) return
        this.shootFn(this, dt, playerPos, projectileManager)
        this.moveFn(this, dt, playerPos, projectileManager)
    }
}