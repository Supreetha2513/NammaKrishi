import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMenu, FiX, FiLogOut, FiHome } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          🌾 NammaKrishi
        </div>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <button className="nav-link" onClick={() => navigate('/')}>
            <FiHome size={20} />
            Search
          </button>

          {user && (
            <>
              <button
                className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}
                onClick={() => navigate('/my-bookings')}
              >
                My Bookings
              </button>
              <button
                className={`nav-link ${isActive('/calculator') ? 'active' : ''}`}
                onClick={() => navigate('/calculator')}
              >
                Cost Calculator
              </button>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="user-name">{user.displayName || user.email}</span>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <FiLogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                className="auth-btn secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button
                className="auth-btn primary"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
