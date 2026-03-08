import { useState, useEffect } from 'react';
import { Users, LayoutList, CreditCard, Layers } from 'lucide-react';
import api from '../api';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => setError('Failed to load stats - Ensure API server is active.'));
  }, []);

  if (error) return <div className="glass-panel" style={{ padding: '2rem', color: 'var(--danger)' }}>{error}</div>;
  if (!stats) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Aggregating Platform Data...</div>;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '220px', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.8rem', borderRadius: '12px', background: `rgba(${color}, 0.1)` }}>
          <Icon size={24} color={`rgb(${color})`} />
        </div>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</h3>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</p>
    </div>
  );

  return (
    <>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Overview Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Top-level view of application performance and adoption.</p>
      </header>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }} className="animate-fade-in">
        <StatCard title="Total Registered Users" value={stats.users} icon={Users} color="16, 185, 129" />
        <StatCard title="Total Global Categories" value={stats.categories} icon={Layers} color="239, 68, 68" />
        <StatCard title="Total Active Tasks" value={stats.tasks + stats.todos} icon={LayoutList} color="59, 130, 246" />
        <StatCard title="Transacted Volume" value={`₹${Number(stats.transactionVolume).toLocaleString()}`} icon={CreditCard} color="245, 158, 11" />
      </div>
    </>
  );
}
