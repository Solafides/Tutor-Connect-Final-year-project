import bcryptjs from 'bcryptjs'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(12)
    return bcryptjs.hash(password, salt)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcryptjs.compare(password, hashedPassword)
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number): {
    platformFee: number
    tutorEarning: number
} {
    const feePercentage = Number(process.env.PLATFORM_FEE_PERCENTAGE || 10)
    const platformFee = (amount * feePercentage) / 100
    const tutorEarning = amount - platformFee

    return {
        platformFee: Number(platformFee.toFixed(2)),
        tutorEarning: Number(tutorEarning.toFixed(2)),
    }
}

/**
 * Format currency for Ethiopian Birr
 */
export function formatCurrency(amount: number): string {
    const currency = process.env.CURRENCY || 'ETB'
    return `${currency} ${amount.toFixed(2)}`
}
