import { UserRole, UserStatus, BookingStatus, EscrowStatus, VerificationStatus } from '@prisma/client'

// Extended types for frontend
export interface UserSession {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    profileId?: string
    fullName?: string
    avatar?: string
}

export interface TutorCard {
    id: string
    fullName: string
    avatar: string | null
    bio: string | null
    hourlyRate: number
    rating: number | null
    totalReviews: number
    subjects: string[]
    locationCity: string | null
    locationArea: string | null
    tutoringMode: string
}

export interface BookingCard {
    id: string
    subjectName: string
    scheduledFor: Date
    duration: number
    status: BookingStatus
    totalAmount: number
    escrowStatus: EscrowStatus
    tutor?: {
        fullName: string
        avatar: string | null
    }
    student?: {
        fullName: string
        avatar: string | null
    }
    classroom?: {
        meetingLink: string | null
    }
}

export interface PendingTutorVerification {
    id: string
    fullName: string
    email: string
    createdAt: Date
    documents: {
        docType: string
        fileUrl: string
        fileName: string
    }[]
    bio: string | null
    subjects: string[]
}

export interface DashboardStats {
    totalUsers: number
    totalTutors: number
    approvedTutors: number
    pendingTutors: number
    totalBookings: number
    totalRevenue: number
    activeBookings: number
}

export interface WalletBalance {
    balance: number
    currency: string
    transactions: {
        id: string
        type: string
        amount: number
        description: string | null
        createdAt: Date
    }[]
}

// Navigation types (preserving from existing UI)
export type ViewState =
    | 'landing'
    | 'login'
    | 'register'
    | 'dashboard'
    | 'search'
    | 'classroom'
    | 'wallet'
    | 'staff'

export interface NavItem {
    id: ViewState
    label: string
    icon: string
}
