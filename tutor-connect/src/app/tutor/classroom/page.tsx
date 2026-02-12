"use client";

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import {
    BookOpen,
    Video,
    Plus,
    FileText,
    CheckCircle,
    Clock,
    ChevronRight,
    Download,
    Send,
    User,
    Layout,
    MessageSquare,
    ClipboardList,
    X,
    PlusCircle,
    ArrowLeft,
    MoreVertical,
    Users
} from 'lucide-react';

/**
 * Tutor-Connect Classroom & Class Management Page
 * Path: src/app/tutor/classroom/page.tsx
 */

interface Classroom {
    id: string;
    title: string;
    subject: string;
    students: number;
    lastActive: string;
    progress: number;
    color: string;
}

type ViewMode = 'MANAGEMENT' | 'CLASSROOM';
type TabMode = 'lessons' | 'tasks' | 'resources';

export default function ClassroomPage() {
    const [view, setView] = useState<ViewMode>('MANAGEMENT');
    const [activeTab, setActiveTab] = useState<TabMode>('lessons');
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const jitsiContainerRef = useRef<HTMLDivElement>(null);

    // Brand colors (Emerald 500)
    const brandGreen = "bg-[#10b981]";
    const brandGreenHover = "hover:bg-[#059669]";
    const brandGreenText = "text-[#10b981]";
    const brandGreenLight = "bg-[#ecfdf5]";

    // Mock Data
    const [myClasses, setMyClasses] = useState<Classroom[]>([
        { id: "cls_123", title: "Advanced Mathematics - Grade 12", subject: "Mathematics", students: 1, lastActive: "2 hours ago", progress: 65, color: "bg-blue-500" },
        { id: "cls_456", title: "Physics Basics - Grade 10", subject: "Physics", students: 1, lastActive: "Yesterday", progress: 10, color: "bg-purple-500" },
        { id: "cls_789", title: "Grade 11 Biology Intensive", subject: "Biology", students: 2, lastActive: "3 days ago", progress: 40, color: "bg-orange-500" },
    ]);

    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);

    useEffect(() => {
        let api: any = null;

        if (isMeetingActive && selectedClass) {
            const loadJitsiScript = (): Promise<void> => {
                return new Promise((resolve) => {
                    if ((window as any).JitsiMeetExternalAPI) {
                        resolve();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = "https://meet.jit.si/external_api.js";
                    script.async = true;
                    script.onload = () => resolve();
                    document.body.appendChild(script);
                });
            };

            loadJitsiScript().then(() => {
                if (!jitsiContainerRef.current) return;

                const domain = "meet.jit.si";
                const options = {
                    roomName: `TutorConnect_${selectedClass.id}`,
                    width: "100%",
                    height: "100%",
                    parentNode: jitsiContainerRef.current,
                    userInfo: { displayName: "Instructor (Tutor)" },
                    configOverwrite: { startWithAudioMuted: true },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup', 'chat', 'settings', 'raisehand', 'tileview'],
                    }
                };
                api = new (window as any).JitsiMeetExternalAPI(domain, options);
                api.addEventListener('videoConferenceLeft', () => setIsMeetingActive(false));
            });
        }

        return () => {
            if (api) api.dispose();
        };
    }, [isMeetingActive, selectedClass]);

    const handleEnterClass = (cls: Classroom) => {
        setSelectedClass(cls);
        setView('CLASSROOM');
    };

    const handleCreateClass = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newClass: Classroom = {
            id: `cls_${Math.random().toString(36).substr(2, 5)}`,
            title: formData.get('title') as string,
            subject: formData.get('subject') as string,
            students: 0,
            lastActive: "Just now",
            progress: 0,
            color: "bg-emerald-500"
        };

        setMyClasses([newClass, ...myClasses]);
        setShowCreateModal(false);
    };

    const toggleMeeting = () => setIsMeetingActive(!isMeetingActive);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('MANAGEMENT')}>
                        <div className={`${brandGreen} p-1.5 rounded-lg text-white shadow-sm`}>
                            <Layout size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Tutor Connect</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        <button onClick={() => setView('MANAGEMENT')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'MANAGEMENT' ? `${brandGreenText} ${brandGreenLight}` : 'text-slate-500 hover:bg-slate-50'}`}>
                            My Classrooms
                        </button>
                        <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                            My Bookings
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {view === 'CLASSROOM' && (
                        <button
                            onClick={toggleMeeting}
                            className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 active:scale-95`}
                        >
                            <Video size={18} /> Start Session
                        </button>
                    )}
                    {view === 'MANAGEMENT' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 active:scale-95`}
                        >
                            <PlusCircle size={18} /> New Class
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                {isMeetingActive && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col">
                        <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                                <span className="text-sm font-bold tracking-tight">Live: {selectedClass?.title}</span>
                            </div>
                            <button onClick={toggleMeeting} className="p-2 bg-slate-800 rounded-xl hover:bg-red-600 transition-colors"><X size={18} /></button>
                        </div>
                        <div ref={jitsiContainerRef} className="flex-1" />
                    </div>
                )}

                {view === 'MANAGEMENT' && (
                    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full h-full overflow-y-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tutor Dashboard</h2>
                            <p className="text-slate-500 font-medium">Manage your {myClasses.length} active classrooms.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-7 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`${brandGreenLight} ${brandGreenText} p-4 rounded-3xl group-hover:${brandGreen} group-hover:text-white transition-all duration-300`}>
                                            <BookOpen size={28} />
                                        </div>
                                        <button className="text-slate-300 hover:text-slate-600 p-1"><MoreVertical size={20} /></button>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 inline-block">
                                            {cls.subject}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:${brandGreenText} transition-colors leading-tight">
                                            {cls.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-400 text-xs font-bold mb-8">
                                        <span className="flex items-center gap-1.5"><Users size={16} /> {cls.students} Students</span>
                                        <span className="flex items-center gap-1.5"><Clock size={16} /> {cls.lastActive}</span>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex-1 mr-6">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                <span>Course Progress</span>
                                                <span>{cls.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className={`${brandGreen} h-full rounded-full transition-all duration-700`} style={{ width: `${cls.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEnterClass(cls)}
                                            className="bg-slate-900 text-white p-3.5 rounded-[1.25rem] hover:${brandGreen} transition-all shadow-xl active:scale-90"
                                        >
                                            <ChevronRight size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-7 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <PlusCircle size={32} />
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest">Create New Classroom</span>
                            </button>
                        </div>
                    </div>
                )}

                {view === 'CLASSROOM' && selectedClass && (
                    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
                        <div className="px-8 py-6 flex items-center gap-4 bg-white border-b border-slate-100">
                            <button
                                onClick={() => setView('MANAGEMENT')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all active:scale-90"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedClass.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Active Classroom</span>
                                    <span className="text-xs text-slate-400 font-medium tracking-tight">Managed by you</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
                            <div className="flex gap-10 border-b border-slate-100">
                                <TabNavItem active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} label="Learning Path" />
                                <TabNavItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Exercises" />
                                <TabNavItem active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} label="Materials" />
                            </div>

                            {activeTab === 'lessons' && (
                                <div className="space-y-4 pb-20">
                                    <button className={`w-full py-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-bold hover:border-emerald-300 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2 group`}>
                                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                        Add Lesson Chapter
                                    </button>

                                    <LessonItem title="Chapter 1: Foundations of Theory" status="completed" />
                                    <LessonItem title="Chapter 2: Core Analysis & Logic" status="current" />
                                    <LessonItem title="Chapter 3: Final Examination Prep" status="locked" />
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center border-dashed">
                                    <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800">No active tasks</h3>
                                    <p className="text-slate-400 text-sm mt-1">Create assignments or quizzes to track student progress.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Classroom</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateClass} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Class Title</label>
                                    <input required name="title" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="e.g. Physics Intensive Unit 1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Academic Subject</label>
                                    <select name="subject" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                                        <option>Mathematics</option>
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                        <option>English</option>
                                        <option>Biology</option>
                                    </select>
                                </div>
                                <button type="submit" className={`w-full ${brandGreen} text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4`}>
                                    Finalize & Create
                                </button>
                            </form>
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
                {!isLocked && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Resume</span>}
                <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
            </div>
        </div>
    );
}