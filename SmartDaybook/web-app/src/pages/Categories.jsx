import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('expense');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await api.post('/categories', { name: newName, type: newType });
      setCategories([...categories, response.data]);
      setNewName('');
      setNewType('expense');
      setIsAdding(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please ensure all fields are correct.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Transactions using it will be uncategorized.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="categories-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Category Management</h1>
          <p>Organize your transactions and tasks</p>
        </div>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            <span>New Category</span>
          </button>
        )}
      </header>

      {isAdding && (
        <div className="card mb-4 animate-fade-in">
          <form onSubmit={handleCreate} className="category-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Category Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Shopping, Bills, Work"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Category Type</label>
                <select 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Category</button>
            </div>
          </form>
        </div>
      )}

      <div className="categories-grid">
        {loading ? (
          <div className="text-center py-4">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="card text-center p-5 text-muted">
            <Tag size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>No categories found. Create your first one to start organizing!</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} className="card category-card">
            <div className="cat-header">
              <div className={`cat-icon ${cat.type}`}>
                <Tag size={20} />
              </div>
              <div className="cat-details">
                <h3>{cat.name}</h3>
                <span className="text-muted" style={{ textTransform: 'capitalize' }}>
                  {cat.type} Category
                </span>
              </div>
            </div>
            <div className="cat-footer">
              <button className="icon-btn" title="Edit"><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(cat.id)} title="Delete"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .category-card .cat-header {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .cat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-icon.income { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
        .cat-icon.expense { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }

        .category-card h3 {
          font-size: 1.1rem;
          margin-bottom: 2px;
        }

        .category-card .cat-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .category-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: flex;
          gap: 1.25rem;
        }

        .flex-1 { flex: 1; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .category-form input, .category-form select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          outline: none;
        }

        .category-form .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .mb-4 { margin-bottom: 1.5rem; }

        .icon-btn.delete:hover { color: var(--accent-red); background: rgba(239, 68, 68, 0.1); }
      ` }} />
    </div>
  );
};

export default Categories;
