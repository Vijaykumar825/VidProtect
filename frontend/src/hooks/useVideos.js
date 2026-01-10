/**
 * useVideos Hook
 * Custom hook for video operations and state management
 */

import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for managing video operations
 * @returns {Object} Video state and methods
 */
export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  /**
   * Fetch videos with optional filters
   * @param {Object} filters - Filter options
   */
  const fetchVideos = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.classification) params.append('classification', filters.classification);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await api.get(`/videos?${params.toString()}`);

      if (response.data.success) {
        setVideos(response.data.data.videos);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching videos');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single video by ID
   * @param {string} id - Video ID
   * @returns {Object|null} Video object or null
   */
  const fetchVideo = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/videos/${id}`);
      return response.data.success ? response.data.data.video : null;
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching video');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new video
   * @param {FormData} formData - Form data with video file and metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Object|null} Uploaded video data or null
   */
  const uploadVideo = useCallback(async (formData, onProgress) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data.success ? response.data.data : null;
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading video');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update video metadata
   * @param {string} id - Video ID
   * @param {Object} updates - Update data
   * @returns {Object|null} Updated video or null
   */
  const updateVideo = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/videos/${id}`, updates);

      if (response.data.success) {
        setVideos(prev =>
          prev.map(v => v._id === id ? response.data.data.video : v)
        );
        return response.data.data.video;
      }
      return null;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating video');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a video
   * @param {string} id - Video ID
   * @returns {boolean} True if deleted successfully
   */
  const deleteVideo = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/videos/${id}`);

      if (response.data.success) {
        setVideos(prev => prev.filter(v => v._id !== id));
        return true;
      }
      return false;
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting video');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch video statistics
   * @returns {Object|null} Stats object or null
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/videos/stats/summary');
      return response.data.success ? response.data.data : null;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    videos,
    loading,
    error,
    pagination,
    fetchVideos,
    fetchVideo,
    uploadVideo,
    updateVideo,
    deleteVideo,
    fetchStats,
    clearError
  };
};

export default useVideos;
