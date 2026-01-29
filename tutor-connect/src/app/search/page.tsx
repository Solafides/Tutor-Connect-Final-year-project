import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import { SearchFilters } from '@/components/SearchFilters';
import { TutorCard } from '@/components/TutorCard';
import Link from 'next/link';
import { auth } from '@/auth';

interface SearchParams {
    searchParams: Promise<{
        subject?: string;
        city?: string;
        minPrice?: string;
        maxPrice?: string;
        mode?: string;
        gender?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchParams) {
    const session = await auth();
    const params = await searchParams;
    
    // Build filter conditions
    const where: any = {
        verificationStatus: 'APPROVED', // Only show verified tutors
    };

    // Subject filter
    if (params.subject) {
        where.subjects = {
            some: {
                subject: {
                    name: {
                        contains: params.subject,
                        mode: 'insensitive',
                    },
                },
            },
        };
    }

    // Location filter
    if (params.city) {
        where.locationCity = {
            contains: params.city,
            mode: 'insensitive',
        };
    }

    // Price range filter
    if (params.minPrice || params.maxPrice) {
        where.hourlyRate = {};
        if (params.minPrice) {
            where.hourlyRate.gte = parseFloat(params.minPrice);
        }
        if (params.maxPrice) {
            where.hourlyRate.lte = parseFloat(params.maxPrice);
        }
    }

    // Tutoring mode filter
    if (params.mode && params.mode !== 'BOTH') {
        where.tutoringMode = params.mode;
    }

    // Gender filter
    if (params.gender) {
        where.gender = params.gender;
    }

    const tutors = await prisma.tutorProfile.findMany({
        where,
        include: {
            user: true,
            subjects: {
                include: {
                    subject: true,
                },
            },
            _count: {
                select: {
                    bookings: {
                        where: {
                            status: 'COMPLETED',
                        },
                    },
                },
            },
        },
        orderBy: {
            rating: 'desc',
        },
        take: 50,
    });

    // Get all subjects for filter dropdown
    const allSubjects = await prisma.subject.findMany({
        orderBy: {
            name: 'asc',
        },
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Find a Tutor</h1>
                    <p className="mt-2 text-slate-600">
                        Search for verified tutors by subject, location, and more.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24">
                            <SearchFilters 
                                subjects={allSubjects.map(s => s.name)}
                                initialValues={params}
                            />
                        </div>
                    </aside>

                    {/* Results */}
                    <div className="lg:col-span-3">
                        {session?.user?.role !== 'STUDENT' && (
                            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <p className="text-sm text-blue-800">
                                    <Link href="/login" className="font-medium underline">
                                        Sign in as a student
                                    </Link>
                                    {' '}to book tutoring sessions.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-600">
                                Found <span className="font-semibold text-slate-900">{tutors.length}</span> tutor{tutors.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {tutors.length === 0 ? (
                            <div className="rounded-xl bg-white p-12 text-center border border-slate-200">
                                <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">
                                    search_off
                                </span>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    No tutors found
                                </h3>
                                <p className="text-slate-600 mb-4">
                                    Try adjusting your search filters to find more tutors.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {tutors.map((tutor) => (
                                    <TutorCard 
                                        key={tutor.id} 
                                        tutor={tutor} 
                                        canBook={session?.user?.role === 'STUDENT'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
