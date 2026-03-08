import { useState, useEffect } from 'react';
import { Trash2, Shield, User, Search, RefreshCw } from 'lucide-react';
import api from '../api';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting a user will permanently destroy their account and ALL associated daybook records. Proceed?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to make ${user.name} a ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Error changing user role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading Directory...</div>;
  if (error) return <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)' }}>{error} - Ensure Backend routes are loaded.</div>;

  return (
    <>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>User Management</h1>
        <p style={{ color: 'var(--text-muted)' }}>Administer platform accounts and elevate privileges.</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Global Users ({users.length})</h3>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="input-field"
              style={{ paddingLeft: '2.8rem', paddingRight: '1rem', height: '42px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : null}
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--bg-surface)' }} className="animate-fade-in">
                  <td style={{ padding: '1rem' }}>#{u.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '50px', fontSize: '0.85rem',
                      background: u.role === 'admin' ? 'rgba(237, 28, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: u.role === 'admin' ? 'var(--accent)' : 'rgb(96, 165, 250)'
                    }}>
                      {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />} {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => toggleRole(u)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid var(--border-glass)' }} title={`Toggle Admin rights`}>
                        <RefreshCw size={16} color="var(--text-muted)" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Delete Account">
                        <Trash2 size={16} color="var(--danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
