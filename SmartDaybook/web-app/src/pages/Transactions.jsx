import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag
} from 'lucide-react';
import Modal from '../components/Common/Modal';

import api from '../services/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);
      setFormData({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category_id: tx.category_id || '',
        date: new Date(tx.date).toISOString().split('T')[0]
      });
    } else {
      setEditingTx(null);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}`, formData);
      } else {
        await api.post('/transactions', formData);
      }
      fetchTransactions();
      setIsModalOpen(false);
    } catch (error) {
      alert('Error saving transaction: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      alert('Error deleting transaction');
    }
  };

  return (
    <div className="transactions-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Manage your income and expenses</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </header>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading transactions...</td></tr>
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No transactions found.</td></tr>
            ) : filteredTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="date-cell">
                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                </td>
                <td className="desc-cell">{tx.description}</td>
                <td className="cat-cell">
                  <span className="tag">
                    {tx.category_name || 'General'}
                  </span>
                </td>
                <td className="type-cell">
                  <span className={`type-badge ${tx.type}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className={`amount-cell ${tx.type}`}>
                  ₹{Number(tx.amount).toLocaleString()}
                </td>
                <td className="action-cell">
                  <div className="action-group">
                    <button className="icon-btn" onClick={() => handleOpenModal(tx)}><Plus size={16} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(tx.id)}><Tag size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit} className="tx-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Type</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What was this for?"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Category</label>
              <select 
                value={formData.category_id} 
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Date</label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingTx ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .search-box input {
          padding: 8px 12px 8px 40px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          outline: none;
          min-width: 250px;
        }

        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          padding: 1.25rem 1.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table td {
          padding: 1.25rem 1.5rem;
          font-size: 0.9rem;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table tr:last-child td { border-bottom: none; }

        .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }

        .date-cell, .cat-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tag {
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .type-badge.income { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
        .type-badge.expense { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }

        .amount-cell { font-weight: 700; }
        .amount-cell.income { color: var(--accent-green); }
        .amount-cell.expense { color: var(--accent-red); }

        .icon-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }

        .tx-form {
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

        .form-group input, .form-group select {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          outline: none;
          width: 100%;
        }

        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
        }

        .modal-footer {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .action-group {
          display: flex;
          gap: 8px;
        }

        .form-group select option {
          background-color: #1e293b;
          color: white;
          padding: 10px;
        }
      ` }} />
    </div>
  );
};

export default Transactions;
