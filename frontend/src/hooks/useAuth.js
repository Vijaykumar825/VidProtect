/**
 * useAuth Hook
 * Custom hook for accessing and managing authentication state
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication context
 * @returns {Object} Auth context values and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Check if user has specific role
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean} True if user has any of the specified roles
 */
export const useHasRole = (roles) => {
  const { user } = useAuth();

  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
};

/**
 * Check if user can perform specific action
 * @param {string} action - Action to check (upload, edit, delete, admin)
 * @returns {boolean} True if user can perform action
 */
export const useCanPerform = (action) => {
  const { user } = useAuth();

  if (!user) return false;

  const permissions = {
    viewer: ['view'],
    editor: ['view', 'upload', 'edit', 'delete'],
    admin: ['view', 'upload', 'edit', 'delete', 'admin', 'manage_users']
  };

  return permissions[user.role]?.includes(action) || false;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export const useIsAuthenticated = () => {
  const { user, token } = useAuth();
  return !!(user && token);
};

export default useAuth;
