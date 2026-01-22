import { getWallHit } from '../GameConfig'
import { Projectile } from '../entities/Projectile'
import type { ProjectileManager } from './ProjectileManager'

export interface ProjectileUpdateContext {
    p: Projectile
    dt: number
    manager: ProjectileManager
}

export interface ProjectileLifecycleContext {
    p: Projectile
    manager: ProjectileManager
}

export interface ProjectileBehavior {
    update(context: ProjectileUpdateContext): void
    onHit?(context: ProjectileLifecycleContext): void
    onDestroy?(context: ProjectileLifecycleContext): void
}

export const ProjectileBehaviours = {
    Bouncing: (maxBounces: number = 2): ProjectileBehavior => {
        let remainingBounces = maxBounces

        return {
            update: (context) => {
                if (remainingBounces <= 0) return

                const hit = getWallHit(context.p.position)
                if (!hit) return

                switch (hit) {
                    case 'left':
                    case 'right':
                        context.p.projectileStats.angle = Math.PI - context.p.projectileStats.angle
                        break

                    case 'top':
                    case 'bottom':
                        context.p.projectileStats.angle = -context.p.projectileStats.angle
                        break
                }

                remainingBounces--
            }
        }
    },
    Wavy: (frequency: number = 20, amplitude: number = 0.5): ProjectileBehavior => {
        let time = 0
        let previousWaveAngleOffset = 0

        return {
            update: (context) => {
                time += context.dt
                const currentWaveAngleOffset = Math.cos(time * frequency) * amplitude
                context.p.projectileStats.angle += currentWaveAngleOffset - previousWaveAngleOffset
                previousWaveAngleOffset = currentWaveAngleOffset
            }
        }
    },
    Shrapnel: (numShrapnel: number = 8, shrapnelType: string): ProjectileBehavior => {
        return {
            update: (_context) => { },
            onDestroy: (context) => {
                const angleStep = (Math.PI * 2) / numShrapnel
                for (let i = 0; i < numShrapnel; i++) {
                    const stats = { ...context.p.projectileStats }
                    stats.angle = context.p.projectileStats.angle + (i * angleStep)
                    stats.projectileSpeed = stats.projectileSpeed / 2
                    stats.width = stats.width / 2
                    stats.height = stats.height / 2
                    stats.damage = Math.ceil(stats.damage / 2)
                    stats.pierce = 1

                    context.manager.spawn(context.p.position, shrapnelType, stats, [])
                }
            }
        }
    },

    SlowDown: (minSpeed: number = 0, dragFactor: number = 0.5): ProjectileBehavior => {
        return {
            update: ({ p, dt }) => {
                const currentSpeed = p.projectileStats.projectileSpeed
                if (currentSpeed > minSpeed) {
                    p.projectileStats.projectileSpeed = Math.max(minSpeed, currentSpeed * Math.pow(dragFactor, dt))
                }
            }
        }
    }
}