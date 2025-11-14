import React, { useState } from 'react';
import type { User, UserRole, AppPermissions, ActivityLog } from '../types';
import { ArrowLeft, X, Eye } from './icons';
import { ODOO_APPS, STAFF_ROLES } from './constants';

interface ManageAppsModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: number, permissions: { [key: string]: AppPermissions }) => void;
}

const ToggleSwitch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ id, checked, onChange, label, disabled }) => (
  <label htmlFor={id} className={`flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
    <div className="relative">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-lyceum-blue"></div>
      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
    </div>
  </label>
);


const ManageAppsModal: React.FC<ManageAppsModalProps> = ({ user, onClose, onSave }) => {
    const [permissions, setPermissions] = useState<{ [key: string]: AppPermissions }>(user.permissions || {});

    const handlePermissionChange = (appName: string, action: keyof AppPermissions, value: boolean) => {
        const newPermissions = JSON.parse(JSON.stringify(permissions)); // Deep copy
        const appPerms = newPermissions[appName] || {};
        
        appPerms[action] = value;

        // If 'read' is unchecked, uncheck all others
        if (action === 'read' && !value) {
            delete appPerms.create;
            delete appPerms.update;
            delete appPerms.delete;
        }

        // If any other action is checked, 'read' must be checked
        if (action !== 'read' && value) {
            appPerms.read = true;
        }
        
        // If all are false, remove the app from permissions
        if (!appPerms.read && !appPerms.create && !appPerms.update && !appPerms.delete) {
            delete newPermissions[appName];
        } else {
            newPermissions[appName] = appPerms;
        }

        setPermissions(newPermissions);
    };

    const handleFullAccessChange = (appName: string, value: boolean) => {
        const newPermissions = { ...permissions };
        if (value) {
            newPermissions[appName] = { read: true, create: true, update: true, delete: true };
        } else {
            delete newPermissions[appName];
        }
        setPermissions(newPermissions);
    };

    const handleSave = () => {
        onSave(user.id, permissions);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl transform transition-all duration-200 ease-in-out flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Manage App Access for <span className="text-lyceum-blue">{user.name}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {ODOO_APPS.map((app) => {
                            const currentPerms = permissions[app.name] || {};
                            const hasFullAccess = !!(currentPerms.read && currentPerms.create && currentPerms.update && currentPerms.delete);
                            const hasRead = !!currentPerms.read;
                            const hasOtherPerms = !!(currentPerms.create || currentPerms.update || currentPerms.delete);

                            return (
                                <div key={app.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${app.bgColor} dark:bg-opacity-20 mr-3 flex-shrink-0`}>
                                                <span className={`${app.iconColor}`}>{React.cloneElement(app.icon, { size: 18 })}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{app.name}</span>
                                        </div>
                                        <ToggleSwitch
                                            id={`full-access-${app.name}`}
                                            checked={hasFullAccess}
                                            onChange={(checked) => handleFullAccessChange(app.name, checked)}
                                            label="Full Access"
                                        />
                                    </div>
                                    <div className="p-4 space-y-3 text-sm">
                                        <ToggleSwitch
                                            id={`read-${app.name}`}
                                            checked={hasRead}
                                            onChange={(checked) => handlePermissionChange(app.name, 'read', checked)}
                                            label="Read"
                                            disabled={hasOtherPerms}
                                        />
                                        <ToggleSwitch
                                            id={`create-${app.name}`}
                                            checked={!!currentPerms.create}
                                            onChange={(checked) => handlePermissionChange(app.name, 'create', checked)}
                                            label="Create"
                                            disabled={!hasRead}
                                        />
                                        <ToggleSwitch
                                            id={`update-${app.name}`}
                                            checked={!!currentPerms.update}
                                            onChange={(checked) => handlePermissionChange(app.name, 'update', checked)}
                                            label="Update"
                                            disabled={!hasRead}
                                        />
                                        <ToggleSwitch
                                            id={`delete-${app.name}`}
                                            checked={!!currentPerms.delete}
                                            onChange={(checked) => handlePermissionChange(app.name, 'delete', checked)}
                                            label="Delete"
                                            disabled={!hasRead}
                                        />
                                    </div>
                                </div>
                            );
                       })}
                   </div>
                </div>
                 <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium">
                        Save Permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AccessControlViewProps {
  users: User[];
  activityLog: ActivityLog[];
  onUpdateUserRole: (userId: number, role: UserRole) => void;
  onUpdateUserPermissions: (userId: number, permissions: { [key: string]: AppPermissions }) => void;
  onNavigateBack: () => void;
  currentUser: User;
  onNewStaffClick: () => void;
  onStartImpersonation: (user: User) => void;
}

const AccessControlView: React.FC<AccessControlViewProps> = ({ users, activityLog, onUpdateUserRole, onUpdateUserPermissions, onNavigateBack, currentUser, onNewStaffClick, onStartImpersonation }) => {
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('staff');

  const handleRoleChange = (userId: number, newRole: UserRole) => {
    onUpdateUserRole(userId, newRole);
  };

  const staffUsers = users.filter(u => STAFF_ROLES.includes(u.role));

  return (
    <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            <div>
                <button
                    onClick={onNavigateBack}
                    className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2 transition-colors"
                    aria-label="Back to apps"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Apps
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Access Control</h1>
            </div>
            {currentUser.permissions['Access Control']?.create && activeTab === 'staff' && (
                <button
                    onClick={onNewStaffClick}
                    className="w-full md:w-auto px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors"
                >
                    New Staff Member
                </button>
            )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-4">
            <button onClick={() => setActiveTab('staff')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'staff' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Staff Management
            </button>
            <button onClick={() => setActiveTab('log')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'log' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Activity Log
            </button>
        </nav>
      </div>
      
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">App Permissions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {staffUsers.map(user => (
                    <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={user.id === currentUser.id}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-lyceum-blue focus:border-lyceum-blue disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Role for ${user.name}`}
                        >
                        {STAFF_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                        </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <button
                            onClick={() => setModalUser(user)}
                            disabled={user.id === currentUser.id}
                            className="px-3 py-2 text-sm font-medium text-lyceum-blue bg-lyceum-blue/10 rounded-md hover:bg-lyceum-blue/20 dark:bg-lyceum-blue/20 dark:hover:bg-lyceum-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Manage ({Object.keys(user.permissions || {}).length} Apps)
                        </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <button
                          onClick={() => onStartImpersonation(user)}
                          disabled={user.id === currentUser.id}
                          className="flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/80 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Impersonate ${user.name}`}
                        >
                          <Eye size={16} className="mr-2" />
                          Impersonate
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      )}

      {activeTab === 'log' && (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="p-4">
                 <h3 className="text-lg font-semibold">Administrator Activity</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Recent administrative actions are logged here.</p>
             </div>
             <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                 {activityLog.map(log => (
                     <li key={log.id} className="p-4 flex items-center justify-between">
                         <div>
                             <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">by {log.adminName}</p>
                         </div>
                         <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                     </li>
                 ))}
             </ul>
         </div>
      )}


      {modalUser && (
        <ManageAppsModal 
            user={modalUser}
            onClose={() => setModalUser(null)}
            onSave={onUpdateUserPermissions}
        />
      )}

       <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AccessControlView;