/**
 * File Helper Utilities
 * File system operations and utilities
 */

const fs = require('fs');
const path = require('path');

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Safely delete a file
 * @param {string} filePath - Absolute path to the file
 * @returns {boolean} True if deleted, false otherwise
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 * @returns {boolean} True if directory exists/created
 */
const ensureDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (lowercase, without dot)
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().slice(1);
};

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if file exists
 */
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * Get file stats
 * @param {string} filePath - File path
 * @returns {Object|null} File stats or null if error
 */
const getFileStats = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath);
    }
    return null;
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
};

/**
 * Generate unique filename
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename with UUID prefix
 */
const generateUniqueFilename = (originalName) => {
  const { v4: uuidv4 } = require('uuid');
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
};

/**
 * Validate video file type
 * @param {string} mimetype - File MIME type
 * @returns {boolean} True if valid video type
 */
const isValidVideoType = (mimetype) => {
  const validTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm'
  ];
  return validTypes.includes(mimetype);
};

/**
 * Get allowed video extensions
 * @returns {Array} Array of allowed extensions
 */
const getAllowedVideoExtensions = () => {
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg'];
};

/**
 * Clean up old temporary files
 * @param {string} directory - Directory to clean
 * @param {number} maxAgeMs - Maximum file age in milliseconds
 * @returns {number} Number of files deleted
 */
const cleanupTempFiles = (directory, maxAgeMs = 24 * 60 * 60 * 1000) => {
  let deletedCount = 0;
  const now = Date.now();

  try {
    if (!fs.existsSync(directory)) {
      return 0;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }

  return deletedCount;
};

module.exports = {
  formatFileSize,
  deleteFile,
  ensureDirectory,
  getFileExtension,
  fileExists,
  getFileStats,
  generateUniqueFilename,
  isValidVideoType,
  getAllowedVideoExtensions,
  cleanupTempFiles
};
