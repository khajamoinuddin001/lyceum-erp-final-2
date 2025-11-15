// This file contains constants for the backend, decoupled from the frontend.

import { UserRole, AppPermissions } from './types';

const fullAccess: AppPermissions = { read: true, create: true, update: true, delete: true };
const readOnly: AppPermissions = { read: true };

// All possible app names, for iterating
const ALL_APPS = [
  'Dashboard', 'Contacts', 'LMS', 'CRM', 'Calendar', 'Discuss', 'Accounting',
  'Sales', 'Inventory', 'Manufacturing', 'Website', 'Point of Sale', 'Marketing',
  'To-do', 'Reception', 'Settings', 'Access Control'
];

const adminPermissions = ALL_APPS.reduce((acc, app) => {
    acc[app] = { ...fullAccess };
    return acc;
}, {} as { [appName: string]: AppPermissions });

const employeeFullAccessApps = new Set(['Contacts', 'CRM', 'Calendar', 'Discuss', 'To-do', 'Reception', 'Sales', 'Marketing', 'LMS']);
const employeeReadOnlyApps = new Set(['Dashboard', 'Accounting', 'Inventory', 'Manufacturing', 'Website', 'Point of Sale']);

const employeePermissions: { [appName: string]: AppPermissions } = ALL_APPS.reduce((acc, app) => {
    if (employeeFullAccessApps.has(app)) {
        acc[app] = { ...fullAccess };
    } else if (employeeReadOnlyApps.has(app)) {
        acc[app] = { ...readOnly };
    }
    return acc;
}, {} as { [appName: string]: AppPermissions });

export const DEFAULT_PERMISSIONS: Record<UserRole, { [appName: string]: AppPermissions }> = {
  'Admin': adminPermissions,
  'Employee': employeePermissions,
  'Student': {
    'LMS': readOnly,
    'StudentDashboard': readOnly,
    'Profile': readOnly,
  },
};
