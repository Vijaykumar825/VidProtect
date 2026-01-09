import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Pulse Video</h1>
      </div>
      
      <div className="header-right">
        {/* Connection status indicator */}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">{connected ? 'Live' : 'Offline'}</span>
        </div>
        
        {/* User info */}
        <div className="header-user">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>
        
        {/* Logout button */}
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
