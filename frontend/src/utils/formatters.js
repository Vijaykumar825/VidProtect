/**
 * Formatters Utility
 * Functions for formatting dates, file sizes, and other display values
 */

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "5.2 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'Unknown';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date to locale string
 * @param {string|Date} dateString - Date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Unknown';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date with time
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return formatDate(dateString);
  } catch {
    return 'Unknown';
  }
};

/**
 * Format video duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1:23:45")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format sensitivity score as percentage
 * @param {number} score - Score between 0 and 1
 * @returns {string} Formatted percentage (e.g., "75%")
 */
export const formatSensitivityScore = (score) => {
  if (score === undefined || score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
};

/**
 * Format classification status with color indicator
 * @param {string} classification - 'safe' or 'flagged'
 * @returns {Object} { text, color }
 */
export const formatClassification = (classification) => {
  switch (classification) {
    case 'safe':
      return { text: 'Safe', color: '#22c55e' };
    case 'flagged':
      return { text: 'Flagged', color: '#ef4444' };
    default:
      return { text: 'Unknown', color: '#6b7280' };
  }
};

/**
 * Format processing status
 * @param {string} status - Video status
 * @returns {Object} { text, color }
 */
export const formatStatus = (status) => {
  switch (status) {
    case 'processing':
      return { text: 'Processing', color: '#f59e0b' };
    case 'completed':
      return { text: 'Completed', color: '#22c55e' };
    case 'failed':
      return { text: 'Failed', color: '#ef4444' };
    default:
      return { text: 'Unknown', color: '#6b7280' };
  }
};

/**
 * Format username for display
 * @param {string} username - Username
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Formatted username
 */
export const formatUsername = (username, maxLength = 20) => {
  if (!username) return 'Unknown';
  if (username.length <= maxLength) return username;
  return username.substring(0, maxLength - 3) + '...';
};

/**
 * Format role for display
 * @param {string} role - User role
 * @returns {string} Capitalized role
 */
export const formatRole = (role) => {
  if (!role) return 'Unknown';
  return role.charAt(0).toUpperCase() + role.slice(1);
};
