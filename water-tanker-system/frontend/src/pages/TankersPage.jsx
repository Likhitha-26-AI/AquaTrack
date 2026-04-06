import { useState, useEffect } from 'react';
import { tankerAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY = { vehicleNumber: '', capacityLiters: '', model: '', yearManufactured: '', driver: '' };
const statusBadge = { available: 'badge-green', busy: 'badge-yellow', maintenance: 'badge-red' };

export default function TankersPage() {
  const [tankers, setTankers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([tankerAPI.getAll(), authAPI.getUsers()]);
      setTankers(tRes.data);
      setDrivers(uRes.data.filter(u => u.role === 'Driver'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (t) => {
    setForm({ vehicleNumber: t.vehicleNumber, capacityLiters: t.capacityLiters, model: t.model || '', yearManufactured: t.yearManufactured || '', driver: t.driver?._id || '', status: t.status });
    setEditId(t._id); setError(''); setShowModal(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, capacityLiters: Number(form.capacityLiters) };
      if (!payload.driver) delete payload.driver;
      if (editId) await tankerAPI.update(editId, payload);
      else await tankerAPI.create(payload);
      setShowModal(false); loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save tanker'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tanker?')) return;
    await tankerAPI.delete(id); loadData();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Tanker Fleet</h1><p>Manage water tankers, availability and driver assignments</p></div>
        {user.role === 'Admin' && <button className="btn btn-primary" onClick={openAdd}>+ Add Tanker</button>}
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Tankers', val: tankers.length, color: 'var(--accent-blue)' },
          { label: 'Available', val: tankers.filter(t => t.status === 'available').length, color: 'var(--accent-green)' },
          { label: 'On Delivery', val: tankers.filter(t => t.status === 'busy').length, color: 'var(--accent-yellow)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color }}>{val}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr><th>Vehicle No.</th><th>Capacity</th><th>Status</th><th>Driver</th><th>Location</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {tankers.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="icon">🚚</div><p>No tankers registered</p></div></td></tr>}
            {tankers.map(t => (
              <tr key={t._id}>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>{t.vehicleNumber}</span><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.model}</div></td>
                <td>{t.capacityLiters?.toLocaleString()}L</td>
                <td><span className={`badge ${statusBadge[t.status]}`}>{t.status}</span></td>
                <td>{t.driver ? <div><div style={{ fontWeight: 500 }}>{t.driver.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.driver.phone}</div></div> : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{t.currentLocation?.lat?.toFixed(4)}, {t.currentLocation?.lng?.toFixed(4)}</span></td>
                <td>
                  <div className="flex-gap gap-8">
                    {user.role === 'Admin' && <>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Del</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? 'Edit Tanker' : 'Add Tanker'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group"><label>Vehicle Number</label><input name="vehicleNumber" className="form-control" placeholder="TN01AB1234" value={form.vehicleNumber} onChange={handleChange} required /></div>
                <div className="form-group"><label>Capacity (Litres)</label><input name="capacityLiters" type="number" className="form-control" value={form.capacityLiters} onChange={handleChange} required /></div>
                <div className="form-group"><label>Model</label><input name="model" className="form-control" placeholder="Tata 407" value={form.model} onChange={handleChange} /></div>
                <div className="form-group"><label>Year</label><input name="yearManufactured" type="number" className="form-control" value={form.yearManufactured} onChange={handleChange} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Assign Driver</label>
                  <select name="driver" className="form-control" value={form.driver} onChange={handleChange}>
                    <option value="">-- Select Driver --</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.email})</option>)}
                  </select>
                </div>
                {editId && (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Status</label>
                    <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Tanker'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
