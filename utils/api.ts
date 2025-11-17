import type { CalendarEvent, Contact, CrmLead, AccountingTransaction, CrmStage, Quotation, User, UserRole, AppPermissions, ActivityLog, QuotationTemplate, Visitor, TodoTask, PaymentActivityLog, LmsCourse, LmsLesson, LmsModule, Coupon, Channel, Notification } from '../types';
import { DEFAULT_PERMISSIONS } from '../components/constants';

// --- API Client Setup ---

// Use an environment variable for the production API URL, falling back to a relative path for same-origin deployments.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api'; 

const getToken = (): string | null => {
    try {
        return window.localStorage.getItem('authToken');
    } catch (error) {
        console.error('Could not access localStorage:', error);
        return null;
    }
};

// Centralized fetch function to handle auth headers and error handling
export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.body && !(options.body instanceof FormData)) {
         headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Response was not JSON or empty
        }
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) { // Handle No Content responses
        return Promise.resolve(null as unknown as T);
    }

    return response.json();
};


// --- Authentication API ---
export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
    // We use fetch directly here because apiFetch would try to add a token we don't have yet.
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid email or password.' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

export const registerStudent = async (name: string, email: string, password: string): Promise<{user: User, contact: Contact, token: string}> => {
     // No auth token needed for registration
     const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
     });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed.' }));
        throw new Error(errorData.message);
    }
    return response.json();
};


// --- DATA GETTERS ---
export const getUsers = (): Promise<User[]> => apiFetch('/data/users');
export const getActivityLog = (): Promise<ActivityLog[]> => apiFetch('/data/logs/activity');
export const getPaymentActivityLog = (): Promise<PaymentActivityLog[]> => apiFetch('/data/logs/payment');
export const getContacts = (): Promise<Contact[]> => apiFetch('/data/contacts');
export const getTransactions = (): Promise<AccountingTransaction[]> => apiFetch('/data/accounting/transactions');
export const getLeads = (): Promise<CrmLead[]> => apiFetch('/data/crm/leads');
export const getQuotationTemplates = (): Promise<QuotationTemplate[]> => apiFetch('/data/crm/quotation-templates');
export const getVisitors = (): Promise<Visitor[]> => apiFetch('/data/reception/visitors');
export const getTasks = (): Promise<TodoTask[]> => apiFetch('/data/tasks');
export const getEvents = (): Promise<CalendarEvent[]> => apiFetch('/data/calendar/events');
export const getChannels = (): Promise<Channel[]> => apiFetch('/data/discuss/channels');
export const getCoupons = (): Promise<Coupon[]> => apiFetch('/data/lms/coupons');
export const getLmsCourses = (): Promise<LmsCourse[]> => apiFetch('/data/lms/courses');
export const getNotifications = (): Promise<Notification[]> => apiFetch('/data/notifications');


// --- DATA SAVERS / MUTATIONS ---

export const logActivity = (action: string): Promise<ActivityLog[]> => apiFetch('/data/logs/activity', { method: 'POST', body: JSON.stringify({ action }) });

export const logPaymentActivity = (text: string, amount: number, type: 'invoice_created' | 'payment_received'): Promise<PaymentActivityLog[]> => apiFetch('/data/logs/payment', { method: 'POST', body: JSON.stringify({ text, amount, type }) });

export const saveUser = (userToSave: User): Promise<User> => apiFetch(`/users/${userToSave.id}`, { method: 'PUT', body: JSON.stringify(userToSave) });

export const saveContact = (contactToSave: Contact, isNew: boolean): Promise<Contact> => {
    if (isNew) {
        return apiFetch('/data/contacts', { method: 'POST', body: JSON.stringify(contactToSave) });
    }
    return apiFetch(`/data/contacts/${contactToSave.id}`, { method: 'PUT', body: JSON.stringify(contactToSave) });
};

export const saveLead = (leadToSave: Omit<CrmLead, 'id' | 'stage'> & {id?:number}, isNew: boolean): Promise<CrmLead> => {
    if (isNew) {
        return apiFetch('/data/crm/leads', { method: 'POST', body: JSON.stringify(leadToSave) });
    }
    return apiFetch(`/data/crm/leads/${leadToSave.id}`, { method: 'PUT', body: JSON.stringify(leadToSave) });
};

export const updateLeadStage = (leadId: number, newStage: CrmStage): Promise<CrmLead[]> => apiFetch(`/data/crm/leads/${leadId}/stage`, { method: 'PUT', body: JSON.stringify({ stage: newStage }) });

export const saveQuotation = (leadId: number, quotationData: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation): Promise<CrmLead[]> => {
    const isEditing = 'id' in quotationData;
    if (isEditing) {
        return apiFetch(`/data/crm/leads/${leadId}/quotations/${quotationData.id}`, { method: 'PUT', body: JSON.stringify(quotationData) });
    }
    return apiFetch(`/data/crm/leads/${leadId}/quotations`, { method: 'POST', body: JSON.stringify(quotationData) });
};

export const saveEvents = (events: CalendarEvent[]): Promise<CalendarEvent[]> => apiFetch('/data/calendar/events/batch', { method: 'POST', body: JSON.stringify(events) });

export const saveChannels = (channels: Channel[]): Promise<Channel[]> => apiFetch('/data/discuss/channels', { method: 'PUT', body: JSON.stringify(channels) });

export const saveEvent = (eventData: Omit<CalendarEvent, 'id'> & { id?: number }): Promise<CalendarEvent[]> => {
    if (eventData.id) {
        return apiFetch(`/data/calendar/events/${eventData.id}`, { method: 'PUT', body: JSON.stringify(eventData) });
    }
    return apiFetch('/data/calendar/events', { method: 'POST', body: JSON.stringify(eventData) });
};

export const deleteEvent = (eventId: number): Promise<CalendarEvent[]> => apiFetch(`/data/calendar/events/${eventId}`, { method: 'DELETE' });

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification[]> => apiFetch('/data/notifications', { method: 'POST', body: JSON.stringify(notification) });

export const markAllNotificationsAsRead = (): Promise<Notification[]> => apiFetch('/data/notifications/mark-all-read', { method: 'POST' });

export const saveInvoice = (newInvoice: Omit<AccountingTransaction, 'id'>): Promise<{ transaction: AccountingTransaction, allTransactions: AccountingTransaction[] }> => apiFetch('/data/accounting/invoices', { method: 'POST', body: JSON.stringify(newInvoice) });

export const updateUserRole = (userId: number, role: UserRole): Promise<User[]> => apiFetch(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });

export const updateUserPermissions = (userId: number, permissions: { [key: string]: AppPermissions }): Promise<User[]> => apiFetch(`/users/${userId}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) });

export const addUser = (newUser: Omit<User, 'id' | 'permissions'>): Promise<{ allUsers: User[], addedUser: User }> => apiFetch('/users', { method: 'POST', body: JSON.stringify(newUser) });

export const setInitialPassword = (newPassword: string): Promise<{ updatedUser: User }> => apiFetch(`/users/set-initial-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });

export const changePassword = (userId: number, current: string, newPass: string): Promise<{ updatedUser: User }> => apiFetch(`/users/${userId}/change-password`, { method: 'POST', body: JSON.stringify({ current, newPass }) });

export const saveQuotationTemplate = (template: QuotationTemplate, isNew: boolean): Promise<QuotationTemplate[]> => {
    if (isNew) {
        return apiFetch('/data/crm/quotation-templates', { method: 'POST', body: JSON.stringify(template) });
    }
    return apiFetch(`/data/crm/quotation-templates/${template.id}`, { method: 'PUT', body: JSON.stringify(template) });
};

export const deleteQuotationTemplate = (templateId: number): Promise<QuotationTemplate[]> => apiFetch(`/data/crm/quotation-templates/${templateId}`, { method: 'DELETE' });

export const saveCoupon = (coupon: Coupon): Promise<Coupon[]> => apiFetch('/data/lms/coupons', { method: 'POST', body: JSON.stringify(coupon) });

export const deleteCoupon = (code: string): Promise<Coupon[]> => apiFetch(`/data/lms/coupons/${code}`, { method: 'DELETE' });

export const saveVisitor = (data: {id?:number} & any): Promise<Visitor[]> => {
    if(data.id) {
        return apiFetch(`/data/reception/visitors/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    return apiFetch('/data/reception/visitors/check-in', { method: 'POST', body: JSON.stringify(data) });
};

export const checkOutVisitor = (id: number): Promise<{allVisitors: Visitor[], checkedOutVisitor?: Visitor}> => apiFetch(`/data/reception/visitors/${id}/checkout`, { method: 'POST' });

export const scheduleVisitor = (data: any): Promise<Visitor[]> => apiFetch('/data/reception/visitors/schedule', { method: 'POST', body: JSON.stringify(data) });

export const checkInScheduledVisitor = (id: number): Promise<{allVisitors: Visitor[], checkedInVisitor?: Visitor}> => apiFetch(`/data/reception/visitors/${id}/check-in`, { method: 'POST' });

export const recordPayment = (id: string): Promise<{allTransactions: AccountingTransaction[], paidTransaction?: AccountingTransaction}> => apiFetch(`/data/accounting/invoices/${id}/record-payment`, { method: 'POST' });

export const saveTask = (task: Omit<TodoTask, 'id'>): Promise<TodoTask[]> => apiFetch('/data/tasks', { method: 'POST', body: JSON.stringify(task) });

export const saveDiscussionPost = (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/discussions/${threadId}`, { method: 'POST', body: JSON.stringify(postContent) });

export const saveLmsCourse = (courseData: any, isNew: boolean): Promise<LmsCourse[]> => {
    if(isNew) {
        return apiFetch('/data/lms/courses', { method: 'POST', body: JSON.stringify(courseData) });
    }
    return apiFetch(`/data/lms/courses/${courseData.id}`, { method: 'PUT', body: JSON.stringify(courseData) });
};

export const deleteLmsCourse = (id: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${id}`, { method: 'DELETE' });

export const createLmsModule = (courseId: string, title: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify({ title }) });

export const updateLmsModule = (courseId: string, moduleId: string, title: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify({ title }) });

export const deleteLmsModule = (courseId: string, moduleId: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });

export const saveLmsLesson = (courseId: string, moduleId: string, lessonData: any, isNew: boolean): Promise<LmsCourse[]> => {
    if (isNew) {
        return apiFetch(`/data/lms/courses/${courseId}/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(lessonData) });
    }
    return apiFetch(`/data/lms/courses/${courseId}/lessons/${lessonData.id}`, { method: 'PUT', body: JSON.stringify(lessonData) });
};

export const deleteLmsLesson = (courseId: string, lessonId: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' });

export const updateLessonVideo = (courseId: string, lessonId: string, videoUrl: string): Promise<LmsCourse[]> => apiFetch(`/data/lms/courses/${courseId}/lessons/${lessonId}/video`, { method: 'PUT', body: JSON.stringify({ videoUrl }) });

export const createGroupChannel = (name: string, memberIds: number[]): Promise<Channel[]> => apiFetch('/data/discuss/channels/group', { method: 'POST', body: JSON.stringify({ name, memberIds }) });