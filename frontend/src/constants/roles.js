/**
 * Role Constants
 * User roles and permissions definitions
 */

/**
 * Available user roles
 */
export const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin'
};

/**
 * Role display names
 */
export const ROLE_LABELS = {
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.ADMIN]: 'Admin'
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS = {
  [ROLES.VIEWER]: 'Can view assigned videos only',
  [ROLES.EDITOR]: 'Can upload, edit, and delete own videos',
  [ROLES.ADMIN]: 'Full system access including user management'
};

/**
 * Available permissions
 */
export const PERMISSIONS = {
  VIEW_VIDEOS: 'view_videos',
  UPLOAD_VIDEOS: 'upload_videos',
  EDIT_VIDEOS: 'edit_videos',
  DELETE_VIDEOS: 'delete_videos',
  VIEW_ALL_VIDEOS: 'view_all_videos',
  MANAGE_USERS: 'manage_users',
  ACCESS_ADMIN: 'access_admin'
};

/**
 * Role-permission mapping
 */
export const ROLE_PERMISSIONS = {
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_VIDEOS
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.VIEW_VIDEOS,
    PERMISSIONS.UPLOAD_VIDEOS,
    PERMISSIONS.EDIT_VIDEOS,
    PERMISSIONS.DELETE_VIDEOS
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_VIDEOS,
    PERMISSIONS.UPLOAD_VIDEOS,
    PERMISSIONS.EDIT_VIDEOS,
    PERMISSIONS.DELETE_VIDEOS,
    PERMISSIONS.VIEW_ALL_VIDEOS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ACCESS_ADMIN
  ]
};

/**
 * Check if role has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Check if role can upload videos
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canUpload = (role) => {
  return hasPermission(role, PERMISSIONS.UPLOAD_VIDEOS);
};

/**
 * Check if role can edit videos
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canEdit = (role) => {
  return hasPermission(role, PERMISSIONS.EDIT_VIDEOS);
};

/**
 * Check if role can delete videos
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canDelete = (role) => {
  return hasPermission(role, PERMISSIONS.DELETE_VIDEOS);
};

/**
 * Check if role can manage users
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canManageUsers = (role) => {
  return hasPermission(role, PERMISSIONS.MANAGE_USERS);
};

/**
 * Check if role can access admin panel
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canAccessAdmin = (role) => {
  return hasPermission(role, PERMISSIONS.ACCESS_ADMIN);
};

/**
 * Get all roles for dropdown
 * @returns {Array} Array of { value, label } objects
 */
export const getRoleOptions = () => {
  return Object.values(ROLES).map(role => ({
    value: role,
    label: ROLE_LABELS[role]
  }));
};

/**
 * Role hierarchy (higher index = more permissions)
 */
export const ROLE_HIERARCHY = [ROLES.VIEWER, ROLES.EDITOR, ROLES.ADMIN];

/**
 * Check if role1 has higher or equal permissions than role2
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean}
 */
export const isRoleHigherOrEqual = (role1, role2) => {
  const index1 = ROLE_HIERARCHY.indexOf(role1);
  const index2 = ROLE_HIERARCHY.indexOf(role2);
  return index1 >= index2;
};

export default ROLES;
