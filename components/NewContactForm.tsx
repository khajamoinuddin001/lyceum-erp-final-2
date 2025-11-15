

import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Sparkles, MailPlus, Flag, PlusCircle, StickyNote, Video as VideoIcon, CheckCircle2, VideoOff, Camera, Plus, Trash2, ChevronDown, Upload } from './icons';
import type { Contact, FileStatus, User, ContactActivity, ContactActivityAction, RecordedSession } from '../types';
import { summarizeText } from '../utils/gemini';
import VideoRecordingModal from './VideoRecordingModal';
import { getVideo } from '../utils/db';
import CameraModal from './CameraModal';
import { useData } from '../hooks/useData';

const SessionPlayer: React.FC<{
    session: RecordedSession;
    onDelete: (sessionId: number) => void;
    canWrite: boolean;
}> = ({ session, onDelete, canWrite }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchVideo = async () => {
            if (isOpen && !videoUrl) {
                setIsLoading(true);
                setError(null);
                try {
                    const blob = await getVideo(session.id);
                    if (isMounted && blob) {
                        setVideoUrl(URL.createObjectURL(blob));
                    } else if (isMounted) {
                        setError("Video not found in local database.");
                    }
                } catch (err) {
                    console.error("Failed to load video", err);
                    if (isMounted) setError("Failed to load video.");
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }
            }
        };

        fetchVideo();

        return () => {
            isMounted = false;
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [isOpen, session.id]);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center overflow-hidden">
                    <VideoIcon size={16} className="mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        Session from {new Date(session.timestamp).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                        disabled={!canWrite}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        title="Delete Session"
                    >
                        <Trash2 size={14} />
                    </button>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center text-white">Loading...</div>
                    ) : error ? (
                        <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center text-red-500 text-sm p-2">{error}</div>
                    ) : videoUrl ? (
                        <video src={videoUrl} controls className="w-full rounded-md aspect-video bg-black"></video>
                    ) : null}
                </div>
            )}
        </div>
    );
};


const FormRow: React.FC<{ label: string; helpText?: string; children: React.ReactNode; }> = ({ label, helpText, children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center pt-1">
            {label}
            {helpText && (
                <span className="ml-2" title={helpText}>
                    <HelpCircle size={14} className="text-gray-400" />
                </span>
            )}
        </label>
        <div className="sm:col-span-2">
            {children}
        </div>
    </div>
);

const FormInput: React.FC<{
    name: string;
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ name, value, onChange, placeholder, disabled }) => (
    <input
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none placeholder:text-gray-400/80 disabled:opacity-70 disabled:cursor-not-allowed"
    />
);

const ActivityIcon: React.FC<{ action: ContactActivityAction }> = ({ action }) => {
    const iconMap: { [key in ContactActivityAction]: React.ReactNode } = {
        created: <PlusCircle size={16} />,
        note: <StickyNote size={16} />,
        status: <Flag size={16} />,
        checklist: <CheckCircle2 size={16} />,
        video_add: <VideoIcon size={16} />,
        video_remove: <VideoOff size={16} />,
    };
    return <div className="w-8 h-8 rounded-full flex items-center justify-center bg-lyceum-blue/10 text-lyceum-blue flex-shrink-0">{iconMap[action]}</div>;
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

const initialFormState = {
    name: '',
    avatarUrl: undefined as string | undefined,
    street1: '', street2: '', city: '', country: '', zip: '', state: '',
    gstin: '', referenceNumber: '', pan: '',
    phone: '', email: '', tags: '', visaType: '', countryOfApplication: '', source: '', contactType: '',
    majors: '', stream: '', course: '', intake: '',
    counselorAssigned: '', agentAssigned: '', applicationEmail: '', applicationPassword: '', fileStatus: '',
    notes: '',
};

const generateReferenceNumber = (allContacts: Contact[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `LA${year}${month}`;

    let maxNum = 0;
    allContacts.forEach(c => {
        if (c.contactId.startsWith(prefix)) {
            const numPart = parseInt(c.contactId.slice(prefix.length), 10);
            if (numPart > maxNum) {
                maxNum = numPart;
            }
        }
    });
    
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
};


export const NewContactForm: React.FC = () => {
  const { state, handleSave: handleContextSave, saveContact, generateEmailDraft, addSessionVideo, deleteSessionVideo } = useData();
  const { editingContact, contacts, currentUser: user } = state;
  const contact = editingContact === 'new' ? undefined : editingContact;
  
  const [formData, setFormData] = useState(initialFormState);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !contact;

  if (!user) return null;
  const canWrite = isNew ? user.permissions['Contacts']?.create : user.permissions['Contacts']?.update;

  const onNavigateBack = () => handleContextSave('editingContact', null);
  const onNavigateToDocuments = () => handleContextSave('contactViewMode', 'documents');
  const onNavigateToVisa = () => handleContextSave('contactViewMode', 'visaFiling');
  const onNavigateToChecklist = () => handleContextSave('contactViewMode', 'checklist');

  useEffect(() => {
    if (contact) {
      setFormData({
        ...initialFormState,
        name: contact.name || '',
        avatarUrl: contact.avatarUrl,
        email: contact.email || '',
        phone: contact.phone || '',
        referenceNumber: contact.contactId || '',
        course: contact.department || '',
        majors: contact.major || '',
        agentAssigned: contact.agentAssigned || '',
        notes: contact.notes || '',
        fileStatus: contact.fileStatus || '',
        street1: contact.street1 || '',
        street2: contact.street2 || '',
        city: contact.city || '',
        state: contact.state || '',
        zip: contact.zip || '',
        country: contact.country || '',
        gstin: contact.gstin || '',
        pan: contact.pan || '',
        tags: contact.tags || '',
        visaType: contact.visaType || '',
        countryOfApplication: contact.countryOfApplication || '',
        source: contact.source || '',
        contactType: contact.contactType || '',
        stream: contact.stream || '',
        intake: contact.intake || '',
        counselorAssigned: contact.counselorAssigned || '',
        applicationEmail: contact.applicationEmail || '',
        applicationPassword: contact.applicationPassword || '',
      });
    } else {
      setFormData({
        ...initialFormState,
        referenceNumber: generateReferenceNumber(contacts),
      });
    }
  }, [contact, contacts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
                setIsAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(formData.avatarUrl);
            }
        };
    }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSummarize = async () => {
    if (!formData.notes.trim()) return;
    setIsSummarizing(true);
    try {
        const summary = await summarizeText(formData.notes);
        setFormData(prev => ({ ...prev, notes: summary }));
    } catch (error) {
        console.error("Failed to summarize notes:", error);
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleComposeEmail = () => {
    if (!contact) return;
    const prompt = window.prompt("What should the email be about?");
    if (prompt) {
        generateEmailDraft(prompt, contact.name);
    }
  };

  const handleSave = () => {
      const contactToSave: Contact = {
          id: contact?.id || 0,
          name: formData.name,
          avatarUrl: formData.avatarUrl,
          contactId: formData.referenceNumber,
          department: formData.course,
          major: formData.majors,
          email: formData.email,
          phone: formData.phone,
          agentAssigned: formData.agentAssigned,
          notes: formData.notes,
          fileStatus: formData.fileStatus as FileStatus,
          documents: contact?.documents,
          visaInformation: contact?.visaInformation,
          checklist: contact?.checklist,
          activityLog: contact?.activityLog,
          recordedSessions: contact?.recordedSessions,
          street1: formData.street1,
          street2: formData.street2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          gstin: formData.gstin,
          pan: formData.pan,
          tags: formData.tags,
          visaType: formData.visaType,
          countryOfApplication: formData.countryOfApplication,
          source: formData.source,
          contactType: formData.contactType,
          stream: formData.stream,
          intake: formData.intake,
          counselorAssigned: formData.counselorAssigned,
          applicationEmail: formData.applicationEmail,
          applicationPassword: formData.applicationPassword,
      };
      saveContact(contactToSave, isNew);
  };

  const handleSaveVideo = async (videoBlob: Blob) => {
    if (!contact || typeof contact === 'string') return;
    await addSessionVideo(contact.id, videoBlob);
  };
  
  const handleDeleteVideo = async (sessionId: number) => {
    if (!contact || typeof contact === 'string') return;
    if (window.confirm("Are you sure you want to delete this recorded session?")) {
        await deleteSessionVideo(contact.id, sessionId);
    }
  };

  const handleAvatarClick = () => {
    if (canWrite) {
      setIsAvatarMenuOpen(prev => !prev);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.avatarUrl);
      }
      const newUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
    }
    setIsAvatarMenuOpen(false);
  };

  const handleCapture = (blob: Blob) => {
    if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.avatarUrl);
    }
    const newUrl = URL.createObjectURL(blob);
    setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
    setIsCameraModalOpen(false);
    setIsAvatarMenuOpen(false);
  };

  const handleRemovePhoto = () => {
    if (formData.avatarUrl && formData.avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.avatarUrl);
    }
    setFormData(prev => ({ ...prev, avatarUrl: undefined }));
    setIsAvatarMenuOpen(false);
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
        <div className="p-4 sm:p-6">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Brandon Freeman"
                    disabled={!canWrite}
                    className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-3xl font-bold focus:outline-none placeholder:text-gray-400/80 border-b-2 border-gray-200 dark:border-gray-700 focus:border-lyceum-blue pb-2"
                />
                 <div className="relative sm:ml-6 flex-shrink-0 self-center sm:self-auto" ref={avatarMenuRef}>
                    <button
                        onClick={handleAvatarClick}
                        disabled={!canWrite}
                        className="w-20 h-20 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-lyceum-blue hover:text-lyceum-blue transition-colors disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400"
                    >
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Contact Avatar" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <Camera size={24} />
                        )}
                    </button>
                    {isAvatarMenuOpen && canWrite && (
                        <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10 border dark:border-gray-600">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <Upload size={16} className="mr-3" />
                                Upload Photo
                            </button>
                            <button onClick={() => { setIsCameraModalOpen(true); setIsAvatarMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <Camera size={16} className="mr-3" />
                                Take Photo
                            </button>
                            {formData.avatarUrl && (
                                <>
                                <div className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
                                <button onClick={handleRemovePhoto} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                    <Trash2 size={16} className="mr-3" />
                                    Remove Photo
                                </button>
                                </>
                            )}
                        </div>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </div>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto px-4 sm:px-6 hide-scrollbar">
                <button className="px-3 py-3 font-semibold text-lyceum-blue border-b-2 border-lyceum-blue -mb-px whitespace-nowrap" aria-current="page">Details</button>
                <button onClick={onNavigateToDocuments} disabled={!contact} className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Documents</button>
                <button onClick={onNavigateToChecklist} disabled={!contact} className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Checklist</button>
                <button onClick={onNavigateToVisa} disabled={!contact} className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Visa Filing</button>
            </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 p-4 sm:p-6">
            {/* Left Column */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-1">Address</label>
                    <div className="sm:col-span-2 space-y-2">
                        <FormInput name="street1" value={formData.street1} onChange={handleChange} placeholder="Street..." disabled={!canWrite} />
                        <FormInput name="street2" value={formData.street2} onChange={handleChange} placeholder="Street 2..." disabled={!canWrite} />
                        <div className="flex gap-2">
                             <FormInput name="city" value={formData.city} onChange={handleChange} placeholder="City" disabled={!canWrite} />
                             <FormInput name="state" value={formData.state} onChange={handleChange} placeholder="State" disabled={!canWrite} />
                        </div>
                        <div className="flex gap-2">
                             <FormInput name="zip" value={formData.zip} onChange={handleChange} placeholder="ZIP" disabled={!canWrite} />
                             <FormInput name="country" value={formData.country} onChange={handleChange} placeholder="Country" disabled={!canWrite} />
                        </div>
                    </div>
                </div>
                 <FormRow label="GSTIN">
                    <FormInput name="gstin" value={formData.gstin} onChange={handleChange} disabled={!canWrite} />
                </FormRow>
                <FormRow label="Reference Number">
                    <FormInput name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} disabled />
                </FormRow>
                <FormRow label="PAN" helpText="Permanent Account Number">
                    <FormInput name="pan" value={formData.pan} onChange={handleChange} placeholder="e.g. ABCDE1234F" disabled={!canWrite} />
                </FormRow>
            </div>
            
            {/* Right Column */}
            <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700/50">
                <FormRow label="Phone"><FormInput name="phone" value={formData.phone} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Email"><FormInput name="email" value={formData.email} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Tags"><FormInput name="tags" value={formData.tags} onChange={handleChange} placeholder='e.g. "B2B", "VIP", "Consulting", ...' disabled={!canWrite} /></FormRow>
                <FormRow label="Visa Type"><FormInput name="visaType" value={formData.visaType} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Country"><FormInput name="countryOfApplication" value={formData.countryOfApplication} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Source"><FormInput name="source" value={formData.source} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Type"><FormInput name="contactType" value={formData.contactType} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Majors"><FormInput name="majors" value={formData.majors} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Stream"><FormInput name="stream" value={formData.stream} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Course"><FormInput name="course" value={formData.course} onChange={handleChange} disabled={!canWrite} /></FormRow>
                <FormRow label="Intake"><FormInput name="intake" value={formData.intake} onChange={handleChange} disabled={!canWrite} /></FormRow>
    <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
    `}</style>
    {isCameraModalOpen && <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onCapture={handleCapture} />}
    {isVideoModalOpen && <VideoRecordingModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} onSave={handleSaveVideo} />}
</div>
  );
};
