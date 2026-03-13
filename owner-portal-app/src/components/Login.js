import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.register({
        ...formData,
        role,
        language_preference: 'en'
      });

      showMessage('Registration successful! Redirecting...', 'success');
      
      setTimeout(() => {
        if (role === 'owner') {
 navigate('/dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      }, 1500);
    } catch (error) {
      showMessage(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(formData.email, formData.password);

      if (data.user.role !== role) {
        throw new Error(`This account is registered as a ${data.user.role}, not a ${role}`);
      }

      showMessage('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        if (data.user.role === 'owner') {
          navigate('/dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      }, 1500);
    } catch (error) {
      showMessage(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-box">
        <div className="logo">
          <h1>🌾 NammaKrishi</h1>
          <p>Farm Equipment Rental Marketplace</p>
        </div>

        <div className="form-container">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>

          <div className="role-selector">
            <label>
              <input
                type="radio"
                name="role"
                value="customer"
                checked={role === 'customer'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span className="role-btn">Customer</span>
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="owner"
                checked={role === 'owner'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span className="role-btn">Owner</span>
            </label>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            {isRegister && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone (10 digits)"
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder={isRegister ? 'Create a password (min 6 characters)' : 'Enter your password'}
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
            </button>
          </form>

          <p className="switch-form">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); }}>
              {isRegister ? 'Login here' : 'Register here'}
            </a>
          </p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
