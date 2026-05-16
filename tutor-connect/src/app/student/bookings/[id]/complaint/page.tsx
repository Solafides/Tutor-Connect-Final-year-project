import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { submitComplaint } from '@/app/actions/complaint';

export default async function FileComplaintPage({ params }: { params: any }) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/');
    }

    const { id } = await params;

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!studentProfile) {
        redirect('/register');
    }

    const booking = await prisma.booking.findUnique({
        where: { id: id, studentId: studentProfile.id },
        include: { tutor: true }
    });

    if (!booking) {
        redirect('/student/bookings');
    }

    // Check if complaint already exists
    const existingComplaint = await prisma.complaint.findUnique({
        where: { bookingId: booking.id }
    });

    if (existingComplaint) {
        redirect('/student/bookings');
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50">
                    <h1 className="text-2xl font-black text-slate-900">File a Complaint or Request Refund</h1>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                        Session: {booking.subjectName} with {booking.tutor.fullName}
                    </p>
                </div>

                <div className="p-8">
                    <form action={submitComplaint} className="space-y-6">
                        <input type="hidden" name="bookingId" value={booking.id} />
                        
                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">
                                Reason for Request
                            </label>
                            <select 
                                name="subject" 
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">-- Select an option --</option>
                                <option value="REFUND_CHANGE_MIND">I changed my mind (Request Refund)</option>
                                <option value="TUTOR_NO_SHOW">Tutor did not show up</option>
                                <option value="POOR_QUALITY">Poor session quality</option>
                                <option value="TECHNICAL_ISSUES">Technical issues</option>
                                <option value="OTHER">Other complaint</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">
                                Additional Details
                            </label>
                            <textarea
                                name="description"
                                required
                                rows={6}
                                placeholder="Please provide more details about your request or complaint to help our staff resolve this quickly."
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            ></textarea>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
                            <Link
                                href="/student/bookings"
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                            >
                                Submit Ticket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
