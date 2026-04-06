import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡', roles: ['Admin', 'Driver', 'VillageLeader'] },
  { path: '/villages', label: 'Villages', icon: '◈', roles: ['Admin', 'VillageLeader'] },
  { path: '/tankers', label: 'Tankers', icon: '⬟', roles: ['Admin', 'Driver'] },
  { path: '/deliveries', label: 'Deliveries', icon: '◉', roles: ['Admin', 'Driver', 'VillageLeader'] },
  { path: '/complaints', label: 'Complaints', icon: '◎', roles: ['Admin', 'Driver', 'VillageLeader'] },
  { path: '/tracking', label: 'Live Tracking', icon: '⊕', roles: ['Admin', 'Driver', 'VillageLeader'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const filtered = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">💧</div>
        <div>
          <div className="brand-name">AquaTrack</div>
          <div className="brand-sub">Water Management</div>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>
      <nav className="sidebar-nav">
        {filtered.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
};

export default Sidebar;
