import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  ListTodo,
  Tag,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { title: 'Transactions', path: '/transactions', icon: <Receipt size={20} /> },
    { title: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
    { title: 'Todos', path: '/todos', icon: <ListTodo size={20} /> },
    { title: 'Diet Planner', path: '/diet-planner', icon: <CheckSquare size={20} /> },
    { title: 'Day Planner', path: '/day-planner', icon: <CheckSquare size={20} /> },
    { title: 'Categories', path: '/categories', icon: <Tag size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">V</span>
          <span className="logo-text">VOXdBOOK</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {item.icon}
            <span>{item.title}</span>
            <ChevronRight className="chevron" size={14} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="details">
            <p className="name">{user?.name || 'User'}</p>
            <p className="role">{user?.role || 'Member'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            {/* Can add search here later */}
          </div>
          <div className="user-actions">
            {/* Additional user context actions */}
          </div>
        </header>
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: var(--sidebar-width);
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 10;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          background: var(--primary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .logo-text {
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 1px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: var(--text-muted);
          transition: all 0.2s;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .nav-item.active {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary);
        }

        .nav-item .chevron {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-item.active .chevron, .nav-item:hover .chevron {
          opacity: 1;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
        }

        .main-content {
          margin-left: var(--sidebar-width);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .top-bar {
          height: 70px;
          padding: 0 2rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          background: var(--glass);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .page-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
      ` }} />
    </div>
  );
};

export default AppLayout;
