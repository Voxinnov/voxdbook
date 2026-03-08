import { useState, useEffect } from 'react';
import { Trash2, Search, CheckCircle, Clock } from 'lucide-react';
import api from '../api';

export default function TaskManager() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tasks');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting a user task will permanently destroy it. Proceed?')) return;
    try {
      await api.delete(`/admin/tasks/${id}`);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Error deleting task');
    }
  };

  const filtered = data.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading Tasks...</div>;
  if (error) return <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)' }}>{error} - Ensure Backend routes are loaded.</div>;

  return (
    <>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Global Tasks Matrix</h1>
        <p style={{ color: 'var(--text-muted)' }}>Audit and manage all active user tasks across the platform.</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Global Tasks ({data.length})</h3>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search title or email..." className="input-field" style={{ paddingLeft: '2.8rem', paddingRight: '1rem', height: '42px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Title</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Due Time</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Owner</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--bg-surface)' }} className="animate-fade-in">
                  <td style={{ padding: '1rem' }}>#{t.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '50px', fontSize: '0.85rem',
                      background: t.is_completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: t.is_completed ? 'var(--success)' : 'rgb(245, 158, 11)'
                    }}>
                      {t.is_completed ? <CheckCircle size={14} /> : <Clock size={14} />} {t.is_completed ? 'Done' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{t.title}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.time || 'N/A'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.user_email}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(t.id)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Delete Task">
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
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
