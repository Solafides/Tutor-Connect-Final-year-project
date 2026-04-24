"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import {
    BookOpen,
    Video,
    Plus,
    CheckCircle,
    Clock,
    ChevronRight,
    ClipboardList,
    X,
    PlusCircle,
    ArrowLeft,
    MoreVertical,
    Users,
    FileText,
    Settings,
    Trash2,
    PlayCircle,
    Link as LinkIcon,
    ChevronDown,
    ChevronUp,
    Paperclip,
    Calendar
} from 'lucide-react';

type ViewMode = 'MANAGEMENT' | 'CLASSROOM';
type TabMode = 'lessons' | 'assignments' | 'students';

// --- DATA STRUCTURES ---
interface Material {
    id: number;
    title: string;
    type: 'document' | 'video' | 'link';
    fileName?: string | null; // NEW: Stores uploaded file name
    url?: string | null;      // NEW: Stores web link
}

interface Chapter {
    id: number;
    classId: string; // Links chapter to specific class
    title: string;
    status: string;
    isExpanded: boolean;
    materials: Material[];
}

interface Assignment {
    id: number;
    classId: string; // Links assignment to specific class
    title: string;
    dueDate: string;
    submitted: number;
    total: number;
    fileName?: string | null; // Stores uploaded file name
}

export default function ClassroomClient() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [view, setView] = useState<ViewMode>('MANAGEMENT');
    const [activeTab, setActiveTab] = useState<TabMode>('lessons');
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
    const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);

    // Form states
    const [chapterForm, setChapterForm] = useState({ id: null as number | null, title: '' });

    // NEW: Added 'file' and 'url' to state for real uploads
    const [materialForm, setMaterialForm] = useState({
        chapterId: null as number | null,
        title: '',
        type: 'document' as 'document' | 'video' | 'link',
        file: null as File | null,
        url: ''
    });

    const [assignmentForm, setAssignmentForm] = useState({ title: '', dueDate: '', fileName: null as string | null });

    // Brand colors
    const brandGreen = "bg-[#10b981]";
    const brandGreenHover = "hover:bg-[#059669]";
    const brandGreenText = "text-[#10b981]";
    const brandGreenLight = "bg-[#ecfdf5]";

    const [myClasses, setMyClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // ==============================
    // DATA PERSISTENCE (SAVE & LOAD)
    // ==============================
    useEffect(() => {
        const savedData = localStorage.getItem('tutor_classroom_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setMyClasses(parsed.classes || []);
            setChapters(parsed.chapters || []);
            setAssignments(parsed.assignments || []);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('tutor_classroom_data', JSON.stringify({
                classes: myClasses,
                chapters: chapters,
                assignments: assignments
            }));
        }
    }, [myClasses, chapters, assignments, isInitialized]);

    if (!isInitialized) return null;

    const currentChapters = chapters.filter(ch => ch.classId === selectedClass?.id);
    const currentAssignments = assignments.filter(a => a.classId === selectedClass?.id);

    // ==============================
    // CLASSROOM ACTIONS
    // ==============================
    const handleEnterClass = (cls: any) => {
        setSelectedClass(cls);
        setView('CLASSROOM');
    };

    const handleCreateClass = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newClass = {
            id: `CLS_${Math.floor(Math.random() * 10000)}`,
            title: formData.get('title') as string,
            subject: formData.get('subject') as string,
            students: 0,
            lastActive: "Just now",
            progress: 0,
        };
        setMyClasses([newClass, ...myClasses]);
        setShowCreateModal(false);
    };

    const handleDeleteClass = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to permanently delete this classroom? All materials and assignments will be lost.")) {
            setMyClasses(myClasses.filter(c => c.id !== id));
            setChapters(chapters.filter(ch => ch.classId !== id));
            setAssignments(assignments.filter(a => a.classId !== id));
        }
    };

    const toggleMeeting = () => setIsMeetingActive(!isMeetingActive);

    // ==============================
    // CHAPTER ACTIONS
    // ==============================
    const handleOpenAddChapter = () => {
        setChapterForm({ id: null, title: '' });
        setShowChapterModal(true);
    };

    const handleOpenEditChapter = (chapter: Chapter, e: React.MouseEvent) => {
        e.stopPropagation();
        setChapterForm({ id: chapter.id, title: chapter.title });
        setShowChapterModal(true);
    };

    const handleChapterSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (chapterForm.id) {
            setChapters(chapters.map(ch => ch.id === chapterForm.id ? { ...ch, title: chapterForm.title } : ch));
        } else {
            setChapters([...chapters, {
                id: Date.now(),
                classId: selectedClass.id,
                title: chapterForm.title,
                status: 'PUBLISHED',
                isExpanded: true,
                materials: []
            }]);
        }
        setShowChapterModal(false);
    };

    const handleDeleteChapter = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this chapter and all its materials?")) {
            setChapters(chapters.filter(ch => ch.id !== id));
        }
    };

    const toggleChapterExpand = (id: number) => {
        setChapters(chapters.map(ch => ch.id === id ? { ...ch, isExpanded: !ch.isExpanded } : ch));
    };

    // ==============================
    // MATERIAL ACTIONS (UPDATED FOR FILES)
    // ==============================
    const handleOpenAddMaterial = (chapterId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        // Reset form completely
        setMaterialForm({ chapterId, title: '', type: 'document', file: null, url: '' });
        setShowMaterialModal(true);
    };

    const handleMaterialSubmit = (e: FormEvent) => {
        e.preventDefault();
        setChapters(chapters.map(ch => {
            if (ch.id === materialForm.chapterId) {
                return {
                    ...ch,
                    materials: [...ch.materials, {
                        id: Date.now(),
                        title: materialForm.title,
                        type: materialForm.type,
                        fileName: materialForm.file ? materialForm.file.name : null,
                        url: materialForm.url || null
                    }]
                };
            }
            return ch;
        }));
        setShowMaterialModal(false);
    };

    const handleDeleteMaterial = (chapterId: number, materialId: number) => {
        if (confirm("Delete this material?")) {
            setChapters(chapters.map(ch => {
                if (ch.id === chapterId) {
                    return { ...ch, materials: ch.materials.filter(m => m.id !== materialId) };
                }
                return ch;
            }));
        }
    };

    // ==============================
    // ASSIGNMENT ACTIONS
    // ==============================
    const handleOpenAddAssignment = () => {
        setAssignmentForm({ title: '', dueDate: '', fileName: null });
        setShowAssignmentModal(true);
    };

    const handleAssignmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAssignmentForm({ ...assignmentForm, fileName: e.target.files[0].name });
        }
    };

    const handleAssignmentSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newAssignment: Assignment = {
            id: Date.now(),
            classId: selectedClass.id,
            title: assignmentForm.title,
            dueDate: assignmentForm.dueDate || 'No Due Date',
            submitted: 0,
            total: selectedClass.students || 0,
            fileName: assignmentForm.fileName
        };
        setAssignments([...assignments, newAssignment]);
        setShowAssignmentModal(false);
    };

    const handleDeleteAssignment = (id: number) => {
        if (confirm("Are you sure you want to delete this assignment?")) {
            setAssignments(assignments.filter(a => a.id !== id));
        }
    };

    const getMaterialIcon = (type: string) => {
        switch (type) {
            case 'video': return <PlayCircle size={18} className="text-blue-500" />;
            case 'link': return <LinkIcon size={18} className="text-purple-500" />;
            default: return <FileText size={18} className="text-emerald-500" />;
        }
    };

    return (
        <div className="h-full flex flex-col font-sans text-slate-900 pb-10">
            <main className="flex-1 overflow-hidden relative">

               {/* --- VIDEO CALL OVERLAY (FIXED CSS) --- */}
{isMeetingActive && selectedClass && (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-300">
        {/* Top Header Bar */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                <span className="text-sm font-bold tracking-wide">Live Session: {selectedClass.title}</span>
            </div>
            <button
                onClick={toggleMeeting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors"
            >
                <X size={18} /> End Class
            </button>
        </div>
        
        {/* Video Container */}
        <div className="flex-1 w-full h-full relative bg-slate-950">
            <iframe
                src={`https://meet.jit.si/TutorConnect_Class_${selectedClass.id.replace(/[^a-zA-Z0-9]/g, "")}#config.prejoinPageEnabled=false`}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="absolute inset-0 w-full h-full border-0"
                title="Video Call"
            />
        </div>
    </div>
)}
                

                {/* --- CLASSROOM MANAGEMENT VIEW --- */}
                {view === 'MANAGEMENT' && (
                    <div className="max-w-7xl mx-auto w-full h-full overflow-y-auto">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tutor Dashboard</h2>
                                <p className="text-slate-500 font-medium">Manage your active classrooms.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-emerald-100 active:scale-95`}
                            >
                                <PlusCircle size={18} /> New Class
                            </button>
                        </div>

                        {myClasses.length === 0 ? (
                            <div className="bg-white border border-slate-200 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
                                <BookOpen size={64} className="text-slate-200 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-700">No classes yet</h3>
                                <p className="text-slate-500 mt-2 max-w-md">Create your first class to start adding chapters, assignments, and inviting students.</p>
                                <button onClick={() => setShowCreateModal(true)} className={`mt-8 px-8 py-3 ${brandGreen} text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors`}>
                                    Create My First Class
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myClasses.map((cls) => (
                                    <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-7 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden cursor-pointer" onClick={() => handleEnterClass(cls)}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`${brandGreenLight} ${brandGreenText} p-4 rounded-3xl group-hover:${brandGreen} group-hover:text-white transition-all duration-300`}>
                                                <BookOpen size={28} />
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClass(cls.id, e)}
                                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="Delete Class"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>

                                        <div className="mb-6">
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 inline-block">
                                                {cls.subject}
                                            </span>
                                            <h3 className={`text-xl font-bold text-slate-900 group-hover:${brandGreenText} transition-colors leading-tight`}>
                                                {cls.title}
                                            </h3>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex-1 mr-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                                                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">ID: {cls.id}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                    <span>Course Progress</span>
                                                    <span>{cls.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div className={`${brandGreen} h-full rounded-full transition-all duration-700`} style={{ width: `${cls.progress}%` }}></div>
                                                </div>
                                            </div>
                                            <button className={`bg-slate-900 text-white p-3.5 rounded-[1.25rem] group-hover:${brandGreen} transition-all shadow-xl`}>
                                                <ChevronRight size={22} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- INDIVIDUAL CLASSROOM VIEW --- */}
                {view === 'CLASSROOM' && selectedClass && !isMeetingActive && (
                    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

                        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('MANAGEMENT')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all active:scale-90">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedClass.title}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Instructor View</span>
                                        <span className="text-xs text-slate-400 font-medium font-mono">ID: {selectedClass.id}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={toggleMeeting} className={`flex items-center gap-2 ${brandGreen} ${brandGreenHover} text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md shadow-emerald-500/20 active:scale-95`}>
                                <Video size={18} /> Start Session
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 w-full space-y-8">
                            <div className="flex gap-10 border-b border-slate-100">
                                <button onClick={() => setActiveTab('lessons')} className={`pb-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeTab === 'lessons' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Lesson Plan
                                    {activeTab === 'lessons' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full"></div>}
                                </button>
                                <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeTab === 'assignments' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Assignments
                                    {activeTab === 'assignments' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full"></div>}
                                </button>
                                <button onClick={() => setActiveTab('students')} className={`pb-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeTab === 'students' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Students
                                    {activeTab === 'students' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full"></div>}
                                </button>
                            </div>

                            {/* LESSON PLAN TAB */}
                            {activeTab === 'lessons' && (
                                <div className="space-y-6 pb-10">
                                    <button
                                        onClick={handleOpenAddChapter}
                                        className="w-full py-8 border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-[2rem] text-slate-500 font-bold hover:bg-emerald-100 hover:text-emerald-600 transition-all flex flex-col items-center gap-2 group"
                                    >
                                        <Plus size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                        Add New Chapter / Material
                                    </button>

                                    {currentChapters.length === 0 && (
                                        <p className="text-center text-slate-400 italic mt-8">No chapters added yet. Create one above!</p>
                                    )}

                                    {currentChapters.map((chapter) => (
                                        <div key={chapter.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:border-emerald-200 shadow-sm">
                                            <div
                                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => toggleChapterExpand(chapter.id)}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-[1.25rem] flex items-center justify-center">
                                                        {chapter.isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg">{chapter.title}</h4>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                                                            {chapter.materials.length} Materials • {chapter.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => handleOpenEditChapter(chapter, e)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors bg-white rounded-full hover:bg-slate-200">
                                                        <Settings size={18} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteChapter(chapter.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-full hover:bg-red-50">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {chapter.isExpanded && (
                                                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                                    <div className="space-y-3 mb-4">
                                                        {chapter.materials.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic">No materials added yet.</p>
                                                        ) : (
                                                            chapter.materials.map(mat => (
                                                                <div key={mat.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        {getMaterialIcon(mat.type)}
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 text-sm block">{mat.title}</span>
                                                                            {/* Displays File Name or Link if available */}
                                                                            {mat.fileName && <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5"><Paperclip size={12} /> {mat.fileName}</span>}
                                                                            {mat.url && <a href={mat.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-500 hover:underline flex items-center gap-1 mt-0.5"><LinkIcon size={12} /> {mat.url}</a>}
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => handleDeleteMaterial(chapter.id, mat.id)} className="text-slate-300 hover:text-red-500">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => handleOpenAddMaterial(chapter.id, e)}
                                                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <Plus size={16} /> Add Material
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ASSIGNMENTS TAB */}
                            {activeTab === 'assignments' && (
                                <div className="space-y-4 pb-10">
                                    <button
                                        onClick={handleOpenAddAssignment}
                                        className="w-full py-4 bg-[#0f172a] rounded-[2rem] text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Plus size={20} /> Create New Assignment
                                    </button>

                                    {currentAssignments.length === 0 && (
                                        <p className="text-center text-slate-400 italic mt-8">No assignments created yet.</p>
                                    )}

                                    {currentAssignments.map((assignment) => (
                                        <div key={assignment.id} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-[1.25rem] flex items-center justify-center">
                                                    <ClipboardList size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-lg">{assignment.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <p className="text-sm text-slate-500">Due: {assignment.dueDate} • {assignment.submitted}/{assignment.total} Submitted</p>
                                                    </div>
                                                    {assignment.fileName && (
                                                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded">
                                                            <Paperclip size={12} /> {assignment.fileName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Review</button>
                                                <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-full">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* STUDENTS TAB */}
                            {activeTab === 'students' && (
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center border-dashed">
                                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800">Student Roster</h3>
                                    <p className="text-slate-400 text-sm mt-1">View and manage the students enrolled in {selectedClass.title}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- MODALS --- */}

                {/* 1. Create Class Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Classroom</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateClass} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Class Title</label>
                                    <input required name="title" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="e.g. Geometry Intensive" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Academic Subject</label>
                                    <select name="subject" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                                        <option>Mathematics</option>
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                        <option>English</option>
                                    </select>
                                </div>
                                <button type="submit" className={`w-full ${brandGreen} text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4`}>
                                    Finalize & Create
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 2. Add/Edit Chapter Modal */}
                {showChapterModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{chapterForm.id ? 'Edit Chapter' : 'New Chapter'}</h2>
                                <button onClick={() => setShowChapterModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleChapterSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Chapter Title</label>
                                    <input
                                        required
                                        value={chapterForm.title}
                                        onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder="e.g. Chapter 3: Advanced Methods"
                                    />
                                </div>
                                <button type="submit" className={`w-full ${brandGreen} text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4`}>
                                    Save Chapter
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. Add Material Modal (FIXED: FILE UPLOADS INCLUDED) */}
                {showMaterialModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Material</h2>
                                <button onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleMaterialSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Material Title</label>
                                    <input
                                        required
                                        value={materialForm.title}
                                        onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder="e.g. Video Lecture 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Type</label>
                                    <select
                                        value={materialForm.type}
                                        // Reset file/url when changing type
                                        onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any, file: null, url: '' })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="document">PDF / Document</option>
                                        <option value="video">Video Recording</option>
                                        <option value="link">External Link</option>
                                    </select>
                                </div>

                                {/* FILE UPLOAD / URL INPUT DEPENDING ON TYPE */}
                                {materialForm.type === 'link' ? (
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Paste Web Link</label>
                                        <input
                                            required
                                            type="url"
                                            value={materialForm.url}
                                            onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                                            placeholder="https://..."
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Upload File</label>
                                        <input
                                            required
                                            type="file"
                                            accept={materialForm.type === 'video' ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx"}
                                            onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files ? e.target.files[0] : null })}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                    </div>
                                )}

                                <button type="submit" className={`w-full ${brandGreen} text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95 mt-4`}>
                                    Add to Chapter
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 4. Create Assignment Modal */}
                {showAssignmentModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Assignment</h2>
                                <button onClick={() => setShowAssignmentModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAssignmentSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Assignment Title</label>
                                    <input
                                        required
                                        value={assignmentForm.title}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder="e.g. Chapter 1 Quiz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Attach Questions (PDF/Doc)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleAssignmentFileUpload}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={`w-full bg-[#0f172a] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 mt-4`}>
                                    Create Assignment
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}