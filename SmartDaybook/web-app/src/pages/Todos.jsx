import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2,
  ListRestart
} from 'lucide-react';
import api from '../services/api';

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await api.post('/todos', { title: newTodo, status: 'pending' });
      setTodos([response.data, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/todos/${todo.id}`, { ...todo, status: newStatus });
      setTodos(todos.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="todos-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Quick Todos</h1>
          <p>Manage your daily checklists</p>
        </div>
      </header>

      <div className="card todo-card-main">
        <form onSubmit={handleAddTodo} className="todo-input-group">
          <input 
            type="text" 
            placeholder="Add a new item..." 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={20} />
          </button>
        </form>

        <div className="todo-list">
          {loading ? (
            <div className="text-center py-4">Loading todos...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-4 text-muted">Nothing to do yet!</div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.status}`}>
                <button onClick={() => toggleTodo(todo)} className="status-btn">
                  {todo.status === 'completed' ? 
                    <CheckCircle2 color="var(--accent-green)" /> : 
                    <Circle color="var(--text-muted)" />
                  }
                </button>
                <span className="todo-text">{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {todos.some(t => t.status === 'completed') && (
          <div className="todo-footer">
            <button className="btn btn-outline btn-sm" onClick={fetchTodos}>
              <ListRestart size={14} />
              <span>Refresh List</span>
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .todo-card-main {
          max-width: 600px;
          margin: 0 auto;
        }

        .todo-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 2rem;
        }

        .todo-input-group input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: white;
          outline: none;
        }

        .todo-input-group input:focus {
          border-color: var(--primary);
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .todo-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--border-color);
        }

        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .status-btn, .delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .todo-text {
          flex: 1;
        }

        .delete-btn {
          color: var(--text-muted);
          opacity: 0;
        }

        .todo-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: var(--accent-red);
        }

        .todo-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
        }
      ` }} />
    </div>
  );
};

export default Todos;
