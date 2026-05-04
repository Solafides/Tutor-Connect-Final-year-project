import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Clock, FileUp, ShieldAlert, AlertTriangle } from 'lucide-react';

export default async function TutorVerificationPage() {
    const session = await auth();

    // 1. Authorization Check (Fixed syntax: added ||)
    if (!session?.user || session.user.role !== 'TUTOR') {
        redirect('/login');
    }

    // 2. Fetch Data with Error Handling to prevent server hang
    let tutorProfile;
    try {
        tutorProfile = await prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
            include: { verificationDocs: true }
        });
    } catch (error) {
        console.error("Database connection error:", error);
        return <div className="p-10 text-red-600 font-bold text-center border-2 border-red-200 bg-red-50 rounded-2xl">Database connection failed. Please try again in 1 minute.</div>;
    }

    if (!tutorProfile) redirect('/tutor/profile');

    // 3. LOGIC: Determine display status (Fixed syntax: added || and logic check)
    const uploadedDocsCount = tutorProfile.verificationDocs?.length || 0;
    const dbStatus = tutorProfile.verificationStatus || 'UNVERIFIED';

    let displayStatus: string;
    if (uploadedDocsCount === 0) {
        displayStatus = 'NOT_VERIFIED';
    } else {
        displayStatus = dbStatus;
    }

    // ==========================================
    // SERVER ACTION: Process Uploads
    // ==========================================
    async function handleUpload(formData: FormData) {
        "use server";
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            // Fixed syntax: added || between keys
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const idFile = formData.get('idDocument') as File;
            const transcriptFile = formData.get('transcriptDocument') as File;
            const cvFile = formData.get('cvDocument') as File;
            const optionalFiles = formData.getAll('additionalDocuments') as File[];

            async function upload(file: File, folder: string) {
                // Fixed syntax: added ||
                if (!file || file.size === 0) return null;
                const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                const fileName = `${session!.user.id}_${Date.now()}_${safeName}`;
                
                const { error } = await supabase.storage
                    .from('tutor-documents')
                    .upload(`${folder}/${fileName}`, file);

                if (error) throw new Error("Supabase Upload Error");

                const { data } = supabase.storage.from('tutor-documents').getPublicUrl(`${folder}/${fileName}`);
                return data.publicUrl;
            }

            const docsToCreate = [];
            const idUrl = await upload(idFile, 'ids');
            const transUrl = await upload(transcriptFile, 'transcripts');
            const cvUrl = await upload(cvFile, 'cvs');

            if (idUrl) docsToCreate.push({ docType: 'id_card', fileUrl: idUrl, fileName: idFile.name });
            if (transUrl) docsToCreate.push({ docType: 'transcript', fileUrl: transUrl, fileName: transcriptFile.name });
            if (cvUrl) docsToCreate.push({ docType: 'cv', fileUrl: cvUrl, fileName: cvFile.name });

            for (const f of optionalFiles) {
                if (f instanceof File && f.size > 0) {
                    const url = await upload(f, 'extra');
                    if (url) docsToCreate.push({ docType: 'other_cert', fileUrl: url, fileName: f.name });
                }
            }

            // Save only if the 3 mandatory files are ready
            if (docsToCreate.length >= 3) {
                await prisma.tutorProfile.update({
                    where: { userId: session!.user.id },
                    data: {
                        verificationStatus: 'PENDING',
                        verificationDocs: {
                            deleteMany: {}, 
                            create: docsToCreate
                        }
                    }
                });
            }
        } catch (e) {
            console.error("Upload process failed:", e);
        }

        revalidatePath('/tutor/verification');
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl pb-10">
                <div className="animate-in fade-in duration-500">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verification Center</h1>
                    <p className="mt-2 text-slate-500 font-medium">Verified tutors gain priority in search results and student trust.</p>
                </div>

                {/* --- Status Card --- */}
                <div className={`p-8 rounded-3xl border-2 flex gap-6 items-start transition-all duration-500 ${
                    displayStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-50' :
                    displayStatus === 'PENDING' ? 'bg-amber-50 border-amber-200' :
                    displayStatus === 'REJECTED' ? 'bg-red-50 border-red-200' :
                    'bg-slate-50 border-slate-200 border-dashed'
                }`}>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                        displayStatus === 'APPROVED' ? 'bg-emerald-600 text-white' :
                        displayStatus === 'PENDING' ? 'bg-amber-500 text-white animate-pulse' :
                        displayStatus === 'REJECTED' ? 'bg-red-500 text-white' :
                        'bg-slate-300 text-white'
                    }`}>
                        <StatusIcon status={displayStatus} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {displayStatus === 'NOT_VERIFIED' ? 'Ready to Start?' : 
                             displayStatus === 'PENDING' ? 'Verification in Progress' : displayStatus}
                        </h2>
                        <p className="text-slate-600 mt-1 font-medium leading-relaxed max-w-md text-sm">
                            {displayStatus === 'APPROVED' && 'Your identity and academic background are verified. Happy teaching!'}
                            {displayStatus === 'PENDING' && 'Documents submitted successfully. Our staff is reviewing your application.'}
                            {displayStatus === 'REJECTED' && `Reason: ${tutorProfile.rejectionReason || 'Invalid documents.'}`}
                            {displayStatus === 'NOT_VERIFIED' && 'You need to upload 3 mandatory documents to activate your tutor profile.'}
                        </p>
                    </div>
                </div>

                {/* --- Form Section --- */}
                {(displayStatus === 'NOT_VERIFIED' || displayStatus === 'REJECTED') && (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
                           <div className="w-2 h-6 bg-emerald-500 rounded-full"></div> Mandatory Document Submission
                        </h3>

                        <form action={handleUpload} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">National ID or Passport <span className="text-red-500">*</span></label>
                                    <input type="file" name="idDocument" required accept="image/*,.pdf" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border p-2 rounded-2xl bg-slate-50/50" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Degree or Academic Transcript <span className="text-red-500">*</span></label>
                                    <input type="file" name="transcriptDocument" required accept="image/*,.pdf" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border p-2 rounded-2xl bg-slate-50/50" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">CV / Resume <span className="text-red-500">*</span></label>
                                    <input type="file" name="cvDocument" required accept=".pdf,.doc,.docx" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border p-2 rounded-2xl bg-slate-50/50" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Optional Certifications</label>
                                    <input type="file" name="additionalDocuments" multiple accept="image/*,.pdf" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 border p-2 rounded-2xl bg-slate-50/50" />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> Ensure files are clear and under 5MB.</p>
                                <button type="submit" className="px-12 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95">
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

function StatusIcon({ status }: { status: string }) {
    if (status === 'APPROVED') return <CheckCircle size={28} />;
    if (status === 'PENDING') return <Clock size={28} />;
    if (status === 'REJECTED') return <ShieldAlert size={28} />;
    return <FileUp size={28} />;
}