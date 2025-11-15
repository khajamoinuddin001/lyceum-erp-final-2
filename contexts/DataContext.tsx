

import React, { createContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as api from '../utils/api';
import type { 
    User, Contact, CrmLead, AccountingTransaction, CrmStage, Quotation, QuotationTemplate, Visitor, TodoTask, 
    CalendarEvent, LmsCourse, LmsLesson, LmsModule, Coupon, Channel, Notification, DocumentAnalysisResult, UserRole, AppPermissions
} from '../types';
import useLocalStorage from '../components/useLocalStorage';
import { initDB, saveVideo as dbSaveVideo, deleteVideo as dbDeleteVideo } from '../utils/db';
import { analyzeDocument, draftEmail } from '../utils/gemini';
import { DEFAULT_CHECKLIST } from '../components/constants';

/**
 * @file DataContext.tsx
 * @description
 * This file establishes the central data layer for the Lyceum Academy application using React's Context API.
 * It follows a Redux-like pattern with a central state object, a reducer, and dispatched actions.
 * 
 * ARCHITECTURAL OVERVIEW:
 * 1.  Single Global Context: A single `DataContext` provides the entire application state (`AppState`) and all
 *     action dispatchers to any component that consumes it via the `useData` hook.
 * 2.  State Management: A `useReducer` hook manages all state transitions, ensuring predictable state updates.
 * 3.  Action Handlers: Asynchronous operations (like API calls) are encapsulated in action handler functions
 *     within the `DataProvider`. These functions perform the async work and then dispatch actions to update the state.
 * 4.  API Layer Abstraction: All data fetching and mutations are delegated to a dedicated API client (`utils/api.ts`),
 *     keeping the data context clean of raw `fetch` logic.
 * 5.  Authentication Flow: The provider manages the user's authentication state, including login, logout,
 *     and loading initial data based on the presence of an auth token in localStorage.
 * 
 * PRODUCTION-READINESS & FUTURE IMPROVEMENTS:
 * -   Scalability: While effective for this application's size, the single global context pattern can lead to
 *     performance issues in much larger applications due to frequent, broad re-renders. All components using `useData`
 *     will re-render whenever any part of the global state changes.
 * -   Potential Refactors for Scale:
 *     a)  Context Splitting: Break down the single `DataContext` into multiple, feature-specific contexts (e.g.,
 *         `AuthContext`, `LmsContext`, `CrmContext`). This limits re-renders to only the components that subscribe
 *         to the specific context that has changed.
 *     b)  State Management Libraries: For even greater control and performance optimization, migrating to a
 *         dedicated state management library like Zustand or Redux Toolkit would be a standard production approach.
 *         These libraries offer features like selector-based subscriptions, which prevent components from re-rendering
 *         if the specific slice of state they care about hasn't changed.
 * -   Memoization: The current implementation correctly uses `useMemo` and `useCallback` for the context value and action
 *     handlers to prevent unnecessary re-renders of consumer components, which is a critical optimization for this pattern.
 */

// --- STATE AND ACTION TYPES ---

interface AppState {
    isLoading: boolean;
    isMobile: boolean;
    currentUser: User | null;
    impersonatingUser: User | null;
    storedCurrentUser: User | null;
    sidebarOpen: boolean;
    activeApp: string;
    darkMode: boolean;
    notificationsOpen: boolean;
    
    // Modals & UI State
    isSearchOpen: boolean;
    isQuickCreateOpen: boolean;
    isNewInvoiceModalOpen: boolean;
    isNewLeadModalOpen: boolean;
    isNewStaffModalOpen: boolean;
    isAnalysisModalOpen: boolean;
    isEmailComposerOpen: boolean;
    isNewVisitorModalOpen: boolean;
    isNewAppointmentModalOpen: boolean;
    isEventModalOpen: boolean;
    
    // Entity State
    selectedLead: CrmLead | null;
    editingLead: CrmLead | 'new' | null;
    editingContact: Contact | 'new' | null;
    contactViewMode: 'details' | 'documents' | 'visaFiling' | 'checklist';
    leadForQuotation: CrmLead | null;
    editingQuotation: Quotation | null;
    
    // AI Modal State
    analysisResult: DocumentAnalysisResult | null;
    analyzingDocumentName: string | null;
    emailDraft: string;
    emailComposerContact: Contact | null;
    
    // Reception State
    editingVisitor: Visitor | null;
    
    // Calendar State
    selectedEventInfo: { event?: CalendarEvent; date?: Date } | null;

    // LMS State
    activeCourse: LmsCourse | null;
    activeLesson: LmsLesson | null;
    editingCourse: LmsCourse | 'new' | null;
    editingLessonInfo: { moduleId?: string; lesson?: LmsLesson } | null;
    viewingCertificateForCourse: LmsCourse | null;
    courseToPurchase: LmsCourse | null;
    
    // Data collections
    users: User[];
    contacts: Contact[];
    leads: CrmLead[];
    transactions: AccountingTransaction[];
    quotationTemplates: QuotationTemplate[];
    visitors: Visitor[];
    tasks: TodoTask[];
    events: CalendarEvent[];
    channels: Channel[];
    coupons: Coupon[];
    lmsCourses: LmsCourse[];
    notifications: Notification[];
    activityLog: any[];
    paymentActivityLog: any[];
}

type Action =
  | { type: 'SET_INITIAL_DATA'; payload: Partial<AppState> }
  | { type: 'SET_STATE'; payload: { key: keyof AppState; value: any } }
  | { type: 'SET_DATA'; payload: { key: 'users' | 'contacts' | 'leads' | 'transactions' | 'quotationTemplates' | 'visitors' | 'tasks' | 'events' | 'channels' | 'coupons' | 'lmsCourses' | 'notifications' | 'activityLog' | 'paymentActivityLog'; value: any[] } }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'ADD_LEAD'; payload: CrmLead }
  | { type: 'UPDATE_LEAD'; payload: CrmLead }
  | { type: 'LOGIN'; payload: { user: User, storedUser: User } }
  | { type: 'LOGOUT' };


// --- REDUCER ---

const initialState: AppState = {
    isLoading: true,
    isMobile: false,
    currentUser: null,
    impersonatingUser: null,
    storedCurrentUser: null,
    sidebarOpen: true,
    activeApp: 'Apps',
    darkMode: false,
    notificationsOpen: false,
    isSearchOpen: false,
    isQuickCreateOpen: false,
    isNewInvoiceModalOpen: false,
    isNewLeadModalOpen: false,
    isNewStaffModalOpen: false,
    isAnalysisModalOpen: false,
    isEmailComposerOpen: false,
    isNewVisitorModalOpen: false,
    isNewAppointmentModalOpen: false,
    isEventModalOpen: false,
    selectedLead: null,
    editingLead: null,
    editingContact: null,
    contactViewMode: 'details',
    leadForQuotation: null,
    editingQuotation: null,
    analysisResult: null,
    analyzingDocumentName: null,
    emailDraft: '',
    emailComposerContact: null,
    editingVisitor: null,
    selectedEventInfo: null,
    activeCourse: null,
    activeLesson: null,
    editingCourse: null,
    editingLessonInfo: null,
    viewingCertificateForCourse: null,
    courseToPurchase: null,
    users: [],
    contacts: [],
    leads: [],
    transactions: [],
    quotationTemplates: [],
    visitors: [],
    tasks: [],
    events: [],
    channels: [],
    coupons: [],
    lmsCourses: [],
    notifications: [],
    activityLog: [],
    paymentActivityLog: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return { ...state, ...action.payload, isLoading: false };
        case 'SET_STATE':
            return { ...state, [action.payload.key]: action.payload.value };
        case 'SET_DATA':
            return { ...state, [action.payload.key]: action.payload.value };
        case 'LOGIN':
            return {
                ...state,
                currentUser: action.payload.user,
                storedCurrentUser: action.payload.storedUser,
                activeApp: action.payload.user.role === 'Student' ? 'StudentDashboard' : 'Apps',
            };
        case 'LOGOUT':
            return {
                ...initialState,
                isLoading: false,
                darkMode: state.darkMode,
                isMobile: state.isMobile,
                sidebarOpen: state.isMobile ? false : true,
            };
        default:
            return state;
    }
};


// --- CONTEXT ---
export interface DataContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  handleSave: (key: keyof AppState, value: any) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setDarkMode: (value: boolean | ((val: boolean) => boolean)) => void;
  handleLogin: (data: { user: User; token: string; }) => void;
  handleLogout: () => void;
  handleRegisterStudent: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string; }>;
  handlePasswordReset: (newPassword: string) => void;
  handleStartImpersonation: (userToImpersonate: User) => void;
  handleStopImpersonation: () => void;
  handleAppSelect: (appName: string) => void;
  handleSearchResultSelect: (result: { type: string, id: any }) => void;
  saveContact: (contact: Contact, isNew: boolean) => Promise<void>;
  updateLeadStage: (leadId: number, newStage: CrmStage) => void;
  saveLead: (leadData: Omit<CrmLead, 'id' | 'stage'> & { id?: number }, isNew: boolean) => void;
  saveQuotation: (quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => void;
  saveInvoice: (invoiceData: Omit<AccountingTransaction, 'id'>) => void;
  addNewStaff: (userData: Omit<User, 'id' | 'permissions'>) => void;
  handleUpdateUserRole: (userId: number, role: UserRole) => void;
  handleUpdateUserPermissions: (userId: number, permissions: { [key: string]: AppPermissions; }) => void;
  saveTask: (taskData: Omit<TodoTask, 'id'>) => void;
  handleUpdateChecklistItem: (contactId: number, itemId: number, completed: boolean) => void;
  saveEvent: (eventData: Omit<CalendarEvent, 'id'> & { id?: number; }) => void;
  deleteEvent: (eventId: number) => void;
  markAllNotificationsAsRead: () => void;
  handleAnalyzeDocument: (doc: { name: string }) => Promise<void>;
  generateEmailDraft: (prompt: string, contactName: string) => Promise<void>;
  saveQuotationTemplate: (template: QuotationTemplate) => void;
  deleteQuotationTemplate: (templateId: number) => void;
  saveVisitor: (visitorData: { id?: number; name: string; company: string; host: string; cardNumber: string; }) => void;
  editVisitor: (visitor: Visitor) => void;
  visitorCheckOut: (visitorId: number) => void;
  scheduleNewVisitor: (name: string, company: string, host: string, scheduledCheckIn: string) => void;
  checkInScheduledVisitor: (visitorId: number) => void;
  saveLmsCourse: (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => void;
  deleteLmsCourse: (courseId: string) => void;
  createLmsModule: (courseId: string, title: string) => void;
  updateLmsModule: (courseId: string, moduleId: string, newTitle: string) => void;
  deleteLmsModule: (courseId: string, moduleId: string) => void;
  saveLmsLesson: (lessonData: Omit<LmsLesson, 'id'> | LmsLesson) => void;
  deleteLmsLesson: (courseId: string, lessonId: string) => void;
  createLmsLesson: (moduleId: string) => void;
  updateLmsLesson: (lesson: LmsLesson) => void;
  handleMarkLessonComplete: (courseId: string, lessonId: string) => void;
  handleSaveLmsNote: (lessonId: string, note: string) => void;
  saveDiscussionPost: (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string; }) => void;
  setChannels: (updater: (prev: Channel[]) => Channel[]) => void;
  createGroupChannel: (name: string, memberIds: number[]) => void;
  handlePaymentSuccess: () => void;
  addSessionVideo: (contactId: number, videoBlob: Blob) => void;
  deleteSessionVideo: (contactId: number, sessionId: number) => void;
  saveCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;
  handleUpdateProfile: (userId: number, name: string, email: string) => void;
  handleChangePassword: (userId: number, current: string, newPass: string) => Promise<{ success: boolean; message: string; }>;
  recordPayment: (transactionId: string) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);


// --- PROVIDER COMPONENT ---

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [storedUser, setStoredUser] = useLocalStorage<User | null>('currentUser', null);
    const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);

    const handleSave = useCallback((key: keyof AppState, value: any) => {
        dispatch({ type: 'SET_STATE', payload: { key, value } });
    }, []);

    useEffect(() => {
        handleSave('darkMode', darkMode);
    }, [darkMode, handleSave]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setStoredUser(null);
        dispatch({ type: 'LOGOUT' });
    }, [setStoredUser]);

    useEffect(() => {
        const loadInitialData = async () => {
            await initDB();
            const token = localStorage.getItem('authToken');
            if (token && storedUser) {
                dispatch({ type: 'LOGIN', payload: { user: storedUser, storedUser } });
                try {
                    const [
                        users, contacts, leads, transactions, quotationTemplates, visitors, tasks,
                        events, channels, coupons, lmsCourses, notifications, activityLog, paymentActivityLog
                    ] = await Promise.all([
                        api.getUsers(), api.getContacts(), api.getLeads(), api.getTransactions(), api.getQuotationTemplates(),
                        api.getVisitors(), api.getTasks(), api.getEvents(), api.getChannels(), api.getCoupons(),
                        api.getLmsCourses(), api.getNotifications(), api.getActivityLog(), api.getPaymentActivityLog()
                    ]);
                    dispatch({
                        type: 'SET_INITIAL_DATA', payload: {
                            users, contacts, leads, transactions, quotationTemplates, visitors, tasks, events, channels,
                            coupons, lmsCourses, notifications, activityLog, paymentActivityLog
                        }
                    });
                } catch (error) {
                    console.error("Failed to load initial data", error);
                    // If token is invalid, log out
                    if (error instanceof Error && (error.message.includes('403') || error.message.includes('401'))) {
                        handleLogout();
                    }
                }
            } else {
                dispatch({ type: 'SET_STATE', payload: { key: 'isLoading', value: false } });
            }
        };

        loadInitialData();
    }, [storedUser, handleLogout]);

    // --- ACTION HANDLERS ---
    const setSidebarOpen = useCallback((isOpen: boolean) => handleSave('sidebarOpen', isOpen), [handleSave]);

    const handleLogin = useCallback((data: { user: User, token: string }) => {
        localStorage.setItem('authToken', data.token);
        setStoredUser(data.user);
        dispatch({ type: 'LOGIN', payload: { user: data.user, storedUser: data.user } });
    }, [setStoredUser]);

    const handleRegisterStudent = useCallback(async (name: string, email: string, password: string) => {
        try {
            const data = await api.registerStudent(name, email, password);
            handleLogin({ user: data.user, token: data.token });
            return { success: true, message: "Registration successful!" };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "Registration failed." };
        }
    }, [handleLogin]);

    const handlePasswordReset = useCallback(async (newPassword: string) => {
        try {
            const { updatedUser } = await api.setInitialPassword(newPassword);
            setStoredUser(updatedUser); // Update stored user with mustResetPassword: false
            dispatch({ type: 'SET_STATE', payload: { key: 'currentUser', value: updatedUser } });
        } catch (error) {
            console.error("Failed to reset password", error);
        }
    }, [setStoredUser]);

    const handleStartImpersonation = useCallback((userToImpersonate: User) => {
        handleSave('impersonatingUser', userToImpersonate);
        handleSave('currentUser', userToImpersonate);
    }, [handleSave]);

    const handleStopImpersonation = useCallback(() => {
        handleSave('currentUser', state.storedCurrentUser);
        handleSave('impersonatingUser', null);
    }, [handleSave, state.storedCurrentUser]);

    const handleAppSelect = useCallback((appName: string) => {
        handleSave('activeApp', appName);
        if (state.isMobile) {
            setSidebarOpen(false);
        }
    }, [handleSave, state.isMobile, setSidebarOpen]);

    const handleSearchResultSelect = useCallback((result: { type: string, id: any }) => {
        if (result.type === 'app') {
            handleAppSelect(result.id);
        } else if (result.type === 'contact') {
            const contact = state.contacts.find(c => c.id === result.id);
            if (contact) {
                handleSave('editingContact', contact);
                handleAppSelect('Contacts');
            }
        } else if (result.type === 'lead') {
            const lead = state.leads.find(l => l.id === result.id);
            if (lead) {
                handleSave('selectedLead', lead);
                handleAppSelect('CRM');
            }
        }
        handleSave('isSearchOpen', false);
    }, [handleAppSelect, handleSave, state.contacts, state.leads]);

    const saveContact = useCallback(async (contact: Contact, isNew: boolean) => {
        try {
            const savedContact = await api.saveContact(contact, isNew);
            const newContacts = isNew
                ? [savedContact, ...state.contacts]
                : state.contacts.map(c => c.id === savedContact.id ? savedContact : c);
            dispatch({ type: 'SET_DATA', payload: { key: 'contacts', value: newContacts } });
            handleSave('editingContact', null);
        } catch (error) { console.error("Failed to save contact", error); }
    }, [state.contacts, handleSave]);
    
    const updateLeadStage = useCallback(async (leadId: number, newStage: CrmStage) => {
        try {
            const updatedLeads = await api.updateLeadStage(leadId, newStage);
            dispatch({ type: 'SET_DATA', payload: { key: 'leads', value: updatedLeads }});
        } catch (error) { console.error('Failed to update lead stage', error); }
    }, []);

    const saveLead = useCallback(async (leadData: Omit<CrmLead, 'id' | 'stage'> & { id?: number }, isNew: boolean) => {
        try {
            const savedLead = await api.saveLead(leadData, isNew);
            const newLeads = isNew
                ? [savedLead, ...state.leads]
                : state.leads.map(l => l.id === savedLead.id ? savedLead : l);
            dispatch({ type: 'SET_DATA', payload: { key: 'leads', value: newLeads }});
            handleSave('isNewLeadModalOpen', false);
            handleSave('editingLead', null);
        } catch (error) { console.error('Failed to save lead', error); }
    }, [state.leads, handleSave]);

    const saveQuotation = useCallback(async (quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => {
        if (!state.leadForQuotation) return;
        try {
            const updatedLeads = await api.saveQuotation(state.leadForQuotation.id, quotationData);
            dispatch({ type: 'SET_DATA', payload: { key: 'leads', value: updatedLeads }});
            handleSave('leadForQuotation', null);
            handleSave('editingQuotation', null);
        } catch(error) { console.error("Failed to save quotation", error); }
    }, [state.leadForQuotation, handleSave]);
    
    const saveInvoice = useCallback(async (invoiceData: Omit<AccountingTransaction, 'id'>) => {
        try {
            const { transaction, allTransactions } = await api.saveInvoice(invoiceData);
            dispatch({ type: 'SET_DATA', payload: { key: 'transactions', value: allTransactions } });
            await api.logPaymentActivity(`Invoice #${transaction.id} created for ${transaction.customerName}`, transaction.amount, 'invoice_created');
            const paymentLogs = await api.getPaymentActivityLog();
            dispatch({ type: 'SET_DATA', payload: { key: 'paymentActivityLog', value: paymentLogs }});
            handleSave('isNewInvoiceModalOpen', false);
        } catch (error) { console.error("Failed to save invoice", error); }
    }, [handleSave]);

    const addNewStaff = useCallback(async (userData: Omit<User, 'id' | 'permissions'>) => {
        try {
            const { allUsers } = await api.addUser(userData);
            dispatch({ type: 'SET_DATA', payload: { key: 'users', value: allUsers } });
        } catch (error) { console.error("Failed to add staff", error); }
    }, []);

    const recordPayment = useCallback(async (transactionId: string) => {
        try {
            const { allTransactions, paidTransaction } = await api.recordPayment(transactionId);
            dispatch({ type: 'SET_DATA', payload: { key: 'transactions', value: allTransactions }});
            if (paidTransaction) {
                 await api.logPaymentActivity(`Payment received for Invoice #${paidTransaction.id}`, paidTransaction.amount, 'payment_received');
                 const paymentLogs = await api.getPaymentActivityLog();
                 dispatch({ type: 'SET_DATA', payload: { key: 'paymentActivityLog', value: paymentLogs }});
            }
        } catch (error) {
            console.error("Failed to record payment", error);
        }
    }, []);
    
    // --- CONTEXT VALUE ---
    const contextValue = useMemo(() => ({
        state,
        dispatch,
        handleSave,
        setSidebarOpen,
        setDarkMode,
        handleLogin,
        handleLogout,
        handleRegisterStudent,
        handlePasswordReset,
        handleStartImpersonation,
        handleStopImpersonation,
        handleAppSelect,
        handleSearchResultSelect,
        saveContact,
        updateLeadStage,
        saveLead,
        saveQuotation,
        saveInvoice,
        addNewStaff,
        recordPayment,
        handleUpdateUserRole: async (userId, role) => dispatch({ type: 'SET_DATA', payload: { key: 'users', value: await api.updateUserRole(userId, role) }}),
        handleUpdateUserPermissions: async (userId, permissions) => dispatch({ type: 'SET_DATA', payload: { key: 'users', value: await api.updateUserPermissions(userId, permissions) }}),
        saveTask: async (taskData) => dispatch({ type: 'SET_DATA', payload: { key: 'tasks', value: await api.saveTask(taskData) }}),
        handleUpdateChecklistItem: async (contactId, itemId, completed) => {
            const contact = state.contacts.find(c => c.id === contactId);
            if (!contact) return;
            const newChecklist = (contact.checklist || DEFAULT_CHECKLIST).map(item => item.id === itemId ? { ...item, completed } : item);
            await saveContact({ ...contact, checklist: newChecklist }, false);
        },
        saveEvent: async (eventData) => dispatch({ type: 'SET_DATA', payload: { key: 'events', value: await api.saveEvent(eventData) }}),
        deleteEvent: async (eventId) => dispatch({ type: 'SET_DATA', payload: { key: 'events', value: await api.deleteEvent(eventId) }}),
        markAllNotificationsAsRead: async () => dispatch({ type: 'SET_DATA', payload: { key: 'notifications', value: await api.markAllNotificationsAsRead() }}),
        handleAnalyzeDocument: async (doc) => {
            handleSave('analyzingDocumentName', doc.name);
            handleSave('isAnalysisModalOpen', true);
            const result = await analyzeDocument(doc.name); // In a real app, you'd pass content
            handleSave('analysisResult', result);
        },
        generateEmailDraft: async (prompt, contactName) => {
            handleSave('emailComposerContact', state.contacts.find(c => c.name === contactName) || null);
            handleSave('isEmailComposerOpen', true);
            handleSave('emailDraft', 'Generating...');
            const draft = await draftEmail(prompt, contactName);
            handleSave('emailDraft', draft);
        },
        saveQuotationTemplate: async (template) => {
            const isNew = !template.id;
            const templates = await api.saveQuotationTemplate(template, isNew);
            dispatch({ type: 'SET_DATA', payload: { key: 'quotationTemplates', value: templates }});
        },
        deleteQuotationTemplate: async (templateId) => {
            const templates = await api.deleteQuotationTemplate(templateId);
            dispatch({ type: 'SET_DATA', payload: { key: 'quotationTemplates', value: templates }});
        },
        saveVisitor: async (data) => {
             const visitors = await api.saveVisitor(data);
             dispatch({ type: 'SET_DATA', payload: { key: 'visitors', value: visitors }});
             handleSave('isNewVisitorModalOpen', false);
             handleSave('editingVisitor', null);
        },
        editVisitor: (visitor) => {
            handleSave('editingVisitor', visitor);
            handleSave('isNewVisitorModalOpen', true);
        },
        visitorCheckOut: async (visitorId) => {
            const { allVisitors } = await api.checkOutVisitor(visitorId);
            dispatch({ type: 'SET_DATA', payload: { key: 'visitors', value: allVisitors }});
        },
        scheduleNewVisitor: async (name, company, host, scheduledCheckIn) => {
            const visitors = await api.scheduleVisitor({ name, company, host, scheduledCheckIn });
            dispatch({ type: 'SET_DATA', payload: { key: 'visitors', value: visitors }});
            handleSave('isNewAppointmentModalOpen', false);
        },
        checkInScheduledVisitor: async (visitorId) => {
            const { allVisitors, checkedInVisitor } = await api.checkInScheduledVisitor(visitorId);
            if (checkedInVisitor) {
                await api.addNotification({ title: 'Visitor Arrived', description: `${checkedInVisitor.name} from ${checkedInVisitor.company} has arrived to see ${checkedInVisitor.host}.`});
                const notifications = await api.getNotifications();
                dispatch({ type: 'SET_DATA', payload: { key: 'notifications', value: notifications }});
            }
            dispatch({ type: 'SET_DATA', payload: { key: 'visitors', value: allVisitors }});
        },
        saveLmsCourse: async (courseData) => {
            const isNew = !('id' in courseData);
            const courses = await api.saveLmsCourse(courseData, isNew);
            dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
            handleSave('editingCourse', null);
        },
        deleteLmsCourse: async (courseId) => {
            if (window.confirm('Are you sure you want to delete this course and all its content?')) {
                const courses = await api.deleteLmsCourse(courseId);
                dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
            }
        },
        createLmsModule: async (courseId, title) => {
            const courses = await api.createLmsModule(courseId, title);
            dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
        },
        updateLmsModule: async (courseId, moduleId, newTitle) => {
            const courses = await api.updateLmsModule(courseId, moduleId, newTitle);
            dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
        },
        deleteLmsModule: async (courseId, moduleId) => {
            if (window.confirm('Are you sure you want to delete this module?')) {
                const courses = await api.deleteLmsModule(courseId, moduleId);
                dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
            }
        },
        saveLmsLesson: async (lessonData) => {
            const { editingLessonInfo, lmsCourses } = state;
            const isNew = !('id' in lessonData);
            
            let moduleId: string | undefined;
            let courseId: string | undefined;

            if (isNew) {
                moduleId = editingLessonInfo?.moduleId;
                if (moduleId) {
                    for (const course of lmsCourses) {
                        if (course.modules.some(m => m.id === moduleId)) {
                            courseId = course.id;
                            break;
                        }
                    }
                }
            } else {
                const lesson = lessonData as LmsLesson;
                for (const course of lmsCourses) {
                    for (const module of course.modules) {
                        if (module.lessons.some(l => l.id === lesson.id)) {
                            moduleId = module.id;
                            courseId = course.id;
                            break;
                        }
                    }
                    if (moduleId) break;
                }
            }

            if (!moduleId || !courseId) return console.error("Cannot save lesson: could not determine module or course ID.");

            const courses = await api.saveLmsLesson(courseId, moduleId, lessonData, isNew);
            dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
            
            const updatedCourse = courses.find(c => c.id === courseId);
            if (state.activeCourse?.id === courseId && updatedCourse) {
                 handleSave('activeCourse', updatedCourse);
            }
            handleSave('editingLessonInfo', null);
        },
        deleteLmsLesson: async (courseId, lessonId) => {
            if (window.confirm('Are you sure you want to delete this lesson?')) {
                const courses = await api.deleteLmsLesson(courseId, lessonId);
                dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
            }
        },
        handleMarkLessonComplete: (courseId, lessonId) => {
            const student = state.contacts.find(c => c.userId === state.currentUser?.id);
            if (!student) return;
            const progress = student.lmsProgress || {};
            const courseProgress = progress[courseId] || { completedLessons: [] };
            if (!courseProgress.completedLessons.includes(lessonId)) {
                const updatedProgress = { ...progress, [courseId]: { ...courseProgress, completedLessons: [...courseProgress.completedLessons, lessonId]}};
                saveContact({ ...student, lmsProgress: updatedProgress }, false);
            }
        },
        handleSaveLmsNote: (lessonId, note) => {
            const student = state.contacts.find(c => c.userId === state.currentUser?.id);
            if (!student) return;
            const updatedNotes = { ...(student.lmsNotes || {}), [lessonId]: note };
            saveContact({ ...student, lmsNotes: updatedNotes }, false);
        },
        saveDiscussionPost: async (courseId, threadId, postContent) => {
            const courses = await api.saveDiscussionPost(courseId, threadId, postContent);
            dispatch({ type: 'SET_DATA', payload: { key: 'lmsCourses', value: courses }});
        },
        setChannels: (updater) => {
            const newChannels = updater(state.channels);
            dispatch({ type: 'SET_DATA', payload: { key: 'channels', value: newChannels } });
            api.saveChannels(newChannels); // Fire-and-forget save
        },
        createGroupChannel: async (name, memberIds) => {
            const channels = await api.createGroupChannel(name, memberIds);
            dispatch({ type: 'SET_DATA', payload: { key: 'channels', value: channels }});
        },
        handlePaymentSuccess: () => {
             const { courseToPurchase, currentUser } = state;
             if (!courseToPurchase || !currentUser) return;
             const student = state.contacts.find(c => c.userId === currentUser.id);
             if (!student) return;
             
             const progress = student.lmsProgress || {};
             if (!progress[courseToPurchase.id]) {
                 const updatedProgress = { ...progress, [courseToPurchase.id]: { completedLessons: [] } };
                 saveContact({ ...student, lmsProgress: updatedProgress }, false);
             }
             handleSave('courseToPurchase', null);
             handleSave('activeApp', 'LMS');
             handleSave('activeCourse', courseToPurchase);
        },
        addSessionVideo: async (contactId, videoBlob) => {
            const sessionId = Date.now();
            await dbSaveVideo(sessionId, videoBlob);
            const contact = state.contacts.find(c => c.id === contactId);
            if (contact) {
                const newSession = { id: sessionId, timestamp: new Date().toISOString() };
                const updatedSessions = [...(contact.recordedSessions || []), newSession];
                saveContact({ ...contact, recordedSessions: updatedSessions }, false);
            }
        },
        deleteSessionVideo: async (contactId, sessionId) => {
            await dbDeleteVideo(sessionId);
            const contact = state.contacts.find(c => c.id === contactId);
            if (contact) {
                const updatedSessions = (contact.recordedSessions || []).filter(s => s.id !== sessionId);
                saveContact({ ...contact, recordedSessions: updatedSessions }, false);
            }
        },
        saveCoupon: async (coupon) => {
            const coupons = await api.saveCoupon(coupon);
            dispatch({ type: 'SET_DATA', payload: { key: 'coupons', value: coupons }});
        },
        deleteCoupon: async (code) => {
            if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
                const coupons = await api.deleteCoupon(code);
                dispatch({ type: 'SET_DATA', payload: { key: 'coupons', value: coupons }});
            }
        },
        handleUpdateProfile: async (userId, name, email) => {
            try {
                const updatedUser = await api.saveUser({ id: userId, name, email } as User);
                dispatch({ type: 'SET_STATE', payload: { key: 'currentUser', value: updatedUser }});
                if (state.storedCurrentUser?.id === userId) {
                    setStoredUser(updatedUser);
                }
                const updatedUsers = state.users.map(u => u.id === userId ? { ...u, name, email } : u);
                dispatch({ type: 'SET_DATA', payload: { key: 'users', value: updatedUsers }});
            } catch (e) { console.error('Profile update failed', e); }
        },
        handleChangePassword: async (userId, current, newPass) => {
            try {
                await api.changePassword(userId, current, newPass);
                return { success: true, message: 'Password updated successfully.' };
            } catch (e) {
                return { success: false, message: e instanceof Error ? e.message : 'An unknown error occurred.'};
            }
        },
        // These are UI-only state setters for the modal
        createLmsLesson: (moduleId) => handleSave('editingLessonInfo', { moduleId }),
        updateLmsLesson: (lesson) => handleSave('editingLessonInfo', { lesson }),
    }), [state, handleSave, setSidebarOpen, setDarkMode, handleLogin, handleLogout, handleRegisterStudent, handlePasswordReset, handleStartImpersonation, handleStopImpersonation, handleAppSelect, handleSearchResultSelect, saveContact, updateLeadStage, saveLead, saveQuotation, saveInvoice, addNewStaff, setStoredUser, recordPayment]);


    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};
