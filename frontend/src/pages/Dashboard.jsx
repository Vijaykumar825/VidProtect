import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { videosAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user, isEditor } = useAuth();
  const { processingVideos } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, videosRes] = await Promise.all([
        videosAPI.getStats(),
        videosAPI.getAll({ limit: 5, sort: '-createdAt' })
      ]);
      
      setStats(statsRes.data.data.stats);
      setRecentVideos(videosRes.data.data.videos);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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

  const processingCount = Object.keys(processingVideos).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.username}!</h1>
          <p>Here's an overview of your video library</p>
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📹</div>
          <div className="stat-card-value">{stats?.totalVideos || 0}</div>
          <div className="stat-card-label">Total Videos</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{stats?.safeVideos || 0}</div>
          <div className="stat-card-label">Safe Videos</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon">🚩</div>
          <div className="stat-card-value">{stats?.flaggedVideos || 0}</div>
          <div className="stat-card-label">Flagged Videos</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-value">{processingCount}</div>
          <div className="stat-card-label">Processing</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon">💾</div>
          <div className="stat-card-value">{formatFileSize(stats?.totalSize || 0)}</div>
          <div className="stat-card-label">Storage Used</div>
        </div>
      </div>

      {/* Processing Videos */}
      {processingCount > 0 && (
        <div className="dashboard-section">
          <h2>Currently Processing</h2>
          <div className="processing-list">
            {Object.entries(processingVideos).map(([videoId, { progress, stage }]) => (
              <div key={videoId} className="processing-item">
                <div className="processing-info">
                  <span className="processing-title">Video Processing</span>
                  <span className="processing-stage">{stage}</span>
                </div>
                <div className="processing-progress">
                  <div className="progress-bar progress-bar-animated">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="progress-text">{progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Videos */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Videos</h2>
          <Link to="/videos" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        
        {recentVideos.length > 0 ? (
          <div className="recent-videos-list">
            {recentVideos.map((video) => (
              <Link to={`/videos/${video._id}`} key={video._id} className="recent-video-item">
                <div className="video-thumbnail">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
                <div className="video-info">
                  <h4>{video.title}</h4>
                  <p>{formatDate(video.createdAt)} • {formatFileSize(video.size)}</p>
                </div>
                <span className={`badge badge-${video.sensitivityResult?.classification || 'pending'}`}>
                  {video.status === 'processing' ? 'Processing' : video.sensitivityResult?.classification || 'Pending'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📹</div>
            <h3 className="empty-state-title">No videos yet</h3>
            <p className="empty-state-text">Upload your first video to get started</p>
            {isEditor && (
              <Link to="/upload" className="btn btn-primary">Upload Video</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
