import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  Plus,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState({
    transactions: [],
    tasks: [],
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [txRes, taskRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/tasks')
      ]);
      setData({
        transactions: txRes.data,
        tasks: taskRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const getStats = () => {
    const income = data.transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = data.transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const pendingTasks = data.tasks.filter(t => t.status !== 'completed').length;
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      pendingTasks
    };
  };

  const stats = getStats();
  const recentTransactions = data.transactions.slice(0, 5);
  const upcomingTasks = data.tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);

  if (data.loading) {
    return <div className="p-5 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's your financial and task summary.</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="icon-box income">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Total Income</span>
            <h2 className="value">₹{stats.totalIncome.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card stat-card">
          <div className="icon-box expense">
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Total Expense</span>
            <h2 className="value">₹{stats.totalExpense.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card stat-card">
          <div className="icon-box balance">
            <Wallet size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Balance</span>
            <h2 className="value">₹{stats.balance.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card stat-card">
          <div className="icon-box tasks">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Pending Tasks</span>
            <h2 className="value">{stats.pendingTasks}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card main-chart-card">
          <div className="card-header">
            <h3>Budget Health</h3>
          </div>
          <div className="budget-viz">
            <div className="budget-bar-container">
              <div 
                className="budget-bar income-fill" 
                style={{ width: stats.totalIncome > 0 ? '100%' : '0%' }}
              ></div>
              <div 
                className="budget-bar expense-fill" 
                style={{ 
                  width: stats.totalIncome > 0 
                    ? `${(stats.totalExpense / stats.totalIncome) * 100}%` 
                    : stats.totalExpense > 0 ? '100%' : '0%' 
                }}
              ></div>
            </div>
            <div className="budget-labels">
              <span>Expenses vs Income</span>
              <span>{stats.totalIncome > 0 ? Math.round((stats.totalExpense / stats.totalIncome) * 100) : 0}% used</span>
            </div>
          </div>

          <div className="recent-activity">
            <h4>Recent Transactions</h4>
            <div className="mini-list">
              {recentTransactions.length === 0 ? (
                <p className="text-muted p-2">No recent transactions</p>
              ) : recentTransactions.map(tx => (
                <div key={tx.id} className="mini-item">
                  <div className={`dot ${tx.type}`}></div>
                  <span>{tx.description}</span>
                  <span className={`amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mini-list-card">
          <div className="card-header">
            <h3>Priority Tasks</h3>
            <ArrowRight size={18} className="text-muted" />
          </div>
          <div className="mini-list">
            {upcomingTasks.length === 0 ? (
              <p className="text-muted">No pending tasks</p>
            ) : upcomingTasks.map(task => (
              <div key={task.id} className="mini-item">
                <div className={`dot-priority ${task.priority}`}></div>
                <div className="item-content">
                  <span className="title">{task.title}</span>
                  <span className="date">{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer-action">
            <button className="btn btn-outline btn-sm w-full mt-4">View All Tasks</button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .budget-viz {
          margin: 1.5rem 0 2rem;
        }

        .budget-bar-container {
          height: 12px;
          background: var(--bg-dark);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          margin-bottom: 0.75rem;
        }

        .budget-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          transition: width 1s ease-out;
        }

        .income-fill { background: rgba(99, 102, 241, 0.2); width: 100%; }
        .expense-fill { background: var(--primary); }

        .budget-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .recent-activity {
          margin-top: 2rem;
        }

        .recent-activity h4 {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mini-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mini-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
        }

        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.income { background: var(--accent-green); }
        .dot.expense { background: var(--accent-red); }

        .item-content { display: flex; flex-direction: column; }
        .item-content .date { font-size: 0.75rem; color: var(--text-muted); }

        .dot-priority { width: 4px; height: 16px; border-radius: 2px; }
        .dot-priority.high { background: var(--accent-red); }
        .dot-priority.medium { background: var(--primary); }
        .dot-priority.low { background: var(--accent-green); }

        .mini-item .amount { margin-left: auto; font-weight: 600; }
        .amount.income { color: var(--accent-green); }
        .amount.expense { color: var(--accent-red); }
        
        .w-full { width: 100%; }
        .mt-4 { margin-top: 1rem; }
      ` }} />

      <style dangerouslySetInnerHTML={{ __html: `
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .page-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.income { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
        .icon-box.expense { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }
        .icon-box.balance { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        .icon-box.tasks { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .stat-info .label {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .stat-info .value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .placeholder-chart {
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--border-color);
          border-radius: 10px;
          margin-top: 1rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .mini-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mini-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .dot.secondary { background: var(--accent-green); }

        .mini-item .time {
          margin-left: auto;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      ` }} />
    </div>
  );
};

export default Dashboard;
