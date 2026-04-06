import { useState, useEffect } from 'react';
import { complaintAPI, villageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const priorityColor = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-orange', critical: 'badge-red' };
const statusColor = { open: 'badge-red', 'in-review': 'badge-yellow', resolved: 'badge-green', rejected: 'badge-cyan' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(null);
  const [form, setForm] = useState({ village: '', subject: '', description: '', priority: 'medium' });
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', resolutionNote: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [cRes, vRes] = await Promise.all([complaintAPI.getAll(), villageAPI.getAll()]);
      setComplaints(cRes.data);
      setVillages(vRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await complaintAPI.create(form);
      setShowModal(false);
      setForm({ village: '', subject: '', description: '', priority: 'medium' });
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to raise complaint'); }
    finally { setSaving(false); }
  };

  const handleResolve = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await complaintAPI.resolve(resolveModal._id, resolveForm);
      setResolveModal(null); loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Complaints</h1><p>Raise and manage water delivery complaints</p></div>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>+ Raise Complaint</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          ['Open', complaints.filter(c => c.status === 'open').length, 'badge-red'],
          ['In Review', complaints.filter(c => c.status === 'in-review').length, 'badge-yellow'],
          ['Resolved', complaints.filter(c => c.status === 'resolved').length, 'badge-green'],
          ['Total', complaints.length, 'badge-blue'],
        ].map(([label, count, cls]) => (
          <div key={label} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{count}</div>
            <div style={{ fontSize: '13px', marginTop: 4 }}><span className={`badge ${cls}`}>{label}</span></div>
          </div>
        ))}
      </div>

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr><th>Subject</th><th>Village</th><th>Raised By</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {complaints.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="icon">📋</div><p>No complaints raised</p></div></td></tr>}
            {complaints.map(c => (
              <tr key={c._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.subject}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{c.description.substring(0, 60)}{c.description.length > 60 ? '…' : ''}</div>
                </td>
                <td>{c.village?.name || '—'}</td>
                <td>{c.raisedBy?.name || '—'}<div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.raisedBy?.email}</div></td>
                <td><span className={`badge ${priorityColor[c.priority]}`}>{c.priority}</span></td>
                <td><span className={`badge ${statusColor[c.status]}`}>{c.status}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.role === 'Admin' && c.status !== 'resolved' && c.status !== 'rejected' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setResolveForm({ status: 'resolved', resolutionNote: '' }); setResolveModal(c); }}>Resolve</button>
                  )}
                  {c.resolvedBy && <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: 4 }}>✓ {c.resolvedBy.name}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2>Raise Complaint</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Village</label>
                <select name="village" className="form-control" value={form.village} onChange={handleChange} required>
                  <option value="">-- Select Village --</option>
                  {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Subject</label><input name="subject" className="form-control" placeholder="e.g. Tanker did not arrive on scheduled date" value={form.subject} onChange={handleChange} required /></div>
              <div className="form-group"><label>Description</label><textarea name="description" className="form-control" rows={4} placeholder="Describe the issue in detail…" value={form.description} onChange={handleChange} required /></div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit Complaint'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResolveModal(null)}>
          <div className="modal">
            <div className="modal-header"><h2>Resolve Complaint</h2><button className="modal-close" onClick={() => setResolveModal(null)}>×</button></div>
            <div className="card" style={{ padding: 16, marginBottom: 20, background: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 600 }}>{resolveModal.subject}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>{resolveModal.description}</div>
            </div>
            <form onSubmit={handleResolve}>
              <div className="form-group">
                <label>Resolution Status</label>
                <select className="form-control" value={resolveForm.status} onChange={(e) => setResolveForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="in-review">Mark In Review</option>
                  <option value="resolved">Mark Resolved</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div className="form-group"><label>Resolution Note</label><textarea className="form-control" rows={3} value={resolveForm.resolutionNote} onChange={(e) => setResolveForm(f => ({ ...f, resolutionNote: e.target.value }))} placeholder="Explain what action was taken…" /></div>
              <div className="flex-gap mt-16">
                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving…' : 'Save Resolution'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setResolveModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
