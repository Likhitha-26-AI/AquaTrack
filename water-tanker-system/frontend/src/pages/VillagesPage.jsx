import { useState, useEffect } from 'react';
import { villageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', district: '', population: '', location: { lat: '', lng: '' }, avgDailyConsumptionLiters: 5, contactPerson: '', contactPhone: '' };

export default function VillagesPage() {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [demandModal, setDemandModal] = useState(null);
  const { user } = useAuth();

  useEffect(() => { loadVillages(); }, []);

  const loadVillages = async () => {
    try {
      const res = await villageAPI.getAll();
      setVillages(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (v) => {
    setForm({ ...v, location: { lat: v.location.lat, lng: v.location.lng } });
    setEditId(v._id); setError(''); setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') setForm(f => ({ ...f, location: { ...f.location, [name]: value } }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, population: Number(form.population), location: { lat: Number(form.location.lat), lng: Number(form.location.lng) } };
      if (editId) await villageAPI.update(editId, payload);
      else await villageAPI.create(payload);
      setShowModal(false); loadVillages();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save village'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this village?')) return;
    await villageAPI.delete(id); loadVillages();
  };

  const showDemand = async (id) => {
    try { const res = await villageAPI.getDemand(id); setDemandModal(res.data); }
    catch (e) { alert('Could not load demand data'); }
  };

  const priorityColor = { CRITICAL: 'red', HIGH: 'orange', MEDIUM: 'yellow', LOW: 'green' };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Village Management</h1><p>Monitor and manage all registered drought-affected villages</p></div>
        {user.role === 'Admin' && <button className="btn btn-primary" onClick={openAdd}>+ Add Village</button>}
      </div>

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr>
              <th>Village</th><th>District</th><th>Population</th>
              <th>Demand Score</th><th>Status</th><th>Last Delivery</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {villages.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="icon">🏘</div><p>No villages registered</p></div></td></tr>}
            {villages.map(v => (
              <tr key={v._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.location.lat.toFixed(4)}, {v.location.lng.toFixed(4)}</div>
                </td>
                <td>{v.district}</td>
                <td>{v.population.toLocaleString()}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>{Math.round(v.demandScore).toLocaleString()}L</span></td>
                <td>{v.isShortage ? <span className="badge badge-red">Shortage</span> : <span className="badge badge-green">Normal</span>}</td>
                <td>{v.lastDeliveryDate ? new Date(v.lastDeliveryDate).toLocaleDateString() : <span style={{ color: 'var(--text-muted)' }}>Never</span>}</td>
                <td>
                  <div className="flex-gap gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => showDemand(v._id)}>📊</button>
                    {user.role === 'Admin' && <>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v._id)}>Del</button>
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
              <h2>{editId ? 'Edit Village' : 'Add Village'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group"><label>Village Name</label><input name="name" className="form-control" value={form.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>District</label><input name="district" className="form-control" value={form.district} onChange={handleChange} required /></div>
                <div className="form-group"><label>Population</label><input name="population" type="number" className="form-control" value={form.population} onChange={handleChange} required /></div>
                <div className="form-group"><label>Avg Consumption (L/person/day)</label><input name="avgDailyConsumptionLiters" type="number" className="form-control" value={form.avgDailyConsumptionLiters} onChange={handleChange} /></div>
                <div className="form-group"><label>Latitude</label><input name="lat" type="number" step="any" className="form-control" value={form.location.lat} onChange={handleChange} required /></div>
                <div className="form-group"><label>Longitude</label><input name="lng" type="number" step="any" className="form-control" value={form.location.lng} onChange={handleChange} required /></div>
                <div className="form-group"><label>Contact Person</label><input name="contactPerson" className="form-control" value={form.contactPerson} onChange={handleChange} /></div>
                <div className="form-group"><label>Contact Phone</label><input name="contactPhone" className="form-control" value={form.contactPhone} onChange={handleChange} /></div>
              </div>
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Village'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {demandModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDemandModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Demand Analysis — {demandModal.village}</h2>
              <button className="modal-close" onClick={() => setDemandModal(null)}>×</button>
            </div>
            <div className="grid-2">
              {[
                ['Population', demandModal.population?.toLocaleString()],
                ['Daily Need', `${demandModal.dailyNeed?.toLocaleString()}L`],
                ['Last Delivered', `${demandModal.lastDelivered?.toLocaleString()}L`],
                ['Demand Score', `${Math.round(demandModal.demandScore).toLocaleString()}L`],
              ].map(([k, v]) => (
                <div key={k} className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{k}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', marginTop: '6px' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-16">
              <span className={`badge badge-${priorityColor[demandModal.priority]}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
                Priority: {demandModal.priority}
              </span>
              {demandModal.isShortage && <span className="badge badge-red" style={{ marginLeft: 10, fontSize: '14px', padding: '6px 16px' }}>⚠ SHORTAGE</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
