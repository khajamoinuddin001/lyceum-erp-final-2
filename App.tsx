
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AppsGridView from './components/AppsGridView';
import Dashboard from './components/Dashboard';
import DiscussView from './components/DiscussView';
import AppView from './components/AppView';
import TodoView from './hooks/TodoView';
import ContactsView from './components/ContactsView';
import ProfileView from './components/ProfileView';
import StudentProfileView from './components/StudentProfileView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import CrmView from './components/CrmView';
import AccountingView from './components/AccountingView';
import ReceptionView from './components/ReceptionView';
import Loader from './components/Loader';
import SearchModal from './components/SearchModal';
import QuickCreateModal from './components/QuickCreateModal';
import NewContactForm from './components/NewContactForm';
import ContactDocumentsView from './components/ContactDocumentsView';
import ContactVisaView from './components/ContactVisaView';
import LeadDetailsModal from './components/LeadDetailsModal';
import NewInvoiceModal from './components/NewInvoiceModal';
import NewLeadModal from './components/NewLeadModal';
import NewQuotationPage from './components/NewQuotationModal';
import useLocalStorage from './components/useLocalStorage';
import { saveVideo, deleteVideo } from './utils/db';
import * as api from './utils/api';
import type { CalendarEvent, Contact, CrmLead, AccountingTransaction, CrmStage, Quotation, User, UserRole, AppPermissions, ActivityLog, DocumentAnalysisResult, Document as Doc, ChecklistItem, QuotationTemplate, Visitor, TodoTask, PaymentActivityLog, LmsCourse, LmsLesson, LmsModule, Coupon, ContactActivity, ContactActivityAction, DiscussionPost, DiscussionThread, RecordedSession, Channel, Notification } from './types';
import LoginView from './components/LoginView';
import StudentDashboard from './components/StudentDashboard';
import AccessControlView from './components/AccessControlView';
import { DEFAULT_PERMISSIONS, DEFAULT_CHECKLIST } from './components/constants';
import NewStaffModal from './components/NewStaffModal';
import ImpersonationBanner from './components/ImpersonationBanner';
import DocumentAnalysisModal from './components/DocumentAnalysisModal';
import { analyzeDocument, draftEmail } from './utils/gemini';
import AIEmailComposerModal from './components/AIEmailComposerModal';
import ContactChecklistView from './components/ContactChecklistView';
import NewVisitorModal from './components/NewVisitorModal';
import NewAppointmentModal from './components/NewAppointmentModal';
import ResetPasswordView from './components/ResetPasswordView';
import LmsView from './components/LmsView';
import CourseDetailView from './components/CourseDetailView';
import CourseEditModal from './components/CourseEditModal';
import LessonEditModal from './components/LessonEditModal';
import CertificateView from './components/CertificateView';
import PaymentGatewayView from './components/PaymentGatewayView';
import LmsPlayerView from './components/LmsPlayerView';
import EventModal from './components/EventModal';
import SalesView from './components/SalesView';


type ContactViewMode = 'details' | 'documents' | 'visaFiling' | 'checklist';

const App: React.FC = () => {
  // UI State and Auth State can remain in localStorage for this iteration
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);
  const [storedCurrentUser, setStoredCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [impersonatingUser, setImpersonatingUser] = useLocalStorage<User | null>('impersonatingUser', null);

  // Application State - managed with useState, fetched from API layer
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeApp, setActiveApp] = useState('Apps');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [paymentActivityLog, setPaymentActivityLog] = useState<PaymentActivityLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<QuotationTemplate[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [lmsCourses, setLmsCourses] = useState<LmsCourse[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Component-specific state
  const [editingContact, setEditingContact] = useState<Contact | 'new' | null>(null);
  const [contactViewMode, setContactViewMode] = useState<ContactViewMode>('details');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | 'new' | null>(null);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [leadForQuotation, setLeadForQuotation] = useState<CrmLead | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isNewVisitorModalOpen, setIsNewVisitorModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<{ event?: CalendarEvent, date?: Date } | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [analyzedDocument, setAnalyzedDocument] = useState<Doc | null>(null);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailTargetContact, setEmailTargetContact] = useState<Contact | null>(null);
  const [activeCourse, setActiveCourse] = useState<LmsCourse | null>(null);
  const [activeLesson, setActiveLesson] = useState<LmsLesson | null>(null);
  const [editingCourse, setEditingCourse] = useState<LmsCourse | 'new' | null>(null);
  const [editingLessonInfo, setEditingLessonInfo] = useState<{ courseId: string; moduleId: string; lesson: LmsLesson | 'new' } | null>(null);
  const [viewingCertificateForCourse, setViewingCertificateForCourse] = useState<LmsCourse | null>(null);
  const [courseToPurchase, setCourseToPurchase] = useState<LmsCourse | null>(null);

  // Derived state
  const events = useMemo(() => rawEvents.map(e => ({...e, start: new Date(e.start), end: new Date(e.end)})), [rawEvents]);
  const setEvents = (newEvents: CalendarEvent[]) => api.saveEvents(newEvents).then(setRawEvents);
  const currentUser = impersonatingUser || storedCurrentUser;
  
  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [
                usersData, activityLogData, paymentLogData, contactsData, transactionsData, leadsData,
                templatesData, visitorsData, tasksData, eventsData, channelsData, couponsData, lmsCoursesData, notificationsData
            ] = await Promise.all([
                api.getUsers(), api.getActivityLog(), api.getPaymentActivityLog(), api.getContacts(), api.getTransactions(), api.getLeads(),
                api.getQuotationTemplates(), api.getVisitors(), api.getTasks(), api.getEvents(), api.getChannels(), api.getCoupons(), api.getLmsCourses(), api.getNotifications()
            ]);
            setUsers(usersData); setActivityLog(activityLogData); setPaymentActivityLog(paymentLogData); setContacts(contactsData); setTransactions(transactionsData);
            setLeads(leadsData); setQuotationTemplates(templatesData); setVisitors(visitorsData); setTasks(tasksData); setRawEvents(eventsData);
            setChannels(channelsData); setCoupons(couponsData); setLmsCourses(lmsCoursesData); setNotifications(notificationsData);
        } catch (error) {
            console.error("Failed to load initial data", error);
            // If token is invalid or expired, log out user
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('token'))) {
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [currentUser]); // Reload data when user changes

  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
        const forEveryone = !n.recipientUserIds?.length && !n.recipientRoles?.length;
        const forUser = n.recipientUserIds?.includes(currentUser.id);
        const forRole = n.recipientRoles?.includes(currentUser.role);

        if (forEveryone) {
            return currentUser.role !== 'Student'; // Equivalent to Admin or Employee
        }
        
        return !!(forUser || forRole);
    });
  }, [notifications, currentUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setSidebarOpen]);

  useEffect(() => {
    if (currentUser?.role === 'Student') {
        document.title = `Lyceum Academy | Portal`;
    } else {
        document.title = `Lyceum Academy | ${activeApp}`;
    }
  }, [activeApp, currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (activeCourse) {
        const freshCourse = lmsCourses.find(c => c.id === activeCourse.id);
        if (freshCourse) {
            setActiveCourse(freshCourse);
        } else {
            setActiveCourse(null);
            setActiveLesson(null);
        }
    }
}, [lmsCourses, activeCourse]);

  // Cleanup blob URLs on page unload to prevent memory leaks
  useEffect(() => {
    const handleUnload = () => {
      lmsCourses.forEach(course => {
        course.modules.forEach(module => {
          module.lessons.forEach(lesson => {
            if (lesson.videoUrl && lesson.videoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(lesson.videoUrl);
            }
          });
        });
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [lmsCourses]);

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotifications = await api.addNotification(notification);
    setNotifications(newNotifications);
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const newNotifications = await api.markAllNotificationsAsRead();
    setNotifications(newNotifications);
  };

  const logActivity = async (action: string) => {
    if (!storedCurrentUser) return;
    const newLog = await api.logActivity(action);
    setActivityLog(newLog);
  };

  const logContactActivity = (contactId: number, action: ContactActivityAction, description: string) => {
    const newActivity: ContactActivity = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action,
        description,
    };

    setContacts(prevContacts => prevContacts.map(c => {
        if (c.id === contactId) {
            const updatedLog = [newActivity, ...(c.activityLog || [])].slice(0, 20); // Keep last 20 activities
            const updatedContact = { ...c, activityLog: updatedLog };
             if (editingContact && typeof editingContact !== 'string' && editingContact.id === contactId) {
                setEditingContact(updatedContact);
            }
            api.saveContact(updatedContact, false); // Persist change
            return updatedContact;
        }
        return c;
    }));
  };

  const handleLogin = (data: { user: User; token: string }) => {
    localStorage.setItem('authToken', data.token);
    setStoredCurrentUser(data.user);
    setImpersonatingUser(null);
    if (data.user.mustResetPassword) {
      return;
    }
    if (data.user.role === 'Student') {
        setActiveApp('StudentDashboard');
    } else if (data.user.role === 'Employee') {
        setActiveApp('Apps');
    } else {
        setActiveApp('Dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setStoredCurrentUser(null);
    setImpersonatingUser(null);
  };

  const handlePasswordReset = async (newPassword: string) => {
    if (!storedCurrentUser) return;
    try {
        const { updatedUser } = await api.setInitialPassword(newPassword);
        if (updatedUser) {
            setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
            setStoredCurrentUser(prev => {
                if (!prev) return null;
                const freshUser = { ...prev, ...updatedUser };
                if (freshUser.role === 'Student') setActiveApp('StudentDashboard');
                else if (freshUser.role === 'Employee') setActiveApp('Apps');
                else setActiveApp('Dashboard');
                return freshUser;
            });
        }
    } catch (error) {
        console.error("Password reset failed", error);
    }
  };

  const handleRegisterStudent = async (name: string, email: string, password: string): Promise<{ success: boolean, message: string }> => {
    try {
        const { user: newStudentUser, contact: newStudentContact, token } = await api.registerStudent(name, email, password);
        
        setUsers(prev => [...prev, newStudentUser]);
        setContacts(prev => [...prev, newStudentContact]);
        
        addNotification({
          title: 'New Student Registered',
          description: `${name} has just registered as a new student.`,
          linkTo: { type: 'contact', id: newStudentContact.id },
          recipientRoles: ['Admin', 'Employee']
        });

        handleLogin({ user: newStudentUser, token });
        return { success: true, message: 'Registration successful!' };
    } catch(error) {
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.'};
    }
};

  const handleStartImpersonation = (userToImpersonate: User) => {
    if (storedCurrentUser?.role === 'Admin' && storedCurrentUser.id !== userToImpersonate.id) {
      setImpersonatingUser(userToImpersonate);
      logActivity(`Started impersonating ${userToImpersonate.name}.`);
      if (userToImpersonate.role === 'Student') setActiveApp('StudentDashboard');
      else if (userToImpersonate.role === 'Employee') setActiveApp('Apps');
      else setActiveApp('Dashboard');
    }
  };

  const handleStopImpersonation = () => {
    if (impersonatingUser) {
      logActivity(`Stopped impersonating ${impersonatingUser.name}.`);
      setImpersonatingUser(null);
      setActiveApp('Access Control');
    }
  };

  const handleAppSelect = (appName: string) => {
    setActiveApp(appName);
    setEditingContact(null);
    setContactViewMode('details');
    setLeadForQuotation(null);
    setEditingQuotation(null);
    setActiveCourse(null);
    setActiveLesson(null);
    setViewingCertificateForCourse(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  const handleContactSelect = (contact: Contact) => {
    setEditingContact(contact);
    setContactViewMode('details');
  };
  
  const handleNewContactClick = () => {
    setEditingContact('new');
    setContactViewMode('details');
  };

  const handleBackToContacts = () => {
    setEditingContact(null);
    setContactViewMode('details');
  };
  
  const handleSaveContact = async (updatedContact: Contact) => {
    if (editingContact === 'new' && !currentUser?.permissions['Contacts']?.create) return;
    if (editingContact !== 'new' && !currentUser?.permissions['Contacts']?.update) return;

    const isNew = editingContact === 'new';
    const originalContact = isNew ? null : contacts.find(c => c.id === updatedContact.id);

    const savedContact = await api.saveContact(updatedContact, isNew);

    if (isNew) {
        setContacts(prev => [savedContact, ...prev]);
        logContactActivity(savedContact.id, 'created', 'Contact was created.');
        handleBackToContacts();
    } else {
        setContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
        setEditingContact(savedContact);
        // Log changes
        if (originalContact && originalContact.notes !== savedContact.notes) {
            logContactActivity(savedContact.id, 'note', 'Notes were updated.');
        }
        if (originalContact && originalContact.fileStatus !== savedContact.fileStatus) {
            logContactActivity(savedContact.id, 'status', `Status changed to ${savedContact.fileStatus || 'Not Set'}.`);
        }
    }
  };
  
  const handleLeadSelect = (lead: CrmLead) => setSelectedLead(lead);
  const handleCloseLeadDetails = () => setSelectedLead(null);

  const handleSaveInvoice = async (newInvoice: Omit<AccountingTransaction, 'id'>) => {
      if (!currentUser?.permissions['Accounting']?.create) return;
      const { transaction: invoiceToAdd, allTransactions } = await api.saveInvoice(newInvoice);
      setTransactions(allTransactions);
      
      setIsNewInvoiceModalOpen(false);
      addNotification({
        title: 'New Invoice Created',
        description: `Invoice ${invoiceToAdd.id} for ${invoiceToAdd.customerName} has been created.`,
        recipientRoles: ['Admin', 'Employee']
      });

    const newPaymentLog = await api.logPaymentActivity(`Invoice ${invoiceToAdd.id} for ${invoiceToAdd.customerName} was created.`, invoiceToAdd.amount, 'invoice_created');
    setPaymentActivityLog(newPaymentLog);
  };

  const handleNewLeadClick = () => {
    setEditingLead('new');
    setIsNewLeadModalOpen(true);
  };

  const handleEditLeadClick = (lead: CrmLead) => {
      setSelectedLead(null);
      setEditingLead(lead);
      setIsNewLeadModalOpen(true);
  };

  const handleSaveLead = async (leadToSave: Omit<CrmLead, 'id' | 'stage' | 'quotations'> & { id?: number }) => {
    if (editingLead === 'new' && !currentUser?.permissions['CRM']?.create) return;
    if (editingLead !== 'new' && !currentUser?.permissions['CRM']?.update) return;

    const isNew = editingLead === 'new';
    const savedLead = await api.saveLead(leadToSave, isNew);
    
    if (isNew) {
        setLeads(prev => [savedLead, ...prev]);
        addNotification({
            title: 'New Lead Created',
            description: `A new lead "${savedLead.title}" for ${savedLead.company} has been created.`,
            linkTo: { type: 'lead', id: savedLead.id },
            recipientRoles: ['Admin', 'Employee']
        });
    } else {
        setLeads(prev => prev.map(l => l.id === savedLead.id ? savedLead : l));
    }
    setIsNewLeadModalOpen(false);
    setEditingLead(null);
  };

  const handleUpdateLeadStage = async (leadId: number, newStage: CrmStage) => {
      if (!currentUser?.permissions['CRM']?.update) return;
      const updatedLeads = await api.updateLeadStage(leadId, newStage);
      const lead = leads.find(l => l.id === leadId);
      if (lead && newStage === 'Won' && lead.stage !== 'Won') {
            addNotification({
                title: 'Lead Won!',
                description: `Congratulations! The lead "${lead.title}" has been moved to the 'Won' stage.`,
                linkTo: { type: 'lead', id: leadId },
                recipientRoles: ['Admin', 'Employee']
            });
      }
      setLeads(updatedLeads);
  };

  const handleNewQuotationClick = (lead: CrmLead) => {
    setLeadForQuotation(lead);
    setSelectedLead(null);
  };
  
  const handleEditQuotationClick = (lead: CrmLead, quotation: Quotation) => {
    setLeadForQuotation(lead);
    setEditingQuotation(quotation);
    setSelectedLead(null);
  };

  const handleCancelQuotation = () => {
    setLeadForQuotation(null);
    setEditingQuotation(null);
  };

  const handleSaveQuotation = async (quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => {
    if (!currentUser?.permissions['CRM']?.create && !currentUser?.permissions['CRM']?.update) return;
    if (!leadForQuotation) return;

    const updatedLeads = await api.saveQuotation(leadForQuotation.id, quotationData);
    setLeads(updatedLeads);

    setLeadForQuotation(null);
    setEditingQuotation(null);
  };
  
  const handleUpdateUserRole = async (userId: number, role: UserRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if(userToUpdate) {
      const updatedUsers = await api.updateUserRole(userId, role);
      setUsers(updatedUsers);
      logActivity(`Changed role for ${userToUpdate.name} from ${userToUpdate.role} to ${role}.`);
      addNotification({
          title: 'User Role Updated',
          description: `The role for ${userToUpdate.name} has been changed to ${role}.`,
          recipientRoles: ['Admin']
      });
    }
  };
  
  const handleUpdateUserPermissions = async (userId: number, permissions: { [key: string]: AppPermissions }) => {
    const userToUpdate = users.find(u => u.id === userId);
    if(userToUpdate) {
      const updatedUsers = await api.updateUserPermissions(userId, permissions);
      setUsers(updatedUsers);
      logActivity(`Updated app permissions for ${userToUpdate.name}.`);
      addNotification({
          title: 'Permissions Updated',
          description: `App permissions for ${userToUpdate.name} have been updated.`,
          recipientRoles: ['Admin']
      });
    }
  };

  const handleAddNewUser = async (newUser: Omit<User, 'id' | 'permissions'>) => {
    if (!currentUser?.permissions['Access Control']?.create) return;
    const { allUsers, addedUser } = await api.addUser(newUser);
    setUsers(allUsers);
    logActivity(`Created new staff member: ${addedUser.name}.`);
    addNotification({
      title: 'New Staff Member',
      description: `${addedUser.name} has been added as a new ${addedUser.role}.`,
      recipientRoles: ['Admin']
    });
  };

  const handleUpdateProfile = async (userId: number, name: string, email: string) => {
    const savedUser = await api.saveUser({ ...users.find(u => u.id === userId)!, name, email });
    setUsers(users.map(u => (u.id === savedUser.id ? savedUser : u)));
    
    if (storedCurrentUser && storedCurrentUser.id === userId) {
        setStoredCurrentUser(savedUser);
    }
    if (impersonatingUser && impersonatingUser.id === userId) {
        setImpersonatingUser(savedUser);
    }
    logActivity(`Updated profile for ${name}.`);
    addNotification({
        title: 'Profile Updated',
        description: `Your profile information has been successfully updated.`,
        recipientUserIds: [userId]
    });
  };

  const handleChangePassword = async (userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
        const { updatedUser } = await api.changePassword(userId, currentPassword, newPassword);
        if (updatedUser) {
            setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
            if (storedCurrentUser && storedCurrentUser.id === userId) {
                setStoredCurrentUser(updatedUser);
            }
            if (impersonatingUser && impersonatingUser.id === userId) {
                setImpersonatingUser(updatedUser);
            }
            logActivity(`Changed password for ${updatedUser.name}.`);
            addNotification({
                title: 'Password Changed',
                description: 'Your password has been successfully updated.',
                recipientUserIds: [userId]
            });
            return { success: true, message: 'Password updated successfully!' };
        }
        return { success: false, message: 'Failed to update user data.' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
  };

  const handleSaveQuotationTemplate = async (templateToSave: QuotationTemplate) => {
      const isNew = !templateToSave.id;
      const updatedTemplates = await api.saveQuotationTemplate(templateToSave, isNew);
      setQuotationTemplates(updatedTemplates);

      logActivity(`${isNew ? 'Created' : 'Updated'} quotation template: "${templateToSave.title}".`);
      addNotification({
          title: `Template ${isNew ? 'Created' : 'Updated'}`,
          description: `Quotation template "${templateToSave.title}" has been saved.`,
          recipientRoles: ['Admin', 'Employee']
      });
  };

  const handleDeleteQuotationTemplate = async (templateId: number) => {
      const templateToDelete = quotationTemplates.find(t => t.id === templateId);
      if(templateToDelete) {
        const updatedTemplates = await api.deleteQuotationTemplate(templateId);
        setQuotationTemplates(updatedTemplates);
        logActivity(`Deleted quotation template: "${templateToDelete.title}".`);
        addNotification({
            title: 'Template Deleted',
            description: `Quotation template "${templateToDelete.title}" has been removed.`,
            recipientRoles: ['Admin', 'Employee']
        });
      }
  };

  const handleSaveCoupon = async (couponToSave: Coupon) => {
    const updatedCoupons = await api.saveCoupon(couponToSave);
    setCoupons(updatedCoupons);
    logActivity(`Saved coupon: "${couponToSave.code}".`);
    addNotification({
        title: 'Coupon Saved',
        description: `Coupon code "${couponToSave.code}" has been saved.`,
        recipientRoles: ['Admin']
    });
  };

  const handleDeleteCoupon = async (couponCode: string) => {
    if (window.confirm(`Are you sure you want to delete the coupon "${couponCode}"?`)) {
        const updatedCoupons = await api.deleteCoupon(couponCode);
        setCoupons(updatedCoupons);
        logActivity(`Deleted coupon: "${couponCode}".`);
        addNotification({
            title: 'Coupon Deleted',
            description: `Coupon code "${couponCode}" has been deleted.`,
            recipientRoles: ['Admin']
        });
    }
  };

  const handleAnalyzeDocument = async (doc: Doc) => {
    try {
        const result = await analyzeDocument(doc.name); // Pass dummy text for now
        setAnalyzedDocument(doc);
        setAnalysisResult(result);
        setIsAnalysisModalOpen(true);
    } catch (error) {
        alert("Failed to analyze document. Please check the console for details.");
    }
  };

  const handleApplyAnalysis = (analysisData: DocumentAnalysisResult) => {
      if (!editingContact || editingContact === 'new') return;

      const summary = Object.entries(analysisData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
      
      const analysisHeader = `\n\n--- AI Analysis of ${analyzedDocument?.name} (${new Date().toLocaleDateString()}) ---\n`;
      const contactToUpdate = { ...editingContact, notes: (editingContact.notes || '') + analysisHeader + summary };
      
      handleSaveContact(contactToUpdate); // This will save and update state
      
      logContactActivity(contactToUpdate.id, 'note', `AI analysis from ${analyzedDocument?.name} added to notes.`);
      setIsAnalysisModalOpen(false);
      setAnalysisResult(null);
      setAnalyzedDocument(null);
  };

  const handleGenerateEmailDraft = async (prompt: string, contact: Contact) => {
    setEmailTargetContact(contact);
    setIsEmailComposerOpen(true);
    setEmailDraft('Generating...');
    const draft = await draftEmail(prompt, contact.name);
    setEmailDraft(draft);
  };

  const handleUpdateChecklistItem = (contactId: number, itemId: number, completed: boolean) => {
    if (!currentUser?.permissions['Contacts']?.update) return;
    
    setContacts(prevContacts => {
        const contact = prevContacts.find(c => c.id === contactId);
        if (contact) {
            const item = contact?.checklist?.find(i => i.id === itemId);
            if (item) {
                if(completed) {
                    addNotification({
                        title: 'Checklist Item Completed',
                        description: `"${item.text}" completed for ${contact.name}.`,
                        linkTo: { type: 'contact', id: contactId },
                        recipientRoles: ['Admin', 'Employee']
                    });
                    logContactActivity(contactId, 'checklist', `Checklist item completed: "${item.text}".`);
                }
            }
        }
        
        const updatedContacts = prevContacts.map(c => {
            if (c.id === contactId && c.checklist) {
                const newChecklist = c.checklist.map(item =>
                    item.id === itemId ? { ...item, completed } : item
                );
                const updatedContact = { ...c, checklist: newChecklist };
                if (editingContact && editingContact !== 'new' && editingContact.id === contactId) {
                  setEditingContact(updatedContact);
                }
                api.saveContact(updatedContact, false);
                return updatedContact;
            }
            return c;
        });
        return updatedContacts;
    });
  };

  const handleSearchResultSelect = (result: { type: string; id: any }) => {
    setIsSearchOpen(false);
    setNotificationsOpen(false);

    if (result.type === 'app') {
        handleAppSelect(result.id);
    } else if (result.type === 'contact') {
        const selectedContact = contacts.find(c => c.id === result.id);
        if (selectedContact) {
            handleAppSelect('Contacts');
            handleContactSelect(selectedContact);
        }
    } else if (result.type === 'lead') {
        const selectedLead = leads.find(l => l.id === result.id);
        if (selectedLead) {
            handleAppSelect('CRM');
            handleLeadSelect(selectedLead);
        }
    }
  };
  
  const handleSaveVisitor = async (visitorData: { id?: number; name: string; company: string; host: string; cardNumber: string; }) => {
    if (!currentUser?.permissions['Reception']?.create && !visitorData.id) return;
    if (visitorData.id && !currentUser?.permissions['Reception']?.update) return;
    
    const updatedVisitors = await api.saveVisitor(visitorData);
    setVisitors(updatedVisitors);

    addNotification({
        title: visitorData.id ? 'Visitor Details Updated' : 'Visitor Checked In',
        description: visitorData.id ? `Details for ${visitorData.name} have been updated.` : `${visitorData.name} from ${visitorData.company} has checked in to see ${visitorData.host}.`,
        recipientRoles: ['Admin', 'Employee']
    });

    setIsNewVisitorModalOpen(false);
    setEditingVisitor(null);
  };

  const handleVisitorCheckOut = async (visitorId: number) => {
    if (!currentUser?.permissions['Reception']?.update) return;
    const { allVisitors, checkedOutVisitor } = await api.checkOutVisitor(visitorId);
    setVisitors(allVisitors);
    if(checkedOutVisitor) {
        addNotification({
          title: 'Visitor Checked Out',
          description: `${checkedOutVisitor.name} has checked out.`,
          recipientRoles: ['Admin', 'Employee']
        });
    }
  };

  const handleScheduleVisitor = async (name: string, company: string, host: string, scheduledCheckIn: string) => {
    if (!currentUser?.permissions['Reception']?.create) return;
    const updatedVisitors = await api.scheduleVisitor({ name, company, host, scheduledCheckIn });
    setVisitors(updatedVisitors);
    addNotification({
      title: 'Visitor Scheduled',
      description: `${name} from ${company} is scheduled to visit ${host} on ${new Date(scheduledCheckIn).toLocaleDateString()}.`,
      recipientRoles: ['Admin', 'Employee']
    });
    setIsNewAppointmentModalOpen(false);
  };

  const handleEditVisitor = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setIsNewVisitorModalOpen(true);
  };

  const handleCheckInScheduledVisitor = async (visitorId: number) => {
    if (!currentUser?.permissions['Reception']?.update) return;
    const { allVisitors, checkedInVisitor } = await api.checkInScheduledVisitor(visitorId);
    setVisitors(allVisitors);
// FIX: The variable 'checked' was used here but it was undefined. Changed to 'checkedInVisitor' which is returned from the API call and contains the visitor's data.
    if(checkedInVisitor) {
        addNotification({
          title: 'Visitor Arrived',
          description: `${checkedInVisitor.name} has arrived.`,
          recipientRoles: ['Admin', 'Employee']
        });
    }
  };
  
  const handleRecordPayment = async (transactionId: string) => {
      if (!currentUser?.permissions['Accounting']?.update) return;
      const { allTransactions, paidTransaction } = await api.recordPayment(transactionId);
      setTransactions(allTransactions);

      if (paidTransaction) {
          addNotification({
            title: 'Payment Recorded',
            description: `Payment for invoice ${paidTransaction.id} from ${paidTransaction.customerName} has been recorded.`,
            recipientRoles: ['Admin', 'Employee']
          });
          const newPaymentLog = await api.logPaymentActivity(`Payment received for invoice ${paidTransaction.id}.`, paidTransaction.amount, 'payment_received');
          setPaymentActivityLog(newPaymentLog);
      }
  };
  
  const handleSaveTask = async (task: Omit<TodoTask, 'id'>) => {
    if (!currentUser?.permissions['To-do']?.create) return;
    const allTasks = await api.saveTask(task);
    setTasks(allTasks);
  };

  const handleSaveEvent = async (event: Omit<CalendarEvent, 'id'> & { id?: number }) => {
    const isNew = !event.id;
    if (isNew && !currentUser?.permissions['Calendar']?.create) return;
    if (!isNew && !currentUser?.permissions['Calendar']?.update) return;

    const allEvents = await api.saveEvent(event);
    setRawEvents(allEvents);
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!currentUser?.permissions['Calendar']?.delete) return;
    const allEvents = await api.deleteEvent(eventId);
    setRawEvents(allEvents);
    setIsEventModalOpen(false);
  };

  const handleSaveLmsCourse = async (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => {
    const isNew = !('id' in courseData);
    if(isNew && !currentUser?.permissions?.['LMS']?.create) return;
    if(!isNew && !currentUser?.permissions?.['LMS']?.update) return;

    const allCourses = await api.saveLmsCourse(courseData, isNew);
    setLmsCourses(allCourses);
    setEditingCourse(null);
  };
  
  const handleDeleteLmsCourse = async (courseId: string) => {
    if (!currentUser?.permissions?.['LMS']?.delete) return;
    if (window.confirm('Are you sure you want to delete this course and all its content? This cannot be undone.')) {
        const allCourses = await api.deleteLmsCourse(courseId);
        setLmsCourses(allCourses);
    }
  };

  const handleCreateLmsModule = async (courseId: string, title: string) => {
    if (!currentUser?.permissions?.['LMS']?.create) return;
    const allCourses = await api.createLmsModule(courseId, title);
    setLmsCourses(allCourses);
  };
  
  const handleUpdateLmsModule = async (courseId: string, moduleId: string, title: string) => {
    if (!currentUser?.permissions?.['LMS']?.update) return;
    const allCourses = await api.updateLmsModule(courseId, moduleId, title);
    setLmsCourses(allCourses);
  };

  const handleDeleteLmsModule = async (courseId: string, moduleId: string) => {
    if (!currentUser?.permissions?.['LMS']?.delete) return;
     if (window.confirm('Are you sure you want to delete this module and all its lessons?')) {
        const allCourses = await api.deleteLmsModule(courseId, moduleId);
        setLmsCourses(allCourses);
     }
  };

  const handleSaveLmsLesson = async (courseId: string, moduleId: string, lessonData: LmsLesson | Omit<LmsLesson, 'id'>) => {
      const isNew = !('id' in lessonData);
      if(isNew && !currentUser?.permissions?.['LMS']?.create) return;
      if(!isNew && !currentUser?.permissions?.['LMS']?.update) return;
      
      const allCourses = await api.saveLmsLesson(courseId, moduleId, lessonData, isNew);
      setLmsCourses(allCourses);
      setEditingLessonInfo(null);
  };
  
  const handleDeleteLmsLesson = async (courseId: string, lessonId: string) => {
      if (!currentUser?.permissions?.['LMS']?.delete) return;
      if (window.confirm('Are you sure you want to delete this lesson?')) {
        const allCourses = await api.deleteLmsLesson(courseId, lessonId);
        setLmsCourses(allCourses);
      }
  };
  
  const handleAddSessionVideo = async (contactId: number, videoBlob: Blob) => {
    const newSession: RecordedSession = { id: Date.now(), timestamp: new Date().toISOString() };
    try {
        await saveVideo(newSession.id, videoBlob);
        setContacts(prev => prev.map(c => {
            if (c.id === contactId) {
                const updatedContact = { ...c, recordedSessions: [...(c.recordedSessions || []), newSession] };
                api.saveContact(updatedContact, false);
                return updatedContact;
            }
            return c;
        }));
        logContactActivity(contactId, 'video_add', `Added a new recorded session.`);
    } catch(err) {
        console.error("Failed to save video to DB", err);
    }
  };

  const handleDeleteSessionVideo = async (contactId: number, sessionId: number) => {
    try {
        await deleteVideo(sessionId);
        setContacts(prev => prev.map(c => {
            if (c.id === contactId) {
                const updatedContact = { ...c, recordedSessions: (c.recordedSessions || []).filter(s => s.id !== sessionId) };
                api.saveContact(updatedContact, false);
                return updatedContact;
            }
            return c;
        }));
         logContactActivity(contactId, 'video_remove', `Removed a recorded session.`);
    } catch(err) {
        console.error("Failed to delete video from DB", err);
    }
  };

  const handleMarkLessonComplete = (courseId: string, lessonId: string) => {
      if (!currentUser || currentUser.role !== 'Student') return;
      const studentContact = contacts.find(c => c.userId === currentUser.id);
      if (!studentContact) return;

      setContacts(prev => prev.map(c => {
        if (c.id === studentContact.id) {
            const progress = c.lmsProgress || {};
            const courseProgress = progress[courseId] || { completedLessons: [] };
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);
            }
            const updatedProgress = { ...progress, [courseId]: courseProgress };
            const updatedContact = { ...c, lmsProgress: updatedProgress };
            api.saveContact(updatedContact, false);
            return updatedContact;
        }
        return c;
      }));
  };
  
  const handleSaveLmsNote = (lessonId: string, note: string) => {
    if (!currentUser || currentUser.role !== 'Student') return;
    const studentContact = contacts.find(c => c.userId === currentUser.id);
    if (!studentContact) return;
    
    setContacts(prev => prev.map(c => {
        if (c.id === studentContact.id) {
            const notes = { ...(c.lmsNotes || {}), [lessonId]: note };
            const updatedContact = { ...c, lmsNotes: notes };
            api.saveContact(updatedContact, false); // fire-and-forget
            return updatedContact;
        }
        return c;
    }));
  };
  
  const handleLmsPurchaseSuccess = (courseId: string) => {
    if (!currentUser || currentUser.role !== 'Student') return;
    const studentContact = contacts.find(c => c.userId === currentUser.id);
    if (!studentContact) return;
    
    setContacts(prev => prev.map(c => {
        if (c.id === studentContact.id) {
            const progress = c.lmsProgress || {};
            if (!progress[courseId]) {
                progress[courseId] = { completedLessons: [] };
            }
            const updatedContact = { ...c, lmsProgress: progress };
            api.saveContact(updatedContact, false); // persist enrollment
            return updatedContact;
        }
        return c;
    }));

    setCourseToPurchase(null);
    setActiveApp('LMS');
    const course = lmsCourses.find(c => c.id === courseId);
    if (course) {
        setActiveCourse(course);
    }
  };
  
  const handleSaveDiscussionPost = async (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => {
    const updatedCourses = await api.saveDiscussionPost(courseId, threadId, postContent);
    setLmsCourses(updatedCourses);
  };
  
  const handleCreateGroupChannel = async (name: string, memberIds: number[]) => {
      const allChannels = await api.createGroupChannel(name, memberIds);
      setChannels(allChannels);
  };

  if (isLoading) {
    return <Loader />;
  }
  
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} onRegister={handleRegisterStudent} />;
  }

  if (currentUser.mustResetPassword && storedCurrentUser) {
    return <ResetPasswordView user={storedCurrentUser} onReset={handlePasswordReset} />;
  }

  return (
    <div className={`flex h-screen bg-lyceum-light dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        {impersonatingUser && <ImpersonationBanner userName={impersonatingUser.name} onStop={handleStopImpersonation} />}
        
        {currentUser.role !== 'Student' && (
            <Sidebar 
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                activeApp={activeApp}
                onAppSelect={handleAppSelect}
                isMobile={isMobile}
                user={currentUser}
                onLogout={handleLogout}
            />
        )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen} 
            activeApp={activeApp}
            onAppSelect={handleAppSelect}
            onSearchClick={() => setIsSearchOpen(true)}
            onQuickCreateClick={() => setIsQuickCreateOpen(true)}
            user={currentUser}
            onLogout={handleLogout}
            notifications={filteredNotifications}
            onMarkAllNotificationsAsRead={markAllAsRead}
            onNotificationClick={handleSearchResultSelect}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 ${impersonatingUser ? 'pt-12' : ''}`}>
           {activeApp === 'Dashboard' && <Dashboard onNavigateBack={() => setActiveApp('Apps')} transactions={transactions} user={currentUser} tasks={tasks} onAppSelect={handleAppSelect} paymentActivityLog={paymentActivityLog} contacts={contacts} leads={leads} />}
           {activeApp === 'Apps' && <AppsGridView onAppSelect={handleAppSelect} user={currentUser} />}
           {activeApp === 'Discuss' && <DiscussView user={currentUser} users={users} isMobile={isMobile} channels={channels} setChannels={setChannels} onCreateGroup={handleCreateGroupChannel} />}
           {activeApp === 'Contacts' && (
                editingContact ? 
                (contactViewMode === 'documents' && typeof editingContact !== 'string' ? <ContactDocumentsView contact={editingContact} onNavigateBack={() => setContactViewMode('details')} onAnalyze={handleAnalyzeDocument} /> 
                : contactViewMode === 'visaFiling' && typeof editingContact !== 'string' ? <ContactVisaView contact={editingContact} onNavigateBack={() => setContactViewMode('details')} onSave={handleSaveContact} user={currentUser}/> 
                : contactViewMode === 'checklist' && typeof editingContact !== 'string' ? <ContactChecklistView contact={editingContact} user={currentUser} onNavigateBack={() => setContactViewMode('details')} onUpdateChecklistItem={handleUpdateChecklistItem}/>
                : <NewContactForm contact={editingContact === 'new' ? undefined : editingContact} contacts={contacts} onNavigateBack={handleBackToContacts} onNavigateToDocuments={() => setContactViewMode('documents')} onNavigateToVisa={() => setContactViewMode('visaFiling')} onNavigateToChecklist={() => setContactViewMode('checklist')} onSave={handleSaveContact} onComposeAIEmail={handleGenerateEmailDraft} user={currentUser} onAddSessionVideo={handleAddSessionVideo} onDeleteSessionVideo={handleDeleteSessionVideo}/>) 
                : <ContactsView contacts={contacts} onNewContactClick={handleNewContactClick} onContactSelect={handleContactSelect} user={currentUser} />
           )}
           {activeApp === 'Calendar' && <CalendarView events={events} onNewEvent={(date) => {setSelectedEventInfo({ date }); setIsEventModalOpen(true); }} onSelectEvent={(event) => {setSelectedEventInfo({ event }); setIsEventModalOpen(true); }} />}
           {activeApp === 'To-do' && <TodoView tasks={tasks} onSaveTask={handleSaveTask} />}
           {activeApp === 'CRM' && (
                leadForQuotation ? <NewQuotationPage lead={leadForQuotation} quotationToEdit={editingQuotation} templates={quotationTemplates} onCancel={handleCancelQuotation} onSave={handleSaveQuotation} user={currentUser} onSaveTemplate={handleSaveQuotationTemplate} onDeleteTemplate={handleDeleteQuotationTemplate} /> 
                : <CrmView leads={leads} onLeadSelect={handleLeadSelect} onNewLeadClick={handleNewLeadClick} onUpdateLeadStage={handleUpdateLeadStage} user={currentUser} />
           )}
           {activeApp === 'Accounting' && <AccountingView transactions={transactions} onNewInvoiceClick={() => setIsNewInvoiceModalOpen(true)} user={currentUser} onRecordPayment={handleRecordPayment} />}
           {activeApp === 'Reception' && <ReceptionView visitors={visitors} onNewVisitorClick={() => setIsNewVisitorModalOpen(true)} onScheduleVisitorClick={() => setIsNewAppointmentModalOpen(true)} onCheckOut={handleVisitorCheckOut} onCheckInScheduled={handleCheckInScheduledVisitor} onEditVisitor={handleEditVisitor} user={currentUser} />}
           {activeApp === 'Profile' && (
                currentUser.role === 'Student' ? 
                <StudentProfileView student={contacts.find(c => c.userId === currentUser.id)!} user={currentUser} onNavigateBack={() => setActiveApp('StudentDashboard')} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} /> :
                <ProfileView onNavigateBack={() => setActiveApp('Apps')} user={currentUser} />
           )}
           {activeApp === 'Settings' && <SettingsView user={currentUser} onNavigateBack={() => setActiveApp('Apps')} quotationTemplates={quotationTemplates} onSaveTemplate={handleSaveQuotationTemplate} onDeleteTemplate={handleDeleteQuotationTemplate} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} darkMode={darkMode} setDarkMode={setDarkMode} coupons={coupons} onSaveCoupon={handleSaveCoupon} onDeleteCoupon={handleDeleteCoupon} courses={lmsCourses}/>}
           {activeApp === 'Access Control' && <AccessControlView users={users} activityLog={activityLog} onUpdateUserRole={handleUpdateUserRole} onUpdateUserPermissions={handleUpdateUserPermissions} onNavigateBack={() => setActiveApp('Apps')} currentUser={currentUser} onNewStaffClick={() => setIsNewStaffModalOpen(true)} onStartImpersonation={handleStartImpersonation} />}
           {activeApp === 'StudentDashboard' && <StudentDashboard student={contacts.find(c => c.userId === currentUser.id)} courses={lmsCourses} onAppSelect={handleAppSelect} />}
           {activeApp === 'LMS' && (
                courseToPurchase ? <PaymentGatewayView course={courseToPurchase} user={currentUser} coupons={coupons} onPaymentSuccess={() => handleLmsPurchaseSuccess(courseToPurchase.id)} onCancel={() => setCourseToPurchase(null)} /> :
                viewingCertificateForCourse ? <CertificateView course={viewingCertificateForCourse} student={contacts.find(c => c.userId === currentUser.id)!} onBack={() => setViewingCertificateForCourse(null)} /> :
                activeCourse && activeLesson ? <LmsPlayerView course={activeCourse} student={contacts.find(c => c.userId === currentUser.id)} user={currentUser} users={users} onBack={() => { setActiveLesson(null); setActiveCourse(null); }} onMarkComplete={handleMarkLessonComplete} onSaveNote={handleSaveLmsNote} onSavePost={handleSaveDiscussionPost} /> :
                activeCourse ? <CourseDetailView course={activeCourse} student={contacts.find(c => c.userId === currentUser.id)} user={currentUser} users={users} contacts={contacts} onSelectLesson={setActiveLesson} onBack={() => setActiveCourse(null)} onModuleCreate={handleCreateLmsModule} onModuleUpdate={handleUpdateLmsModule} onModuleDelete={handleDeleteLmsModule} onLessonCreate={(moduleId) => setEditingLessonInfo({ courseId: activeCourse.id, moduleId, lesson: 'new' })} onLessonUpdate={(lesson) => setEditingLessonInfo({ courseId: activeCourse.id, moduleId: activeCourse.modules.find(m => m.lessons.some(l => l.id === lesson.id))!.id, lesson})} onLessonDelete={handleDeleteLmsLesson} onViewCertificate={setViewingCertificateForCourse} onInitiatePurchase={setCourseToPurchase} onSavePost={handleSaveDiscussionPost} /> :
                <LmsView courses={lmsCourses} onCourseSelect={setActiveCourse} user={currentUser} contacts={contacts} onNewCourse={() => setEditingCourse('new')} onEditCourse={setEditingCourse} onDeleteCourse={handleDeleteLmsCourse} onInitiatePurchase={setCourseToPurchase} />
           )}
            {activeApp === 'Sales' && <SalesView leads={leads} onLeadSelect={handleLeadSelect} />}
           {['Inventory', 'Manufacturing', 'Website', 'Point of Sale', 'Marketing'].includes(activeApp) && <AppView appName={activeApp} onNavigateBack={() => setActiveApp('Apps')} />}
        </main>

        {/* Modals */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} contacts={contacts} leads={leads} onResultSelect={handleSearchResultSelect} />
        <QuickCreateModal isOpen={isQuickCreateOpen} onClose={() => setIsQuickCreateOpen(false)} onSave={() => {}} />
        <NewInvoiceModal isOpen={isNewInvoiceModalOpen} onClose={() => setIsNewInvoiceModalOpen(false)} onSave={handleSaveInvoice} contacts={contacts} user={currentUser}/>
        {selectedLead && <LeadDetailsModal lead={selectedLead} onClose={handleCloseLeadDetails} onEdit={handleEditLeadClick} onNewQuotation={handleNewQuotationClick} onEditQuotation={handleEditQuotationClick} user={currentUser}/>}
        <NewLeadModal isOpen={isNewLeadModalOpen} onClose={() => { setIsNewLeadModalOpen(false); setEditingLead(null); }} onSave={handleSaveLead} lead={editingLead === 'new' ? null : editingLead} agents={[...new Set(users.filter(u => u.role !== 'Student').map(u => u.name))]} user={currentUser} />
        <NewStaffModal isOpen={isNewStaffModalOpen} onClose={() => setIsNewStaffModalOpen(false)} onSave={handleAddNewUser} user={currentUser} />
        {analyzedDocument && <DocumentAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} onApply={handleApplyAnalysis} result={analysisResult} documentName={analyzedDocument.name} />}
        {emailTargetContact && <AIEmailComposerModal isOpen={isEmailComposerOpen} onClose={() => setIsEmailComposerOpen(false)} onGenerate={(prompt) => handleGenerateEmailDraft(prompt, emailTargetContact)} draft={emailDraft} contactName={emailTargetContact.name} />}
        <NewVisitorModal isOpen={isNewVisitorModalOpen} onClose={() => {setIsNewVisitorModalOpen(false); setEditingVisitor(null);}} onSave={handleSaveVisitor} staff={users.filter(u => u.role !== 'Student')} user={currentUser} visitorToEdit={editingVisitor} />
        <NewAppointmentModal isOpen={isNewAppointmentModalOpen} onClose={() => setIsNewAppointmentModalOpen(false)} onSave={handleScheduleVisitor} staff={users.filter(u => u.role !== 'Student')} user={currentUser} />
        <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} eventInfo={selectedEventInfo} user={currentUser} />
        {editingCourse && <CourseEditModal course={editingCourse === 'new' ? null : editingCourse} onClose={() => setEditingCourse(null)} onSave={handleSaveLmsCourse} />}
        {editingLessonInfo && <LessonEditModal lesson={editingLessonInfo.lesson === 'new' ? null : editingLessonInfo.lesson} onClose={() => setEditingLessonInfo(null)} onSave={(lesson) => handleSaveLmsLesson(editingLessonInfo.courseId, editingLessonInfo.moduleId, lesson)} />}
      </div>
    </div>
  );
}

export default App;
