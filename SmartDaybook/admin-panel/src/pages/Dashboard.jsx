import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Layers, Activity, CreditCard, LayoutList, CheckSquare } from 'lucide-react';
import CategoryManager from '../components/CategoryManager';
import UserManager from '../components/UserManager';
import Analytics from '../components/Analytics';
import TransactionManager from '../components/TransactionManager';
import TaskManager from '../components/TaskManager';
import TodoManager from '../components/TodoManager';

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('analytics');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/login');
    }
  }, [navigate]);

  const renderView = () => {
    switch (currentView) {
      case 'analytics': return <Analytics />;
      case 'users': return <UserManager />;
      case 'categories': 
        return (
          <>
            <header style={{ marginBottom: '2.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Category Management</h1>
              <p style={{ color: 'var(--text-muted)' }}>Globally update or remove any categories from the database system.</p>
            </header>
            <CategoryManager />
          </>
        );
      case 'transactions': return <TransactionManager />;
      case 'tasks': return <TaskManager />;
      case 'todos': return <TodoManager />;
      default: return <Analytics />;
    }
  };

  const NavButton = ({ id, icon: Icon, label }) => (
    <button 
      className="btn btn-ghost" 
      style={{ justifyContent: 'flex-start', background: currentView === id ? 'var(--bg-surface-hover)' : 'transparent', color: '#fff' }}
      onClick={() => setCurrentView(id)}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="glass-panel" style={{ width: '280px', margin: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', padding: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Admin Panel</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '1rem' }}>Metrics</p>
          <NavButton id="analytics" icon={Activity} label="Analytics Base" />
          <NavButton id="users" icon={Users} label="Manage Users" />
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '1rem' }}>Platform Data</p>
          <NavButton id="transactions" icon={CreditCard} label="Daybook (Global)" />
          <NavButton id="tasks" icon={LayoutList} label="Tasks Overview" />
          <NavButton id="todos" icon={CheckSquare} label="Scratchpad Todos" />
          <NavButton id="categories" icon={Layers} label="Global Categories" />
        </nav>

        <button 
          className="btn btn-ghost" 
          style={{ justifyContent: 'flex-start', color: 'var(--danger)', marginTop: '2rem' }}
          onClick={() => { localStorage.removeItem('adminToken'); navigate('/login'); }}
        >
          <LogOut size={18} /> Disconnect
        </button>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }} className="animate-fade-in">
        {renderView()}
      </main>
    </div>
  );
}
