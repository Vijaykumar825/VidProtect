/**
 * Video Validator
 * Input validation for video upload operations
 */

/**
 * Validate video upload input
 * @param {Object} body - Request body
 * @param {Object} file - Uploaded file
 * @returns {Object} { isValid, errors }
 */
const validateVideoUpload = (body, file) => {
  const errors = [];

  // Check file presence
  if (!file) {
    errors.push({ field: 'video', message: 'Video file is required' });
  }

  // Validate title
  if (!body.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (body.title.length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
  } else if (body.title.length > 200) {
    errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
  }

  // Validate description (optional but has max length)
  if (body.description && body.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters' });
  }

  // Validate file type if file exists
  if (file) {
    const allowedTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: 'video',
        message: 'Invalid file type. Allowed: MP4, MOV, AVI, MKV, WebM'
      });
    }

    // Check file size (100MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push({
        field: 'video',
        message: `File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate video update input
 * @param {Object} body - Request body
 * @returns {Object} { isValid, errors }
 */
const validateVideoUpdate = (body) => {
  const errors = [];

  // Title validation (if provided)
  if (body.title !== undefined) {
    if (body.title.length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else if (body.title.length > 200) {
      errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
    }
  }

  // Description validation (if provided)
  if (body.description !== undefined && body.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate video ID format
 * @param {string} id - Video ID
 * @returns {boolean} True if valid MongoDB ObjectId format
 */
const isValidVideoId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

/**
 * Validate video filter parameters
 * @param {Object} query - Query parameters
 * @returns {Object} { isValid, errors, sanitized }
 */
const validateVideoFilters = (query) => {
  const errors = [];
  const sanitized = {};

  // Status filter
  if (query.status) {
    const validStatuses = ['processing', 'completed', 'failed'];
    if (!validStatuses.includes(query.status)) {
      errors.push({ field: 'status', message: 'Invalid status value' });
    } else {
      sanitized.status = query.status;
    }
  }

  // Classification filter
  if (query.classification) {
    const validClassifications = ['safe', 'flagged'];
    if (!validClassifications.includes(query.classification)) {
      errors.push({ field: 'classification', message: 'Invalid classification value' });
    } else {
      sanitized.classification = query.classification;
    }
  }

  // Pagination
  sanitized.page = Math.max(1, parseInt(query.page) || 1);
  sanitized.limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  // Sort
  const validSortFields = ['createdAt', '-createdAt', 'title', '-title', 'size', '-size'];
  sanitized.sort = validSortFields.includes(query.sort) ? query.sort : '-createdAt';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

module.exports = {
  validateVideoUpload,
  validateVideoUpdate,
  isValidVideoId,
  validateVideoFilters
};
