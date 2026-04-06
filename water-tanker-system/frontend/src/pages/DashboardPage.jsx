import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './DashboardPage.css';

const statusColor = { pending: 'yellow', 'in-progress': 'cyan', completed: 'green', cancelled: 'red' };
const severityColor = { critical: 'red', warning: 'yellow', info: 'blue' };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    await dashboardAPI.markAlertRead(id);
    loadStats();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const s = data?.stats || {};

  const chartData = data?.topDemandVillages?.map(v => ({
    name: v.name.length > 10 ? v.name.substring(0, 10) + '…' : v.name,
    score: Math.round(v.demandScore),
    shortage: v.isShortage ? 1 : 0,
  })) || [];

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Operations Dashboard</h1>
          <p>Real-time overview of water distribution across all districts</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadStats}>↻ Refresh</button>
      </div>

      {s.delayedDeliveries > 0 && (
        <div className="alert alert-error mb-24">
          ⚠ <strong>{s.delayedDeliveries} delayed deliveries</strong> — immediate attention required
        </div>
      )}

      <div className="grid-4 mb-24">
        <StatCard title="Total Deliveries" value={s.totalDeliveries ?? 0} icon="🚚" color="blue" />
        <StatCard title="Water Distributed" value={`${((s.totalWaterDistributed || 0) / 1000).toFixed(1)}kL`} icon="💧" color="cyan" />
        <StatCard title="Pending Deliveries" value={s.pendingDeliveries ?? 0} icon="⏳" color="yellow" />
        <StatCard title="In Progress" value={s.inProgressDeliveries ?? 0} icon="▶" color="teal" />
        <StatCard title="Shortage Villages" value={s.shortageVillages ?? 0} icon="⚠" color="red" subtitle={`of ${s.totalVillages} total`} />
        <StatCard title="Available Tankers" value={s.availableTankers ?? 0} icon="🟢" color="green" subtitle={`${s.busyTankers} busy`} />
        <StatCard title="Open Complaints" value={s.openComplaints ?? 0} icon="📋" color="orange" />
        <StatCard title="Unread Alerts" value={s.unreadAlerts ?? 0} icon="🔔" color="red" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-section-header">
            <h3>Village Demand Scores</h3>
            <span className="badge badge-blue">AI Prioritized</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131d35', border: '1px solid #1e2d50', borderRadius: 8, color: '#e2e8f0' }}
                cursor={{ fill: 'rgba(59,130,246,0.08)' }}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Demand Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-section-header">
            <h3>Live Alerts</h3>
            {s.unreadAlerts > 0 && <span className="badge badge-red">{s.unreadAlerts} new</span>}
          </div>
          <div className="alerts-list">
            {data?.recentAlerts?.length === 0 && <div className="empty-state" style={{padding:'32px'}}><p>No active alerts</p></div>}
            {data?.recentAlerts?.map(alert => (
              <div key={alert._id} className={`alert-item alert-item--${severityColor[alert.severity] || 'blue'}`}>
                <div className="alert-item__body">
                  <div className="alert-item__msg">{alert.message}</div>
                  <div className="alert-item__meta">
                    {alert.village?.name && <span>{alert.village.name}</span>}
                    <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => markRead(alert._id)}>✓</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-section-header"><h3>Recent Deliveries</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Village</th><th>Tanker</th><th>Status</th></tr></thead>
              <tbody>
                {data?.recentDeliveries?.length === 0 && (
                  <tr><td colSpan={3} style={{textAlign:'center',color:'var(--text-muted)'}}>No deliveries yet</td></tr>
                )}
                {data?.recentDeliveries?.map(d => (
                  <tr key={d._id}>
                    <td>{d.village?.name || '—'}<div style={{fontSize:'11px',color:'var(--text-muted)'}}>{d.village?.district}</div></td>
                    <td><span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{d.tanker?.vehicleNumber || '—'}</span></td>
                    <td><span className={`badge badge-${statusColor[d.status]}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-section-header">
            <h3>Priority Villages</h3>
            <span className="badge badge-orange">Needs Delivery</span>
          </div>
          <div className="priority-list">
            {data?.topDemandVillages?.map((v, i) => (
              <div key={v._id} className="priority-item">
                <div className="priority-rank">{i + 1}</div>
                <div className="priority-info">
                  <div className="priority-name">{v.name}</div>
                  <div className="priority-meta">{v.district} · Pop. {v.population.toLocaleString()}</div>
                </div>
                <div className="priority-score">
                  {v.isShortage && <span className="badge badge-red" style={{marginRight:8}}>!</span>}
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:'var(--accent-orange)'}}>{Math.round(v.demandScore).toLocaleString()}L</span>
                </div>
              </div>
            ))}
            {(!data?.topDemandVillages?.length) && <div className="empty-state" style={{padding:'32px'}}><p>No village data</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
