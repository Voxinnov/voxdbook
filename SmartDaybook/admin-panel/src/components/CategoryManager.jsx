import { useState, useEffect } from 'react';
import { Trash2, Edit2, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '../api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Edit state
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', type: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/categories');
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Error deleting category');
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, type: cat.type });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/categories/${id}`, editForm);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...editForm } : c));
      setEditingId(null);
    } catch (err) {
      alert('Error saving category');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading Database Records...</div>;
  if (error) return <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)' }}>{error} - Ensure Backend is running.</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      
      {/* Table Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Global Directory ({categories.length} total)</h3>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by name or owner..." 
            className="input-field"
            style={{ paddingLeft: '2.8rem', paddingRight: '1rem', height: '42px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* The Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Owner (Email)</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No categories found</td></tr>
            ) : null}
            
            {filteredCategories.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid var(--bg-surface)', transition: 'background 0.2s' }} className="animate-fade-in">
                <td style={{ padding: '1rem' }}>#{cat.id}</td>
                
                {/* Editable Name Field */}
                <td style={{ padding: '1rem' }}>
                  {editingId === cat.id ? (
                    <input autoFocus className="input-field" style={{ padding: '0.4rem' }} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  ) : <span style={{ fontWeight: 500 }}>{cat.name}</span>}
                </td>

                {/* Editable Type Field */}
                <td style={{ padding: '1rem' }}>
                  {editingId === cat.id ? (
                    <select className="input-field" style={{ padding: '0.4rem' }} value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  ) : (
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '50px', 
                      fontSize: '0.85rem',
                      background: cat.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: cat.type === 'income' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {cat.type}
                    </span>
                  )}
                </td>

                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cat.user_email || 'Unknown'}</td>

                {/* Actions */}
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => saveEdit(cat.id)} className="btn btn-primary" style={{ padding: '0.5rem' }} title="Save">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={cancelEdit} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid var(--border-glass)' }} title="Cancel">
                          <XCircle size={16} color="var(--text-muted)" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(cat)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid var(--border-glass)' }} title="Edit">
                          <Edit2 size={16} color="var(--text-muted)" />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="btn glass-panel" style={{ padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Delete">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
