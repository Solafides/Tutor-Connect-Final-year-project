"use client";

import React, { useState, FormEvent } from 'react';
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

interface Classroom {
    id: string;
    title: string;
    subject: string;
    tutorName: string;
    lastActive: string;
    progress: number;
}

type ViewMode = 'LIST' | 'CLASSROOM';
type TabMode = 'lessons' | 'tasks' | 'resources';

export default function StudentClassroomPage() {
    const[view, setView] = useState<ViewMode>('LIST');
    const [activeTab, setActiveTab] = useState<TabMode>('lessons');
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);
    const [showJoinModal, setShowJoinModal] = useState<boolean>(false);

    // Brand colors (Emerald 500)
    const brandGreen = "bg-[#10b981]";
    const brandGreenHover = "hover:bg-[#059669]";
    const brandGreenText = "text-[#10b981]";
    const brandGreenLight = "bg-[#ecfdf5]";

    // Dynamic State: Initialized as empty so it only shows classes after joining
    const[enrolledClasses, setEnrolledClasses] = useState<Classroom[]>([]);
    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);

    const handleEnterClass = (cls: Classroom) => {
        setSelectedClass(cls);
        setView('CLASSROOM');
    };

    const handleJoinClass = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const classId = (formData.get('classId') as string).toUpperCase();

        // Logic for Use Case 21: Join Class
        // This dynamically adds the class to your local list
        const newEnrollment: Classroom = {
            id: classId,
            title: `Classroom ${classId}`,
            subject: "New Subject",
            tutorName: "Verified Tutor",
            lastActive: "Just now",
            progress: 0
        };

        setEnrolledClasses([newEnrollment, ...enrolledClasses]);
        setShowJoinModal(false);
    };

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
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Classroom</h2>
                                <p className="text-slate-500 font-medium">
                                    {enrolledClasses.length > 0
                                        ? `Continue your learning in ${enrolledClasses.length} active classes.`
                                        : "You haven't joined any classes yet. Join one using a Class ID."}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 active:scale-95`}
                            >
                                <PlusCircle size={18} /> Join Class
                            </button>
                        </div>

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
                                        <div className="flex-1 mr-6">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                <span>Learning Progress</span>
                                                <span>{cls.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className={`${brandGreen} h-full rounded-full transition-all duration-700`} style={{ width: `${cls.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEnterClass(cls)}
                                            className={`bg-slate-900 text-white p-3.5 rounded-[1.25rem] hover:${brandGreen} transition-all shadow-xl active:scale-90`}
                                        >
                                            <ChevronRight size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-7 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <Hash size={32} />
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest text-center">Enroll via Class ID</span>
                            </button>
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
                                    <LessonItem title="Chapter 1: Foundations of Theory" status="completed" />
                                    <LessonItem title="Chapter 2: Core Analysis & Logic" status="current" />
                                    <LessonItem title="Chapter 3: Final Examination Prep" status="locked" />
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-6">
                                    <div className="p-7 bg-white border border-slate-200 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Weekly Mathematics Assignment</h4>
                                                <p className="text-xs text-slate-400">Due: Feb 15, 2026</p>
                                            </div>
                                        </div>
                                        <button className={`${brandGreen} text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-50 flex items-center gap-2`}>
                                            <Send size={18} /> Turn In
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- JOIN CLASSROOM MODAL --- */}
                {showJoinModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join Classroom</h2>
                                <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleJoinClass} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Class ID / Invite Code</label>
                                    <input required name="classId" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest" placeholder="E.G. CLS_123" />
                                    <p className="text-[10px] text-slate-400 mt-3 ml-1">Enter the unique code provided by your tutor.</p>
                                </div>
                                <button type="submit" className={`w-full ${brandGreen} text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4`}>
                                    Join Now
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
                {!isLocked && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Study</span>}
                <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
            </div>
        </div>
    );
}