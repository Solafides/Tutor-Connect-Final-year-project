import Link from 'next/link';
import { TutorProfile, User, TutorSubject, Subject } from '@prisma/client';

interface TutorCardProps {
    tutor: TutorProfile & {
        user: User;
        subjects: (TutorSubject & {
            subject: Subject;
        })[];
        _count?: {
            bookings: number;
        };
    };
    canBook: boolean;
}

export function TutorCard({ tutor, canBook }: TutorCardProps) {
    const rating = tutor.rating ? Number(tutor.rating).toFixed(1) : 'New';
    const hourlyRate = Number(tutor.hourlyRate).toFixed(0);
    const completedSessions = tutor._count?.bookings || 0;

    return (
        <div className="rounded-xl bg-white border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {tutor.avatar ? (
                            <img 
                                src={tutor.avatar} 
                                alt={tutor.fullName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-primary text-3xl">
                                person
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900 truncate">
                                {tutor.fullName}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                                {/* Rating */}
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-lg">
                                        star
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900">{rating}</span>
                                    {tutor.totalReviews > 0 && (
                                        <span className="text-sm text-slate-500">
                                            ({tutor.totalReviews})
                                        </span>
                                    )}
                                </div>

                                {/* Sessions */}
                                {completedSessions > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <span className="material-symbols-outlined text-base">
                                            check_circle
                                        </span>
                                        {completedSessions} session{completedSessions !== 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* Location */}
                                {tutor.locationCity && (
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <span className="material-symbols-outlined text-base">
                                            location_on
                                        </span>
                                        {tutor.locationCity}
                                    </div>
                                )}

                                {/* Tutoring Mode */}
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                    <span className="material-symbols-outlined text-base">
                                        {tutor.tutoringMode === 'VIRTUAL' ? 'videocam' : 
                                         tutor.tutoringMode === 'IN_PERSON' ? 'home' : 'cast'}
                                    </span>
                                    {tutor.tutoringMode === 'VIRTUAL' ? 'Virtual' : 
                                     tutor.tutoringMode === 'IN_PERSON' ? 'In-person' : 'Both'}
                                </div>
                            </div>

                            {/* Bio */}
                            {tutor.bio && (
                                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                                    {tutor.bio}
                                </p>
                            )}

                            {/* Subjects */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {tutor.subjects.slice(0, 4).map((tutorSubject) => (
                                    <span
                                        key={tutorSubject.subjectId}
                                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                    >
                                        {tutorSubject.subject.name}
                                    </span>
                                ))}
                                {tutor.subjects.length > 4 && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                        +{tutor.subjects.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex-shrink-0 text-right">
                            <div className="mb-4">
                                <p className="text-2xl font-bold text-slate-900">{hourlyRate}</p>
                                <p className="text-sm text-slate-500">ETB/hour</p>
                            </div>
                            {canBook ? (
                                <Link
                                    href={`/book/create?tutorId=${tutor.id}`}
                                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                                >
                                    Book Session
                                </Link>
                            ) : (
                                <Link
                                    href={`/tutor/${tutor.id}`}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    View Profile
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
