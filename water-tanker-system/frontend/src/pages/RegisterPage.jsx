import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VillageLeader', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the water management network</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" className="form-control" placeholder="Ravi Kumar" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" className="form-control" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="VillageLeader">Village Leader</option>
                <option value="Driver">Driver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <button className="btn btn-primary auth-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account →'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
