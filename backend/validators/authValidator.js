/**
 * Auth Validator
 * Input validation for authentication operations
 */

/**
 * Validate registration input
 * @param {Object} body - Request body
 * @returns {Object} { isValid, errors }
 */
const validateRegistration = (body) => {
  const errors = [];

  // Username validation
  if (!body.username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (body.username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  } else if (body.username.length > 30) {
    errors.push({ field: 'username', message: 'Username cannot exceed 30 characters' });
  } else if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
  }

  // Email validation
  if (!body.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(body.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Password validation
  if (!body.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePasswordStrength(body.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login input
 * @param {Object} body - Request body
 * @returns {Object} { isValid, errors }
 */
const validateLogin = (body) => {
  const errors = [];

  if (!body.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(body.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!body.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password string
 * @returns {Object} { isValid, errors }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password cannot exceed 128 characters' });
  }

  // Optional: Add more strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  // }
  // if (!/[0-9]/.test(password)) {
  //   errors.push({ field: 'password', message: 'Password must contain at least one number' });
  // }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate password update input
 * @param {Object} body - Request body
 * @returns {Object} { isValid, errors }
 */
const validatePasswordUpdate = (body) => {
  const errors = [];

  if (!body.currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }

  if (!body.newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else {
    const passwordValidation = validatePasswordStrength(body.newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors.map(e => ({
        ...e,
        field: 'newPassword'
      })));
    }
  }

  // Check that new password is different from current
  if (body.currentPassword && body.newPassword && body.currentPassword === body.newPassword) {
    errors.push({ field: 'newPassword', message: 'New password must be different from current password' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate role value
 * @param {string} role - User role
 * @returns {boolean} True if valid role
 */
const isValidRole = (role) => {
  const validRoles = ['viewer', 'editor', 'admin'];
  return validRoles.includes(role);
};

/**
 * Sanitize email input
 * @param {string} email - Email address
 * @returns {string} Sanitized email (lowercase, trimmed)
 */
const sanitizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : '';
};

/**
 * Sanitize username input
 * @param {string} username - Username
 * @returns {string} Sanitized username (trimmed)
 */
const sanitizeUsername = (username) => {
  return username ? username.trim() : '';
};

module.exports = {
  validateRegistration,
  validateLogin,
  isValidEmail,
  validatePasswordStrength,
  validatePasswordUpdate,
  isValidRole,
  sanitizeEmail,
  sanitizeUsername
};
