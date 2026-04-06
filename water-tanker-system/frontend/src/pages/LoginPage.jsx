import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      Admin: { email: 'admin@aquatrack.in', password: 'admin123' },
      Driver: { email: 'driver@aquatrack.in', password: 'driver123' },
      VillageLeader: { email: 'leader@aquatrack.in', password: 'leader123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">💧</span>
            <div>
              <h1>AquaTrack</h1>
              <p>Water Tanker Management System</p>
            </div>
          </div>
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Manage water delivery across drought-prone districts</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <div className="demo-btns">
            <span className="demo-label">Demo Login:</span>
            {['Admin', 'Driver', 'VillageLeader'].map(r => (
              <button key={r} className="btn btn-secondary btn-sm" onClick={() => fillDemo(r)}>{r}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" className="form-control" placeholder="••••••••"
                value={form.password} onChange={handleChange} required />
            </div>
            <button className="btn btn-primary auth-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
