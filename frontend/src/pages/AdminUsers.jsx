import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    loadUsers();
    loadSystemStats();
  }, [roleFilter]);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;

      const response = await usersAPI.getAll(params);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await usersAPI.getSystemStats();
      setSystemStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) {
      return;
    }

    try {
      await usersAPI.updateRole(userId, newRole);
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(u => u._id !== userId));
      loadSystemStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
          <p>Manage users and their roles</p>
        </div>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div className="stat-card">
            <div className="stat-card-icon">👥</div>
            <div className="stat-card-value">{systemStats.users?.totalUsers || 0}</div>
            <div className="stat-card-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">👁️</div>
            <div className="stat-card-value">{systemStats.users?.viewers || 0}</div>
            <div className="stat-card-label">Viewers</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✏️</div>
            <div className="stat-card-value">{systemStats.users?.editors || 0}</div>
            <div className="stat-card-label">Editors</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⚡</div>
            <div className="stat-card-value">{systemStats.users?.admins || 0}</div>
            <div className="stat-card-label">Admins</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="form-input"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        
        <div className="filters">
          <button 
            className={`filter-btn ${roleFilter === '' ? 'active' : ''}`}
            onClick={() => setRoleFilter('')}
          >
            All Roles
          </button>
          <button 
            className={`filter-btn ${roleFilter === 'viewer' ? 'active' : ''}`}
            onClick={() => setRoleFilter('viewer')}
          >
            Viewers
          </button>
          <button 
            className={`filter-btn ${roleFilter === 'editor' ? 'active' : ''}`}
            onClick={() => setRoleFilter('editor')}
          >
            Editors
          </button>
          <button 
            className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Videos</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{user.videoCount || 0}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(user._id, user.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary btn-sm"
            disabled={pagination.page === 1}
            onClick={() => loadUsers(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => loadUsers(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
