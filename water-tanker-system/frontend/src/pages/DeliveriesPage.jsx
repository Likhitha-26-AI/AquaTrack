import { useState, useEffect } from 'react';
import { deliveryAPI, villageAPI, tankerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { pending: 'badge-yellow', 'in-progress': 'badge-cyan', completed: 'badge-green', cancelled: 'badge-red' };
const EMPTY_FORM = { tanker: '', village: '', scheduledDate: '', scheduledTime: '', quantityScheduledLiters: '', notes: '' };

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [villages, setVillages] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusForm, setStatusForm] = useState({ status: '', quantityDeliveredLiters: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => { loadAll(); }, [filterStatus]);

  const loadAll = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [dRes, vRes, tRes] = await Promise.all([
        deliveryAPI.getAll(params),
        villageAPI.getAll(),
        tankerAPI.getAvailable(),
      ]);
      setDeliveries(dRes.data);
      setVillages(vRes.data);
      setTankers(tRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await deliveryAPI.schedule({ ...form, quantityScheduledLiters: Number(form.quantityScheduledLiters) });
      setShowModal(false); setForm(EMPTY_FORM); loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Scheduling failed'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await deliveryAPI.updateStatus(statusModal._id, {
        status: statusForm.status,
        quantityDeliveredLiters: statusForm.quantityDeliveredLiters ? Number(statusForm.quantityDeliveredLiters) : undefined,
      });
      setStatusModal(null); loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Delivery Schedule</h1><p>Plan, track and complete water deliveries to villages</p></div>
        {user.role === 'Admin' && <button className="btn btn-primary" onClick={() => { setError(''); setForm(EMPTY_FORM); setShowModal(true); }}>+ Schedule Delivery</button>}
      </div>

      <div className="flex-gap mb-24" style={{ flexWrap: 'wrap' }}>
        {['', 'pending', 'in-progress', 'completed', 'cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr><th>Village</th><th>Tanker</th><th>Driver</th><th>Scheduled</th><th>Qty (L)</th><th>Status</th><th>Delayed?</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="icon">📅</div><p>No deliveries found</p></div></td></tr>}
            {deliveries.map(d => (
              <tr key={d._id}>
                <td><span style={{ fontWeight: 600 }}>{d.village?.name}</span><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.village?.district}</div></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>{d.tanker?.vehicleNumber}</span></td>
                <td>{d.driver?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>
                  <div>{new Date(d.scheduledDate).toLocaleDateString()}</div>
                  {d.scheduledTime && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.scheduledTime}</div>}
                </td>
                <td>{d.quantityScheduledLiters?.toLocaleString()}{d.status === 'completed' && <div style={{ fontSize: '11px', color: 'var(--accent-green)' }}>✓ {d.quantityDeliveredLiters?.toLocaleString()}</div>}</td>
                <td><span className={`badge ${statusColor[d.status]}`}>{d.status}</span></td>
                <td>{d.isDelayed ? <span className="badge badge-red">⚠ Delayed</span> : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}</td>
                <td>
                  {(user.role === 'Admin' || user.role === 'Driver') && d.status !== 'completed' && d.status !== 'cancelled' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setStatusForm({ status: d.status, quantityDeliveredLiters: '' }); setStatusModal(d); }}>Update</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2>Schedule Delivery</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Village</label>
                <select name="village" className="form-control" value={form.village} onChange={handleChange} required>
                  <option value="">-- Select Village --</option>
                  {villages.map(v => <option key={v._id} value={v._id}>{v.name} — {v.district} (Score: {Math.round(v.demandScore)}L)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Available Tanker</label>
                <select name="tanker" className="form-control" value={form.tanker} onChange={handleChange} required>
                  <option value="">-- Select Tanker --</option>
                  {tankers.map(t => <option key={t._id} value={t._id}>{t.vehicleNumber} — {t.capacityLiters}L {t.driver ? `(Driver: ${t.driver.name})` : '(No Driver)'}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Scheduled Date</label><input name="scheduledDate" type="date" className="form-control" value={form.scheduledDate} onChange={handleChange} required /></div>
                <div className="form-group"><label>Scheduled Time</label><input name="scheduledTime" type="time" className="form-control" value={form.scheduledTime} onChange={handleChange} /></div>
              </div>
              <div className="form-group"><label>Quantity (Litres)</label><input name="quantityScheduledLiters" type="number" className="form-control" value={form.quantityScheduledLiters} onChange={handleChange} required /></div>
              <div className="form-group"><label>Notes</label><textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} /></div>
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling…' : 'Schedule'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setStatusModal(null)}>
          <div className="modal">
            <div className="modal-header"><h2>Update Delivery Status</h2><button className="modal-close" onClick={() => setStatusModal(null)}>×</button></div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              {statusModal.village?.name} — {statusModal.tanker?.vehicleNumber}
            </div>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>New Status</label>
                <select name="status" className="form-control" value={statusForm.status} onChange={(e) => setStatusForm(f => ({ ...f, status: e.target.value }))} required>
                  <option value="">-- Select --</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {statusForm.status === 'completed' && (
                <div className="form-group">
                  <label>Actual Quantity Delivered (L)</label>
                  <input type="number" className="form-control" value={statusForm.quantityDeliveredLiters} onChange={(e) => setStatusForm(f => ({ ...f, quantityDeliveredLiters: e.target.value }))} placeholder={statusModal.quantityScheduledLiters} />
                </div>
              )}
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Updating…' : 'Update'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
