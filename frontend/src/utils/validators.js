/**
 * Validators Utility
 * Client-side form validation functions
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {Object} { isValid, message }
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate password
 * @param {string} password - Password
 * @returns {Object} { isValid, message }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate username
 * @param {string} username - Username
 * @returns {Object} { isValid, message }
 */
export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }

  if (username.length > 30) {
    return { isValid: false, message: 'Username cannot exceed 30 characters' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate video title
 * @param {string} title - Video title
 * @returns {Object} { isValid, message }
 */
export const validateVideoTitle = (title) => {
  if (!title) {
    return { isValid: false, message: 'Title is required' };
  }

  if (title.length < 3) {
    return { isValid: false, message: 'Title must be at least 3 characters' };
  }

  if (title.length > 200) {
    return { isValid: false, message: 'Title cannot exceed 200 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate video description
 * @param {string} description - Video description
 * @returns {Object} { isValid, message }
 */
export const validateVideoDescription = (description) => {
  if (description && description.length > 2000) {
    return { isValid: false, message: 'Description cannot exceed 2000 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate video file
 * @param {File} file - Video file object
 * @returns {Object} { isValid, message }
 */
export const validateVideoFile = (file) => {
  if (!file) {
    return { isValid: false, message: 'Please select a video file' };
  }

  const allowedTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Invalid file type. Allowed: MP4, MOV, AVI, MKV, WebM'
    };
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'File size exceeds 100MB limit'
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate registration form
 * @param {Object} data - Form data { username, email, password }
 * @returns {Object} { isValid, errors }
 */
export const validateRegistrationForm = (data) => {
  const errors = {};

  const usernameResult = validateUsername(data.username);
  if (!usernameResult.isValid) {
    errors.username = usernameResult.message;
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message;
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login form
 * @param {Object} data - Form data { email, password }
 * @returns {Object} { isValid, errors }
 */
export const validateLoginForm = (data) => {
  const errors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message;
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate video upload form
 * @param {Object} data - Form data { title, description, file }
 * @returns {Object} { isValid, errors }
 */
export const validateVideoUploadForm = (data) => {
  const errors = {};

  const titleResult = validateVideoTitle(data.title);
  if (!titleResult.isValid) {
    errors.title = titleResult.message;
  }

  const descriptionResult = validateVideoDescription(data.description);
  if (!descriptionResult.isValid) {
    errors.description = descriptionResult.message;
  }

  const fileResult = validateVideoFile(data.file);
  if (!fileResult.isValid) {
    errors.file = fileResult.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} True if there are errors
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error);
};
