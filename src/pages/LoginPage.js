import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMail, FiLock } from 'react-icons/fi';
import './AuthPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🌾 Farm Equipment Rental</h1>
          <p>Sign in to manage your equipment rentals</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <FiMail size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock size={20} />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <div className="side-content">
          <h2>Welcome Back!</h2>
          <p>Manage your equipment rentals, track your bookings, and get notifications about available equipment.</p>
          <div className="features">
            <div className="feature">
              <span className="icon">📱</span>
              <p>Easy booking management</p>
            </div>
            <div className="feature">
              <span className="icon">🔔</span>
              <p>Instant notifications</p>
            </div>
            <div className="feature">
              <span className="icon">💰</span>
              <p>Secure payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
