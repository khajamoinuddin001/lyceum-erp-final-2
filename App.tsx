

import React, { useEffect, useMemo, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Loader from './components/Loader';
import PageLoader from './components/PageLoader';
import SearchModal from './components/SearchModal';
import QuickCreateModal from './components/QuickCreateModal';
import LeadDetailsModal from './components/LeadDetailsModal';
import NewInvoiceModal from './components/NewInvoiceModal';
import NewLeadModal from './components/NewLeadModal';
import LoginView from './components/LoginView';
import NewStaffModal from './components/NewStaffModal';
import ImpersonationBanner from './components/ImpersonationBanner';
import DocumentAnalysisModal from './components/DocumentAnalysisModal';
import AIEmailComposerModal from './components/AIEmailComposerModal';
import NewVisitorModal from './components/NewVisitorModal';
import NewAppointmentModal from './components/NewAppointmentModal';
import EventModal from './components/EventModal';
import { useData } from './hooks/useData';
import { DocumentAnalysisResult, LmsCourse } from './types';

const AppsGridView = lazy(() => import('./components/AppsGridView'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const DiscussView = lazy(() => import('./components/DiscussView'));
const AppView = lazy(() => import('./components/AppView'));
const TodoView = lazy(() => import('./hooks/TodoView'));
const ContactsView = lazy(() => import('./components/ContactsView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const StudentProfileView = lazy(() => import('./components/StudentProfileView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const CrmView = lazy(() => import('./components/CrmView'));
const AccountingView = lazy(() => import('./components/AccountingView'));
const ReceptionView = lazy(() => import('./components/ReceptionView'));
const ContactDocumentsView = lazy(() => import('./components/ContactDocumentsView'));
const ContactVisaView = lazy(() => import('./components/ContactVisaView'));
const ContactChecklistView = lazy(() => import('./components/ContactChecklistView'));
const NewQuotationPage = lazy(() => import('./components/NewQuotationPage'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AccessControlView = lazy(() => import('./components/AccessControlView'));
const ResetPasswordView = lazy(() => import('./components/ResetPasswordView'));
const LmsView = lazy(() => import('./components/LmsView'));
const CourseDetailView = lazy(() => import('./components/CourseDetailView'));
const CertificateView = lazy(() => import('./components/CertificateView'));
const PaymentGatewayView = lazy(() => import('./components/PaymentGatewayView'));
const LmsPlayerView = lazy(() => import('./components/LmsPlayerView'));
const SalesView = lazy(() => import('./components/SalesView'));
const LazyNewContactForm = lazy(() => import('./components/NewContactForm').then(module => ({ default: module.NewContactForm })));
const LazyCourseEditModal = lazy(() => import('./components/CourseEditModal').then(module => ({ default: module.CourseEditModal })));
const LazyLessonEditModal = lazy(() => import('./components/LessonEditModal'));


const App: React.FC = () => {
  const {
    state,
    // Actions
    setSidebarOpen,
    handleLogin,
    handleRegisterStudent,
    handlePasswordReset,
    handleStopImpersonation,
    handleSave,
    handleAnalyzeDocument,
    saveContact,
    handleUpdateChecklistItem,
    saveQuotation,
    saveQuotationTemplate,
    deleteQuotationTemplate,
    handleUpdateUserRole,
    handleUpdateUserPermissions,
    handleStartImpersonation,
    handleAppSelect,
    handlePaymentSuccess,
    handleMarkLessonComplete,
    handleSaveLmsNote,
    saveDiscussionPost,
    createLmsModule,
    updateLmsModule,
    deleteLmsModule,
    createLmsLesson,
    updateLmsLesson,
    deleteLmsLesson,
    deleteLmsCourse,
    saveTask,
    saveLead,
    saveInvoice,
    addNewStaff,
    generateEmailDraft,
    saveVisitor,
    scheduleNewVisitor,
    visitorCheckOut, 
    checkInScheduledVisitor,
    editVisitor,
    saveEvent,
    deleteEvent,
    saveLmsCourse,
    saveLmsLesson,
    handleLogout,
    markAllNotificationsAsRead,
    handleSearchResultSelect,
    setDarkMode,
  } = useData();

  const {
    isLoading,
    isMobile,
    currentUser,
    storedCurrentUser,
    impersonatingUser,
    sidebarOpen,
    activeApp,
    isSearchOpen,
    isQuickCreateOpen,
    isNewInvoiceModalOpen,
    selectedLead,
    editingContact,
    contactViewMode,
    leadForQuotation,
    isNewLeadModalOpen,
    isNewStaffModalOpen,
    isAnalysisModalOpen,
    isEmailComposerOpen,
    isNewVisitorModalOpen,
    isNewAppointmentModalOpen,
    isEventModalOpen,
    activeCourse,
    activeLesson,
    editingCourse,
    editingLessonInfo,
    viewingCertificateForCourse,
    courseToPurchase,
    darkMode
  } = state;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      handleSave('isMobile', mobile);
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
  }, [setSidebarOpen, handleSave]);

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

  const studentContact = useMemo(() => {
    if (!currentUser || currentUser.role !== 'Student') return undefined;
    return state.contacts.find(c => c.userId === currentUser.id);
  }, [currentUser, state.contacts]);

  const handleQuickCreateSave = (type: string, data: any) => {
    if (type === 'todo') {
        saveTask({ title: data.summary, description: data.details, dueDate: new Date().toISOString().split('T')[0], status: 'todo' });
    } else if (type === 'contact') {
        saveContact({ name: data.name, email: data.email, phone: data.phone } as any, true);
    } else if (type === 'lead') {
        saveLead({ title: `${data.company} Opportunity`, company: data.company, contact: data.contact, value: data.value }, true);
    }
  };

  const handleApplyAnalysis = (result: DocumentAnalysisResult) => {
    if (editingContact && typeof editingContact !== 'string') {
        const currentNotes = editingContact.notes || '';
        const analysisText = Object.entries(result)
            .map(([key, value]) => `${key}:\n${Array.isArray(value) ? value.join('\n- ') : value}`)
            .join('\n\n');
        const newNotes = `${currentNotes}\n\n--- AI Analysis ---\n${analysisText}`;
        saveContact({ ...editingContact, notes: newNotes }, false);
    }
    handleSave('isAnalysisModalOpen', false);
    handleSave('analysisResult', null);
  };

  const uniqueAgents = useMemo(() => Array.from(new Set(state.users.filter(u => u.role !== 'Student').map(u => u.name))), [state.users]);
  const staffUsers = useMemo(() => state.users.filter(u => u.role === 'Admin' || u.role === 'Employee'), [state.users]);

  const handleSaveLmsCourse = (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => {
      saveLmsCourse(courseData);
  };

  if (isLoading) {
    return <Loader />;
  }
  
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} onRegister={handleRegisterStudent} />;
  }

  if (currentUser.mustResetPassword && storedCurrentUser) {
    return <Suspense fallback={<Loader />}><ResetPasswordView user={storedCurrentUser} onReset={handlePasswordReset} /></Suspense>;
  }

  return (
    <div className={`flex h-screen bg-lyceum-light dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        {impersonatingUser && <ImpersonationBanner userName={impersonatingUser.name} onStop={handleStopImpersonation} />}
        
        {currentUser.role !== 'Student' && (
            <Sidebar />
        )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 ${impersonatingUser ? 'pt-12' : ''}`}>
            <Suspense fallback={<PageLoader />}>
                {activeApp === 'Dashboard' && <Dashboard />}
                {activeApp === 'Apps' && <AppsGridView />}
                {activeApp === 'Discuss' && <DiscussView />}
                {activeApp === 'Contacts' && (
                        editingContact ? 
                        (contactViewMode === 'documents' && typeof editingContact !== 'string' ? <ContactDocumentsView contact={editingContact} onNavigateBack={() => handleSave('contactViewMode', 'details')} onAnalyze={handleAnalyzeDocument} /> 
                        : contactViewMode === 'visaFiling' && typeof editingContact !== 'string' ? <ContactVisaView contact={editingContact} onNavigateBack={() => handleSave('contactViewMode', 'details')} onSave={(contact) => saveContact(contact, false)} user={currentUser} /> 
                        : contactViewMode === 'checklist' && typeof editingContact !== 'string' ? <ContactChecklistView contact={editingContact} user={currentUser} onNavigateBack={() => handleSave('contactViewMode', 'details')} onUpdateChecklistItem={handleUpdateChecklistItem} />
                        : <LazyNewContactForm />) 
                        : <ContactsView />
                )}
                {activeApp === 'Calendar' && <CalendarView />}
                {activeApp === 'To-do' && <TodoView />}
                {activeApp === 'CRM' && (leadForQuotation ? <NewQuotationPage lead={leadForQuotation} onCancel={() => handleSave('leadForQuotation', null)} onSave={saveQuotation} user={currentUser} templates={state.quotationTemplates} quotationToEdit={state.editingQuotation} onSaveTemplate={saveQuotationTemplate} onDeleteTemplate={deleteQuotationTemplate} /> : <CrmView />)}
                {activeApp === 'Accounting' && <AccountingView />}
                {activeApp === 'Reception' && <ReceptionView />}
                {activeApp === 'Profile' && (
                        currentUser.role === 'Student' ? 
                        <StudentProfileView /> :
                        <ProfileView />
                )}
                {activeApp === 'Settings' && <SettingsView />}
                {activeApp === 'Access Control' && <AccessControlView users={state.users} activityLog={state.activityLog} onUpdateUserRole={handleUpdateUserRole} onUpdateUserPermissions={handleUpdateUserPermissions} onNavigateBack={() => handleSave('activeApp', 'Apps')} currentUser={currentUser} onNewStaffClick={() => handleSave('isNewStaffModalOpen', true)} onStartImpersonation={handleStartImpersonation} />}
                {activeApp === 'StudentDashboard' && <StudentDashboard student={studentContact} courses={state.lmsCourses} onAppSelect={handleAppSelect} events={state.events} />}
                {activeApp === 'LMS' && (
                        courseToPurchase ? <PaymentGatewayView course={courseToPurchase} user={currentUser} coupons={state.coupons} onPaymentSuccess={handlePaymentSuccess} onCancel={() => handleSave('courseToPurchase', null)} /> :
                        viewingCertificateForCourse && studentContact ? <CertificateView course={viewingCertificateForCourse} student={studentContact} onBack={() => handleSave('viewingCertificateForCourse', null)} /> :
                        activeCourse && activeLesson ? <LmsPlayerView course={activeCourse} student={studentContact} user={currentUser} users={state.users} onBack={() => { handleSave('activeCourse', null); handleSave('activeLesson', null); }} onMarkComplete={handleMarkLessonComplete} onSaveNote={handleSaveLmsNote} onSavePost={saveDiscussionPost} /> :
                        activeCourse ? <CourseDetailView course={activeCourse} student={studentContact} user={currentUser} users={state.users} contacts={state.contacts} onSelectLesson={(lesson) => handleSave('activeLesson', lesson)} onBack={() => handleSave('activeCourse', null)} onModuleCreate={createLmsModule} onModuleUpdate={updateLmsModule} onModuleDelete={deleteLmsModule} onLessonCreate={(moduleId) => handleSave('editingLessonInfo', { moduleId })} onLessonUpdate={(lesson) => handleSave('editingLessonInfo', { lesson })} onLessonDelete={deleteLmsLesson} onViewCertificate={(course) => handleSave('viewingCertificateForCourse', course)} onInitiatePurchase={(course) => handleSave('courseToPurchase', course)} onSavePost={saveDiscussionPost} /> :
                        <LmsView courses={state.lmsCourses} onCourseSelect={(course) => handleSave('activeCourse', course)} user={currentUser} contacts={state.contacts} onNewCourse={() => handleSave('editingCourse', 'new')} onEditCourse={(course) => handleSave('editingCourse', course)} onDeleteCourse={deleteLmsCourse} onInitiatePurchase={(course) => handleSave('courseToPurchase', course)} />
                )}
                {activeApp === 'Sales' && <SalesView leads={state.leads} onLeadSelect={(lead) => handleSave('selectedLead', lead)} />}
                {['Inventory', 'Manufacturing', 'Website', 'Point of Sale', 'Marketing'].includes(activeApp) && <AppView appName={activeApp} onNavigateBack={() => handleSave('activeApp', 'Apps')} />}
            </Suspense>
        </main>

        {/* Modals */}
        {isSearchOpen && <SearchModal />}
        {isQuickCreateOpen && <QuickCreateModal isOpen={isQuickCreateOpen} onClose={() => handleSave('isQuickCreateOpen', false)} onSave={handleQuickCreateSave} />}
        {isNewInvoiceModalOpen && <NewInvoiceModal isOpen={isNewInvoiceModalOpen} onClose={() => handleSave('isNewInvoiceModalOpen', false)} onSave={saveInvoice} contacts={state.contacts} user={currentUser} />}
        {selectedLead && <LeadDetailsModal lead={selectedLead} onClose={() => handleSave('selectedLead', null)} onEdit={(lead) => { handleSave('editingLead', lead); handleSave('isNewLeadModalOpen', true); }} onNewQuotation={(lead) => { handleSave('leadForQuotation', lead); handleSave('selectedLead', null); }} onEditQuotation={(lead, quotation) => { handleSave('leadForQuotation', lead); handleSave('editingQuotation', quotation); handleSave('selectedLead', null); }} user={currentUser} />}
        {isNewLeadModalOpen && <NewLeadModal isOpen={isNewLeadModalOpen} onClose={() => { handleSave('isNewLeadModalOpen', false); handleSave('editingLead', null); }} onSave={(lead) => saveLead(lead, !('id' in lead && lead.id))} lead={state.editingLead} agents={uniqueAgents} user={currentUser} />}
        {isNewStaffModalOpen && <NewStaffModal isOpen={isNewStaffModalOpen} onClose={() => handleSave('isNewStaffModalOpen', false)} onSave={addNewStaff} user={currentUser} />}
        {isAnalysisModalOpen && <DocumentAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => { handleSave('isAnalysisModalOpen', false); handleSave('analysisResult', null); }} onApply={handleApplyAnalysis} result={state.analysisResult} documentName={state.analyzingDocumentName || ''} />}
        {isEmailComposerOpen && <AIEmailComposerModal isOpen={isEmailComposerOpen} onClose={() => { handleSave('isEmailComposerOpen', false); handleSave('emailDraft', ''); }} onGenerate={prompt => generateEmailDraft(prompt, state.emailComposerContact?.name || '')} draft={state.emailDraft} contactName={state.emailComposerContact?.name || ''} />}
        {isNewVisitorModalOpen && <NewVisitorModal isOpen={isNewVisitorModalOpen} onClose={() => { handleSave('isNewVisitorModalOpen', false); handleSave('editingVisitor', null); }} onSave={saveVisitor} staff={staffUsers} user={currentUser} visitorToEdit={state.editingVisitor} />}
        {isNewAppointmentModalOpen && <NewAppointmentModal isOpen={isNewAppointmentModalOpen} onClose={() => handleSave('isNewAppointmentModalOpen', false)} onSave={scheduleNewVisitor} staff={staffUsers} user={currentUser} />}
        {isEventModalOpen && <EventModal isOpen={isEventModalOpen} onClose={() => { handleSave('isEventModalOpen', false); handleSave('selectedEventInfo', null); }} onSave={saveEvent} onDelete={deleteEvent} eventInfo={state.selectedEventInfo} user={currentUser} />}
        {editingCourse && <Suspense fallback={null}><LazyCourseEditModal course={editingCourse} onClose={() => handleSave('editingCourse', null)} onSave={handleSaveLmsCourse} /></Suspense>}
        {editingLessonInfo && <Suspense fallback={null}><LazyLessonEditModal lessonInfo={editingLessonInfo} onClose={() => handleSave('editingLessonInfo', null)} onSave={saveLmsLesson} /></Suspense>}
      </div>
    </div>
  );
}

export default App;