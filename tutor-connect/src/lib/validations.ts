import { z } from 'zod'

// Auth Validations
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['STUDENT', 'TUTOR']),
    phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

// Student Profile
export const studentProfileSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().optional(),
    gradeLevel: z.string().optional(),
    locationCity: z.string().optional(),
    locationArea: z.string().optional(),
})

// Tutor Profile
export const tutorProfileSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().optional(),
    bio: z.string().min(50, 'Bio must be at least 50 characters').optional(),
    hourlyRate: z.number().min(10, 'Hourly rate must be at least 10 ETB'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    locationCity: z.string().optional(),
    locationArea: z.string().optional(),
    tutoringMode: z.enum(['VIRTUAL', 'IN_PERSON', 'BOTH']),
})

// Wallet
export const depositSchema = z.object({
    amount: z.number().min(10, 'Minimum deposit is 10 ETB').max(10000, 'Maximum deposit is 10,000 ETB'),
    paymentMethod: z.enum(['chapa', 'telebirr']),
})

export const withdrawSchema = z.object({
    amount: z.number().min(50, 'Minimum withdrawal is 50 ETB'),
    accountNumber: z.string().min(5, 'Invalid account number'),
    paymentMethod: z.enum(['telebirr']),
})

// Booking
export const bookingSchema = z.object({
    tutorId: z.string(),
    subjectName: z.string(),
    scheduledFor: z.string().datetime(),
    duration: z.number().min(30).max(180), // 30 min to 3 hours
    notes: z.string().optional(),
})

// Review
export const reviewSchema = z.object({
    bookingId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(500).optional(),
})

// Search Filters
export const searchFiltersSchema = z.object({
    subject: z.string().optional(),
    gradeLevel: z.string().optional(),
    locationCity: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    tutoringMode: z.enum(['VIRTUAL', 'IN_PERSON', 'BOTH']).optional(),
    minRating: z.number().min(0).max(5).optional(),
})
