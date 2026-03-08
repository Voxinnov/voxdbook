import { useState, useEffect } from 'react';
import { Trash2, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api';

export default function TransactionManager() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/transactions');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Daybook transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this transaction?')) return;
    try {
      await api.delete(`/admin/transactions/${id}`);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Error deleting transaction');
    }
  };

  const filtered = data.filter(item => 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading Daybook Records...</div>;
  if (error) return <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)' }}>{error} - Ensure Backend is running.</div>;

  return (
    <>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Global Daybook Log</h1>
        <p style={{ color: 'var(--text-muted)' }}>Audit and manage all financial transactions across the platform.</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Global Transactions ({data.length})</h3>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search description or email..." className="input-field" style={{ paddingLeft: '2.8rem', paddingRight: '1rem', height: '42px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Amount</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Description</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Owner</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--bg-surface)' }} className="animate-fade-in">
                  <td style={{ padding: '1rem' }}>#{t.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} ₹{t.amount}
                  </td>
                  <td style={{ padding: '1rem' }}>{t.description}</td>
                  <td style={{ padding: '1rem' }}>{t.category_name || 'Uncategorized'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.user_email}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(t.id)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Delete Data">
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
