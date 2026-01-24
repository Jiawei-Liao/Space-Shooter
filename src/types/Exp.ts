export const EXP_TIERS = {
    GOLD: { value: 25, color: 0xFFD700, size: 4, glow: 0.4 },
    SILVER: { value: 5, color: 0xC0C0C0, size: 4, glow: 0.3 },
    BRONZE: { value: 1, color: 0xCD7F32, size: 4, glow: 0.2 },
} as const

export type ExpTier = keyof typeof EXP_TIERS