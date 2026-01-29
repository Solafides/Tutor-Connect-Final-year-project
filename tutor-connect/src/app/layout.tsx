import { auth } from '@/auth'
import { Navigation } from '@/components/Navigation'

/* existing imports */
import type { Metadata } from 'next'
import { Lexend, Noto_Sans } from 'next/font/google'
import './globals.css'

const lexend = Lexend({
    subsets: ['latin'],
    variable: '--font-lexend',
    display: 'swap',
})

const notoSans = Noto_Sans({
    subsets: ['latin'],
    variable: '--font-noto',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Tutor Connect - Find Your Perfect Tutor in Ethiopia',
    description: 'Connect with expert tutors for 1-on-1 lessons tailored to your specific needs. Virtual and in-person tutoring across Ethiopia.',
    keywords: 'tutoring, Ethiopia, online learning, education, teachers, students',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    return (
        <html lang="en" className={`${lexend.variable} ${notoSans.variable}`}>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className={lexend.className}>
                <Navigation userRole={session?.user?.role} userName={session?.user?.name || undefined} />
                {children}
            </body>
        </html>
    )
}
