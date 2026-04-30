import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';

export default async function TutorVerificationPage() {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'TUTOR') {
        redirect('/login');
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!tutorProfile) redirect('/tutor/profile');

    // If your DB defaults to PENDING, this will catch it. 
    // We will allow uploads for any status that is NOT 'APPROVED'.
    const status = tutorProfile.verificationStatus || 'UNVERIFIED';

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Account Verification</h1>
                    <p className="mt-2 text-slate-600">
                        Submit your academic and identity documents to get approved and start teaching.
                    </p>
                </div>

                {/* Status Banner */}
                <div className={`p-6 rounded-xl border-2 ${
                    status === 'APPROVED' ? 'bg-green-50 border-green-200' :
                    status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                    status === 'REJECTED' ? 'bg-red-50 border-red-200' :
                    'bg-slate-50 border-slate-200'
                }`}>
                    <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined text-4xl ${
                            status === 'APPROVED' ? 'text-green-600' :
                            status === 'PENDING' ? 'text-yellow-600' :
                            status === 'REJECTED' ? 'text-red-600' :
                            'text-slate-600'
                        }`}>
                            {status === 'APPROVED' ? 'verified' :
                             status === 'PENDING' ? 'hourglass_empty' :
                             status === 'REJECTED' ? 'cancel' : 'upload_file'}
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Status: {status === 'PENDING' && 'PENDING / AWAITING DOCUMENTS'}
                                {status !== 'PENDING' && status}
                            </h2>
                            <p className="text-slate-600 mt-1">
                                {status === 'APPROVED' && 'Your account is verified! You are visible to students.'}
                                {status === 'PENDING' && 'If you haven\'t uploaded your documents yet, please do so below. Otherwise, they are under review.'}
                                {status === 'REJECTED' && `Verification rejected: ${tutorProfile.rejectionReason || 'Invalid documents.'} Please resubmit.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upload Form (Show for EVERYONE who is not APPROVED) */}
                {status !== 'APPROVED' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Upload Verification Documents
                        </h3>
                        
                        <form className="space-y-6" action="/api/tutor/verify" method="POST" encType="multipart/form-data">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ID Upload (Required) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        University/National ID Image <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="file" 
                                        name="idDocument"
                                        accept="image/*,.pdf"
                                        required
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </div>

                                {/* Transcript Upload (Required) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Academic Transcript <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="file" 
                                        name="transcriptDocument"
                                        accept="image/*,.pdf"
                                        required
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </div>

                                {/* Certificate Upload (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Teaching Certificate (Optional)
                                    </label>
                                    <input 
                                        type="file" 
                                        name="certificateDocument"
                                        accept="image/*,.pdf"
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                </div>

                                {/* Other Documents Upload (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Other Documents (Optional)
                                    </label>
                                    <input 
                                        type="file" 
                                        name="additionalDocuments"
                                        accept="image/*,.pdf"
                                        multiple
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Upload CV, recommendations, or extra proofs.</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button 
                                    type="submit"
                                    className="w-full md:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition shadow-sm"
                                >
                                    Submit Documents
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}