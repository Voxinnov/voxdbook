import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Flag,
  CheckCircle2,
  Circle,
  MoreVertical,
  Filter,
  Search,
  Tag
} from 'lucide-react';
import Modal from '../components/Common/Modal';
import api from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: new Date(task.due_date).toISOString().split('T')[0],
        status: task.status
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      alert('Error saving task');
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      alert('Error deleting task');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="tasks-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Tasks Management</h1>
          <p>Organize and track your daily work</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      <div className="tasks-container">
        {loading ? (
          <div className="text-center">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="card text-center py-4">No tasks found.</div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`card task-card ${task.status}`}>
                <div className="task-main">
                  <button 
                    onClick={() => toggleTaskStatus(task)}
                    className="status-toggle"
                  >
                    {task.status === 'completed' ? 
                      <CheckCircle2 color="var(--accent-green)" /> : 
                      <Circle color="var(--text-muted)" />
                    }
                  </button>
                  <div className="task-content">
                    <h3 className={task.status === 'completed' ? 'strikethrough' : ''}>
                      {task.title}
                    </h3>
                    {task.description && <p className="text-muted">{task.description}</p>}
                    <div className="task-meta">
                      <span className="meta-item">
                        <Calendar size={14} />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                      <span className="meta-item" style={{ color: getPriorityColor(task.priority) }}>
                        <Flag size={14} />
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                  <div className="action-group">
                    <button className="icon-btn" onClick={() => handleOpenModal(task)}><Plus size={18} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(task.id)}><Tag size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Task Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add more details..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Priority</label>
              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Due Date</label>
              <input 
                type="date" 
                value={formData.due_date} 
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .tasks-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .task-card {
          padding: 1.25rem;
          transition: border-color 0.2s;
        }

        .task-card.completed {
          opacity: 0.7;
          border-left: 4px solid var(--accent-green);
        }

        .task-main {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .status-toggle {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 4px;
        }

        .task-content {
          flex: 1;
        }

        .task-content h3 {
          font-size: 1.05rem;
          margin-bottom: 4px;
        }

        .strikethrough {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .task-meta {
          display: flex;
          gap: 1.5rem;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .task-form {
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

        .form-group input, .form-group select, .form-group textarea {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          outline: none;
          width: 100%;
          font-family: inherit;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary);
        }

        .modal-footer {
          margin-top: 1rem;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .action-group {
          display: flex;
          gap: 8px;
        }

        }
      ` }} />
    </div>
  );
};

export default Tasks;
