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
    Users,
    Layout,
    ClipboardList,
    X,
    PlusCircle,
    ArrowLeft,
    MoreVertical,
    Settings,
    Trash2
} from 'lucide-react';

/**
 * Tutor-Connect Tutor Classroom Page
 * Path: src/app/tutor/classroom/page.tsx
 * Theme: Emerald Green (Standard)
 */

interface Classroom {
    id: string;
    title: string;
    subject: string;
    studentCount: number;
    lastActive: string;
    progress: number;
}

type ViewMode = 'MANAGEMENT' | 'CLASSROOM';
type TabMode = 'lessons' | 'tasks' | 'students';

export default function TutorClassroomPage() {
    const [view, setView] = useState<ViewMode>('MANAGEMENT');
    const [activeTab, setActiveTab] = useState<TabMode>('lessons');
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const jitsiContainerRef = useRef<HTMLDivElement>(null);

    // Dynamic State: Initialized as empty so it only shows classes created by the tutor
    const [myClasses, setMyClasses] = useState<Classroom[]>([]);

    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);

    // Jitsi Meeting Integration
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
                    userInfo: { displayName: "Tutor (Host)" },
                    configOverwrite: {
                        startWithAudioMuted: true,
                        prejoinPageEnabled: false
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup', 'chat', 'settings', 'raisehand', 'tileview', 'screenap', 'participants-pane'],
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
        const classId = `CLS_${Math.floor(Math.random() * 10000)}`;

        const newClass: Classroom = {
            id: classId,
            title: formData.get('title') as string,
            subject: formData.get('subject') as string,
            studentCount: 0,
            lastActive: "Just now",
            progress: 0
        };

        setMyClasses([newClass, ...myClasses]);
        setShowCreateModal(false);
    };

    const toggleMeeting = () => setIsMeetingActive(!isMeetingActive);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">



            <main className="flex-1 overflow-hidden relative">

                {/* Jitsi Meeting Overlay */}
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

                {/* VIEW 1: Management Dashboard (List of Classes) */}
                {view === 'MANAGEMENT' && (
                    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full h-full overflow-y-auto">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tutor Classroom</h2>
                                <p className="text-slate-500 font-medium">
                                    {myClasses.length > 0
                                        ? `Manage content and track progress for your ${myClasses.length} active classes.`
                                        : "You haven't created any classes yet. Click below to get started."}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <PlusCircle size={18} /> Create Class
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Create New Card (First Item) */}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-7 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all group min-h-[200px]"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                                    <PlusCircle size={32} />
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest">Create New Class</span>
                            </button>

                            {/* Class Cards */}
                            {myClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-7 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                            <BookOpen size={28} />
                                        </div>
                                        <button className="text-slate-300 hover:text-slate-600 p-1"><MoreVertical size={20} /></button>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 inline-block">
                                            {cls.subject}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight line-clamp-2">
                                            {cls.title}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-wider">ID: {cls.id}</p>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                            <Users size={16} /> {cls.studentCount} Students
                                        </div>
                                        <button
                                            onClick={() => handleEnterClass(cls)}
                                            className="bg-slate-900 text-white p-3.5 rounded-[1.25rem] hover:bg-emerald-600 transition-all shadow-xl active:scale-90"
                                        >
                                            <ChevronRight size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW 2: Inside a Specific Classroom */}
                {view === 'CLASSROOM' && selectedClass && (
                    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
                        {/* Class Header */}
                        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView('MANAGEMENT')}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all active:scale-90"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedClass.title}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Instructor View</span>
                                        <span className="text-xs text-slate-400 font-medium tracking-tight">Class ID: {selectedClass.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleMeeting}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95"
                                >
                                    <Video size={18} /> Start Session
                                </button>
                                <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Class Content */}
                        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
                            {/* Tabs */}
                            <div className="flex gap-10 border-b border-slate-100">
                                <TabNavItem active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} label="Lesson Plan" />
                                <TabNavItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Assignments" />
                                <TabNavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} label="Students" />
                            </div>

                            {/* LESSONS TAB */}
                            {activeTab === 'lessons' && (
                                <div className="space-y-4 pb-20">
                                    <button className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:border-emerald-300 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2 group">
                                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                        Add New Chapter / Material
                                    </button>

                                    <LessonItem title="Chapter 1: Foundations" status="Published" />
                                    <LessonItem title="Chapter 2: Core Concepts" status="Draft" />
                                </div>
                            )}

                            {/* TASKS TAB */}
                            {activeTab === 'tasks' && (
                                <div className="space-y-4">
                                    <button className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm hover:bg-slate-800 transition-all shadow-lg">
                                        + Create New Assignment
                                    </button>
                                    <div className="p-6 bg-white border border-slate-200 rounded-[2rem] flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Mid-Term Assessment</h4>
                                                <p className="text-xs text-slate-400">Due: Feb 20, 2026 • 5/15 Submitted</p>
                                            </div>
                                        </div>
                                        <button className="text-sm font-bold text-slate-500 hover:text-slate-900">Review</button>
                                    </div>
                                </div>
                            )}

                            {/* STUDENTS TAB */}
                            {activeTab === 'students' && (
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 text-center">
                                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800">Class Roster</h3>
                                    <p className="text-slate-400 text-sm mt-1">Share the Class ID <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{selectedClass.id}</span> with students to invite them.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Create Class Modal */}
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
                                <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4">
                                    Create Classroom
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Sub-components for cleaner code
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
    return (
        <div className="p-6 rounded-[2rem] border transition-all flex items-center justify-between group bg-white border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-100">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-colors bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500">
                    <FileText size={22} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{title}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{status}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><Settings size={18} /></button>
                <button className="p-2 hover:bg-red-50 rounded-full text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
            </div>
        </div>
    );
}