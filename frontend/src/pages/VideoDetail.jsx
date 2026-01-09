import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { videosAPI } from '../services/api';
import './VideoDetail.css';

function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEditor } = useAuth();
  const { getProcessingStatus } = useSocket();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('quality'); // 'quality' or 'speed'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    loadVideo();
  }, [id]);

  // Poll for updates if video is processing
  useEffect(() => {
    if (video && video.status === 'processing') {
      const interval = setInterval(loadVideo, 3000);
      return () => clearInterval(interval);
    }
  }, [video?.status]);

  // Keyboard shortcuts for video navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keys when not in an input/textarea/button
      // This prevents keyboard shortcuts from intercepting button clicks
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        return;
      }

      if (videoRef.current) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + 10
          );
        } else if (e.key === ' ') {
          e.preventDefault();
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  // Control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  const toggleFullscreen = () => {
    const container = document.querySelector('.video-wrapper');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const loadVideo = async () => {
    try {
      const response = await videosAPI.getOne(id);
      setVideo(response.data.data.video);
      setEditTitle(response.data.data.video.title);
      setEditDescription(response.data.data.video.description || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videosAPI.delete(id);
      navigate('/videos', { state: { message: 'Video deleted successfully' } });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await videosAPI.update(id, {
        title: editTitle,
        description: editDescription
      });
      setVideo({ ...video, title: editTitle, description: editDescription });
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update video');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Skip forward/backward functions
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + 10
      );
    }
  };

  // Get real-time processing status
  const processingStatus = video ? getProcessingStatus(video._id) : null;
  const isProcessing = video?.status === 'processing' || processingStatus;
  const progress = processingStatus?.progress || video?.processingProgress || 0;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/videos" className="btn btn-primary">Back to Library</Link>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  const streamUrl = `${import.meta.env.VITE_API_URL}/videos/${video._id}/stream`;
  const token = localStorage.getItem('token');

  return (
    <div className="video-detail">
      <div className="detail-header">
        <Link to="/videos" className="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Library
        </Link>
      </div>

      {/* Video Player */}
      <div className="video-player-container">
        {isProcessing ? (
          <div className="video-processing">
            <div className="processing-content">
              <div className="processing-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinning">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>Processing Video</h3>
              <p>{processingStatus?.stage || 'Analyzing content...'}</p>
              <div className="processing-progress">
                <div className="progress-bar progress-bar-animated">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        ) : video.streamable ? (
          <div 
            className={`video-wrapper ${showControls ? 'show-controls' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            <video
              ref={videoRef}
              className="video-player"
              preload="metadata"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source 
                src={`${streamUrl}?token=${token}`} 
                type={video.mimetype} 
              />
              Your browser does not support the video tag.
            </video>
            
            {/* Netflix-style custom controls */}
            <div className="custom-controls">
              {/* Progress bar */}
              <div 
                className="progress-container"
                ref={progressRef}
                onClick={handleProgressClick}
              >
                <div 
                  className="progress-bar-custom"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
              </div>
              
              {/* Control buttons */}
              <div className="controls-row">
                <div className="controls-left">
                  {/* Play/Pause */}
                  <button className="control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                    )}
                  </button>
                  
                  {/* Skip backward */}
                  <button className="control-btn" onClick={skipBackward} title="Skip back 10 seconds">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12.5 8L8 12l4.5 4"/>
                      <text x="14" y="14" fontSize="8" fill="currentColor" stroke="none">10</text>
                    </svg>
                  </button>
                  
                  {/* Skip forward */}
                  <button className="control-btn" onClick={skipForward} title="Skip forward 10 seconds">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11.5 8L16 12l-4.5 4"/>
                      <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">10</text>
                    </svg>
                  </button>
                  
                  {/* Volume */}
                  <div className="volume-control">
                    <button className="control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                      {isMuted || volume === 0 ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                          <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
                          <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2"/>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                    <input 
                      type="range" 
                      className="volume-slider"
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                    />
                  </div>
                  
                  {/* Time display */}
                  <div className="time-display">
                    <span>{formatTime(currentTime)}</span>
                    <span className="time-separator">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <div className="controls-right">
                  {/* Settings menu */}
                  <div className="settings-container" ref={settingsRef}>
                    <button 
                      className={`control-btn ${showSettings ? 'active' : ''}`} 
                      onClick={() => setShowSettings(!showSettings)}
                      title="Settings"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </button>
                    
                    {showSettings && (
                      <div className="settings-menu">
                        <div className="settings-header">
                          <button 
                            className={`settings-tab ${settingsTab === 'quality' ? 'active' : ''}`}
                            onClick={() => setSettingsTab('quality')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <rect x="2" y="3" width="20" height="14" rx="2"/>
                              <path d="M8 21h8M12 17v4"/>
                            </svg>
                            Quality
                          </button>
                          <button 
                            className={`settings-tab ${settingsTab === 'speed' ? 'active' : ''}`}
                            onClick={() => setSettingsTab('speed')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Speed
                          </button>
                          <button 
                            className="settings-close"
                            onClick={() => setShowSettings(false)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="settings-content">
                          {settingsTab === 'quality' && (
                            <div className="settings-options">
                              <button className="settings-option active">
                                <span className="option-dot"></span>
                                Auto <span className="option-label">720p</span>
                              </button>
                              <button className="settings-option">
                                720p
                              </button>
                              <button className="settings-option">
                                360p
                              </button>
                            </div>
                          )}
                          
                          {settingsTab === 'speed' && (
                            <div className="settings-options">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                <button 
                                  key={speed}
                                  className={`settings-option ${playbackSpeed === speed ? 'active' : ''}`}
                                  onClick={() => {
                                    setPlaybackSpeed(speed);
                                    if (videoRef.current) {
                                      videoRef.current.playbackRate = speed;
                                    }
                                  }}
                                >
                                  {playbackSpeed === speed && <span className="option-dot"></span>}
                                  {speed === 1 ? 'Normal' : `${speed}x`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Fullscreen */}
                  <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="video-unavailable">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <h3>Video Unavailable</h3>
            <p>This video is not available for streaming</p>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="video-info-panel">
        <div className="info-main">
          {editing ? (
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="edit-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1>{video.title}</h1>
              {video.description && <p className="video-description">{video.description}</p>}
              
              <div className="video-meta">
                <span>{formatDate(video.createdAt)}</span>
                <span>•</span>
                <span>{formatFileSize(video.size)}</span>
                <span>•</span>
                <span>{video.mimetype}</span>
              </div>

              {isEditor && (
                <div className="video-actions">
                  <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sensitivity Analysis Results */}
        <div className="sensitivity-panel">
          <h3>Sensitivity Analysis</h3>
          
          <div className="sensitivity-result">
            <div className={`sensitivity-status ${video.sensitivityResult?.classification || 'pending'}`}>
              {video.sensitivityResult?.classification === 'safe' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )}
              {video.sensitivityResult?.classification === 'flagged' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
              {(!video.sensitivityResult?.classification || video.sensitivityResult?.classification === 'pending') && (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              )}
            </div>
            
            <div className="sensitivity-info">
              <span className={`badge badge-${video.sensitivityResult?.classification || 'pending'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {video.sensitivityResult?.classification?.toUpperCase() || 'PENDING'}
              </span>
              
              {video.sensitivityResult?.confidence > 0 && (
                <p className="confidence">
                  Confidence: {video.sensitivityResult.confidence}%
                </p>
              )}
              
              {video.sensitivityResult?.analyzedAt && (
                <p className="analyzed-date">
                  Analyzed: {formatDate(video.sensitivityResult.analyzedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Flags */}
          {video.sensitivityResult?.flags?.length > 0 && (
            <div className="flags-section">
              <h4>Detected Issues</h4>
              <div className="flags-list">
                {video.sensitivityResult.flags.map((flag, index) => (
                  <span key={index} className="flag-tag">
                    🚩 {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoDetail;
