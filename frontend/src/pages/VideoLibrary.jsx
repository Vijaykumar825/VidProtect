import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { videosAPI } from '../services/api';
import './VideoLibrary.css';

function VideoLibrary() {
  const { isEditor } = useAuth();
  const { processingVideos, getProcessingStatus } = useSocket();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    loadVideos();
  }, [filter]);

  const loadVideos = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      
      if (filter === 'safe') {
        params.classification = 'safe';
      } else if (filter === 'flagged') {
        params.classification = 'flagged';
      } else if (filter === 'processing') {
        params.status = 'processing';
      }

      const response = await videosAPI.getAll(params);
      setVideos(response.data.data.videos);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videosAPI.delete(videoId);
      setVideos(videos.filter(v => v._id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVideoStatus = (video) => {
    const processingStatus = getProcessingStatus(video._id);
    if (processingStatus) {
      return { status: 'processing', progress: processingStatus.progress };
    }
    if (video.status === 'processing') {
      return { status: 'processing', progress: video.processingProgress };
    }
    return { 
      status: video.sensitivityResult?.classification || 'pending',
      progress: null 
    };
  };

  return (
    <div className="video-library">
      <div className="library-header">
        <div>
          <h1>Video Library</h1>
          <p>{pagination.total} videos total</p>
        </div>
        {isEditor && (
          <Link to="/upload" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload Video
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Videos
        </button>
        <button 
          className={`filter-btn ${filter === 'safe' ? 'active' : ''}`}
          onClick={() => setFilter('safe')}
        >
          ✅ Safe
        </button>
        <button 
          className={`filter-btn ${filter === 'flagged' ? 'active' : ''}`}
          onClick={() => setFilter('flagged')}
        >
          🚩 Flagged
        </button>
        <button 
          className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
          onClick={() => setFilter('processing')}
        >
          ⏳ Processing
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '400px' }}>
          <div className="spinner"></div>
          <p>Loading videos...</p>
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="video-grid">
            {videos.map((video) => {
              const { status, progress } = getVideoStatus(video);
              return (
                <Link to={`/videos/${video._id}`} key={video._id} className="video-card">
                  <div className="video-card-thumbnail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    {status === 'processing' && progress !== null && (
                      <div className="video-card-progress">
                        <div className="progress-bar progress-bar-animated">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="video-card-content">
                    <h3 className="video-card-title">{video.title}</h3>
                    <p className="video-card-meta">
                      {formatDate(video.createdAt)} • {formatFileSize(video.size)}
                    </p>
                    <div className="video-card-footer">
                      <span className={`badge badge-${status}`}>
                        {status === 'processing' ? `Processing ${progress || 0}%` : status}
                      </span>
                      {isEditor && (
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={(e) => handleDelete(video._id, e)}
                          title="Delete video"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary btn-sm"
                disabled={pagination.page === 1}
                onClick={() => loadVideos(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => loadVideos(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📹</div>
          <h3 className="empty-state-title">No videos found</h3>
          <p className="empty-state-text">
            {filter !== 'all' 
              ? 'Try changing the filter to see more videos' 
              : 'Upload your first video to get started'}
          </p>
          {isEditor && filter === 'all' && (
            <Link to="/upload" className="btn btn-primary">Upload Video</Link>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoLibrary;
