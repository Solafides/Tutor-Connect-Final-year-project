"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    BookOpen,
    Video,
    CheckCircle,
    Clock,
    ChevronRight,
    Send,
    User,
    ClipboardList,
    X,
    PlusCircle,
    ArrowLeft,
    Hash
} from 'lucide-react';

/**
 * Tutor-Connect Student Classroom Page
 * Path: src/app/student/classroom/page.tsx
 */

interface Resource {
    id: string;
    title: string;
    description: string | null;
    resourceType: string;
    fileUrl: string | null;
    content: string | null;
    uploadedAt: string;
}

interface Classroom {
    id: string;
    bookingId: string;
    title: string;
    subject: string;
    tutorName: string;
    lastActive: string;
    progress: number;
    meetingLink?: string | null;
    resources: Resource[];
}

type ViewMode = 'LIST' | 'CLASSROOM';
type TabMode = 'lessons' | 'tasks' | 'resources';

export default function StudentClassroomPage() {
    const [view, setView] = useState<ViewMode>('LIST');
    const [activeTab, setActiveTab] = useState<TabMode>('lessons');
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const meetingLinkParam = searchParams?.get('meetingLink');

    // Brand colors (Emerald 500)
    const brandGreen = "bg-[#10b981]";
    const brandGreenHover = "hover:bg-[#059669]";
    const brandGreenText = "text-[#10b981]";
    const brandGreenLight = "bg-[#ecfdf5]";

    const [enrolledClasses, setEnrolledClasses] = useState<Classroom[]>([]);
    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);

    useEffect(() => {
        async function loadClasses() {
            setIsLoading(true);
            setFetchError(null);

            try {
                const response = await fetch('/api/student/classrooms', {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                });
                if (!response.ok) {
                    throw new Error(`Failed to load classes: ${response.statusText}`);
                }
                const result = await response.json();
                const classes = result.classes || [];
                setEnrolledClasses(classes);

                if (meetingLinkParam) {
                    const directClass = classes.find((cls: Classroom) => cls.meetingLink === meetingLinkParam);
                    if (directClass) {
                        setSelectedClass(directClass);
                        setView('CLASSROOM');
                        setIsMeetingActive(true);
                    }
                }
            } catch (error: any) {
                setFetchError(error?.message || 'Unable to load your classes.');
                setEnrolledClasses([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadClasses();
    }, [meetingLinkParam]);

    const handleEnterClass = (cls: Classroom) => {
        setSelectedClass(cls);
        setView('CLASSROOM');
    };



    const lessonResources = selectedClass?.resources.filter((resource) => {
        const type = resource.resourceType?.toLowerCase() || '';
        return ['lesson', 'video', 'chapter', 'document', 'reading'].includes(type);
    }) ?? [];

    const assignmentResources = selectedClass?.resources.filter((resource) => {
        const type = resource.resourceType?.toLowerCase() || '';
        return ['assignment', 'task', 'homework', 'exercise'].includes(type);
    }) ?? [];

    const otherResources = selectedClass?.resources.filter((resource) => {
        const type = resource.resourceType?.toLowerCase() || '';
        return !['lesson', 'video', 'chapter', 'document', 'reading', 'assignment', 'task', 'homework', 'exercise'].includes(type);
    }) ?? [];

    const toggleMeeting = () => setIsMeetingActive(!isMeetingActive);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
            <main className="flex-1 overflow-hidden relative">
                
                {/* --- FULL SCREEN VIDEO CALL OVERLAY --- */}
                {isMeetingActive && selectedClass && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
                        {/* Video Call Header */}
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                <span className="text-sm font-bold tracking-wide">Live Session: {selectedClass.title}</span>
                            </div>
                            <button 
                                onClick={toggleMeeting} 
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors"
                            >
                                <X size={18} /> Leave Class
                            </button>
                        </div>
                        {/* Jitsi iframe integration (Stable Next.js approach) */}
                        <iframe 
                            src={`https://meet.jit.si/TutorConnect_Class_${selectedClass.id.replace(/[^a-zA-Z0-9]/g, "")}`}
                            allow="camera; microphone; fullscreen; display-capture"
                            className="w-full flex-1 border-0"
                        />
                    </div>
                )}

                {/* --- CLASSROOM LIST VIEW --- */}
                {view === 'LIST' && (
                    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full h-full overflow-y-auto">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Tutors</h2>
                                <p className="text-slate-500 font-medium">
                                    {isLoading
                                        ? 'Loading your tutoring sessions...'
                                        : enrolledClasses.length > 0
                                            ? `Continue your learning in ${enrolledClasses.length} active sessions.`
                                            : "You haven't booked any tutors yet."}
                                </p>
                            </div>
                        </div>

                        {fetchError && (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 font-bold mb-6">
                                {fetchError}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-7 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`${brandGreenLight} ${brandGreenText} p-4 rounded-3xl group-hover:${brandGreen} group-hover:text-white transition-all duration-300`}>
                                            <BookOpen size={28} />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 inline-block">
                                            {cls.subject}
                                        </span>
                                        <h3 className={`text-xl font-bold text-slate-900 group-hover:${brandGreenText} transition-colors leading-tight`}>
                                            {cls.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-400 text-xs font-bold mb-8">
                                        <span className="flex items-center gap-1.5"><User size={16} /> {cls.tutorName}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={16} /> {cls.lastActive}</span>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex-1 mr-6"></div>
                                        <button
                                            onClick={() => handleEnterClass(cls)}
                                            className={`bg-slate-900 text-white p-3.5 rounded-[1.25rem] hover:${brandGreen} transition-all shadow-xl active:scale-90`}
                                        >
                                            <ChevronRight size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                )}

                {/* --- INDIVIDUAL CLASSROOM VIEW --- */}
                {view === 'CLASSROOM' && selectedClass && !isMeetingActive && (
                    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
                        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView('LIST')}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all active:scale-90"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedClass.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Learning Room</span>
                                        <span className="text-xs text-slate-400 font-medium tracking-tight">Tutor: {selectedClass.tutorName}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={toggleMeeting}
                                className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95`}
                            >
                                <Video size={18} /> Join Session
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
                            <div className="flex gap-10 border-b border-slate-100">
                                <TabNavItem active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} label="Lessons" />
                                <TabNavItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Assignments" />
                                <TabNavItem active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} label="Resources" />
                            </div>

                            {activeTab === 'lessons' && (
                                <div className="space-y-4 pb-20">
                                    {lessonResources.length > 0 ? (
                                        lessonResources.map((resource) => (
                                            <LessonItem
                                                key={resource.id}
                                                title={resource.title}
                                                status={resource.resourceType || 'lesson'}
                                            />
                                        ))
                                    ) : (
                                        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                            No lesson materials have been published yet for this class.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-6 pb-20">
                                    {assignmentResources.length > 0 ? (
                                        assignmentResources.map((resource) => (
                                            <div key={resource.id} className="p-7 bg-white border border-slate-200 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                                        <ClipboardList size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{resource.title}</h4>
                                                        {resource.description && <p className="text-xs text-slate-400">{resource.description}</p>}
                                                        {resource.uploadedAt && <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(resource.uploadedAt).toLocaleDateString()}</p>}
                                                    </div>
                                                </div>
                                                <a
                                                    href={resource.fileUrl || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`${brandGreen} text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-50 flex items-center gap-2`}
                                                >
                                                    <Send size={18} /> View
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                            No assignments or tasks have been released for this class yet.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div className="space-y-6 pb-20">
                                    {otherResources.length > 0 ? (
                                        otherResources.map((resource) => (
                                            <div key={resource.id} className="p-7 bg-white border border-slate-200 rounded-[2rem] space-y-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{resource.title}</h4>
                                                        {resource.description && <p className="text-xs text-slate-400 mt-1">{resource.description}</p>}
                                                    </div>
                                                    {resource.fileUrl && (
                                                        <a
                                                            href={resource.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={`${brandGreen} text-white px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-[0.15em]`}
                                                        >
                                                            Open
                                                        </a>
                                                    )}
                                                </div>
                                                {resource.content && (
                                                    <p className="text-sm text-slate-500">{resource.content}</p>
                                                )}
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                                                    {resource.resourceType || 'resource'} • Uploaded {new Date(resource.uploadedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                            No extra resources are available yet for this class.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}


            </main>
        </div>
    );
}

function TabNavItem({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`pb-5 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full shadow-[0_-4px_10px_rgba(16,185,129,0.3)]"></div>}
        </button>
    );
}

function LessonItem({ title, status }: { title: string; status: string }) {
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    return (
        <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${isLocked ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-100'}`}>
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                    {isCompleted ? <CheckCircle size={22} /> : <BookOpen size={22} />}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{title}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Status: {status}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {!isLocked && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Study</span>}
                <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
            </div>
        </div>
    );
}