import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function TutorBookingDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user || session.user.role !== 'TUTOR') {
        redirect('/login');
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!tutorProfile) redirect('/tutor/profile');

    const booking = await prisma.booking.findUnique({
        where: {
            id: params.id,
            tutorId: tutorProfile.id,
        },
        include: {
            student: {
                include: { user: true },
            },
        },
    });

    if (!booking) {
        redirect('/tutor/bookings');
    }

    async function acceptBooking() {
        'use server';
        await prisma.booking.update({
            where: { id: booking?.id },
            data: { status: 'ACCEPTED' },
        });
        revalidatePath(`/tutor/bookings/${booking?.id}`);
        revalidatePath('/tutor/dashboard');
        revalidatePath('/tutor/bookings');
        redirect('/tutor/bookings');
    }

    async function declineBooking() {
        'use server';
        await prisma.booking.update({
            where: { id: booking?.id },
            data: { status: 'CANCELLED' },
        });
        // If money is in escrow, we would trigger refund here
        if (booking?.escrowStatus === 'HELD') {
            await prisma.booking.update({
                where: { id: booking.id },
                data: { escrowStatus: 'REFUNDED' }
            });
            
            // Add refund logic if needed
            const transaction = await prisma.transaction.findFirst({
                where: { 
                    paymentMetadata: { 
                        path: ['bookingId'], 
                        equals: booking?.id 
                    } as any
                }
            });

            if (transaction) {
                // Return money to student's wallet or via chapa
                const studentUser = await prisma.user.findFirst({
                    where: { studentProfile: { id: booking?.studentId } }
                });
                if (studentUser) {
                    let wallet = await prisma.wallet.findUnique({ where: { userId: studentUser.id } });
                    if (wallet) {
                        await prisma.$transaction(async (tx) => {
                            await tx.wallet.update({
                                where: { id: wallet.id },
                                data: { balance: { increment: booking.totalAmount } }
                            });
                            await tx.transaction.create({
                                data: {
                                    walletId: wallet.id,
                                    type: 'REFUND',
                                    amount: booking.totalAmount,
                                    balanceAfter: Number(wallet.balance) + Number(booking.totalAmount),
                                    description: `Refund for declined booking: ${booking.subjectName}`,
                                    paymentMetadata: { bookingId: booking.id }
                                }
                            });
                        });
                    }
                }
            }
        }
        revalidatePath(`/tutor/bookings/${booking?.id}`);
        revalidatePath('/tutor/dashboard');
        revalidatePath('/tutor/bookings');
        redirect('/tutor/bookings');
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/bookings" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
                        <p className="text-slate-600">Review the request from {booking.student.fullName}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">{booking.subjectName}</h2>
                                <p className="text-slate-600 mt-1">Student: <span className="font-medium text-slate-800">{booking.student.fullName}</span></p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto ${
                                booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border border-green-200' :
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                                {booking.status}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Session Details</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-slate-400 mt-0.5">calendar_month</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">Date & Time</p>
                                            <p className="text-sm text-slate-600">
                                                {new Date(booking.scheduledFor).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' at '}
                                                {new Date(booking.scheduledFor).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-slate-400 mt-0.5">schedule</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">Duration</p>
                                            <p className="text-sm text-slate-600">{booking.duration} minutes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {booking.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Notes from Student</h3>
                                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-100">
                                        {booking.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Summary</h3>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Amount (Paid by Student)</span>
                                    <span className="font-medium text-slate-900">{Number(booking.totalAmount).toFixed(2)} ETB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Platform Fee (10%)</span>
                                    <span className="text-slate-600">-{Number(booking.platformFee).toFixed(2)} ETB</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between">
                                    <span className="font-semibold text-slate-900">Your Earnings</span>
                                    <span className="font-bold text-primary text-lg">{Number(booking.tutorEarning).toFixed(2)} ETB</span>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-lg ${booking.isPaid ? 'text-blue-500' : 'text-yellow-500'}`}>
                                            {booking.isPaid ? 'check_circle' : 'pending_actions'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-700">
                                            Payment Status: <span className={booking.isPaid ? 'text-blue-600' : 'text-yellow-600'}>{booking.isPaid ? 'Paid & Held in Escrow' : 'Awaiting Payment'}</span>
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 ml-7">
                                        {booking.isPaid 
                                            ? 'Funds are securely held in escrow and will be released to you upon successful completion of the session.' 
                                            : 'The student will be prompted to pay after you accept this booking request.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {booking.status === 'PENDING' && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                            <form action={declineBooking}>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors focus:ring-4 focus:ring-slate-100"
                                >
                                    Decline Request
                                </button>
                            </form>
                            <form action={acceptBooking}>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm focus:ring-4 focus:ring-primary/20 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Accept Booking
                                </button>
                            </form>
                        </div>
                    )}
                    
                    {booking.status === 'ACCEPTED' && (
                        <div className="p-6 border-t border-slate-200 bg-blue-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Booking Accepted</p>
                                    <p className="text-sm text-blue-700">You have accepted this session. Please make sure to be available on the scheduled date and time.</p>
                                </div>
                            </div>
                            
                            {/* If there was a classroom link or something, we could add it here */}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
