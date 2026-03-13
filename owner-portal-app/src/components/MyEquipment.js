import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';
import './MyEquipment.css';

function MyEquipment() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [currentTab, setCurrentTab] = useState('list'); // list, calendar, maintenance
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price_per_hour: '',
    price_per_day: '',
    location: '',
    image_url: '',
    image_urls: [],
    horsepower: '',
    fuel_type: '',
    year_of_manufacture: '',
    model_number: '',
    gps_location: '',
    status: 'available'
  });

  const [activeModalTab, setActiveModalTab] = useState('basic'); // basic, specs, pricing, media

  const categories = ['Tractor', 'Harvester', 'Plough', 'Seed Drill', 'Sprayer', 'Rotavator', 'Thresher', 'Other'];
  const fuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid'];

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterCategory, filterStatus, filterVerification, equipment]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await api.get('/equipment');
      setEquipment(response.data.equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...equipment];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(eq =>
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(eq => eq.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(eq => eq.availability_status === filterStatus);
    }

    // Verification filter
    if (filterVerification !== 'all') {
      filtered = filtered.filter(eq => eq.verification_status === filterVerification);
    }

    setFilteredEquipment(filtered);
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      price_per_hour: '',
      price_per_day: '',
      location: '',
      image_url: '',
      image_urls: [],
      horsepower: '',
      fuel_type: '',
      year_of_manufacture: '',
      model_number: '',
      gps_location: '',
      status: 'available'
    });
    setEditingEquipment(null);
    setActiveModalTab('basic');
    setShowModal(true);
  };

  const openEditModal = (eq) => {
    setFormData({
      name: eq.name,
      category: eq.category,
      description: eq.description || '',
      price_per_hour: eq.price_per_hour,
      price_per_day: eq.price_per_day,
      location: eq.location,
      image_url: eq.image_url || '',
      image_urls: eq.image_urls || [],
      horsepower: eq.horsepower || '',
      fuel_type: eq.fuel_type || '',
      year_of_manufacture: eq.year_of_manufacture || '',
      model_number: eq.model_number || '',
      gps_location: eq.gps_location || '',
      status: eq.availability_status || 'available'
    });
    setEditingEquipment(eq);
    setActiveModalTab('basic');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, formData);
      } else {
        await api.post('/equipment', formData);
      }
      
      setShowModal(false);
      fetchEquipment();
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Failed to save equipment. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/equipment/${id}`);
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert(error.response?.data?.error || 'Failed to delete equipment');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    
    try {
      await api.patch(`/equipment/${id}/availability`, { 
        availability_status: newStatus 
      });
      fetchEquipment();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'available': return 'status-badge available';
      case 'rented': return 'status-badge rented';
      case 'unavailable': return 'status-badge unavailable';
      default: return 'status-badge';
    }
  };

  const getVerificationBadgeClass = (status) => {
    switch (status) {
      case 'verified': return 'verification-badge verified';
      case 'pending': return 'verification-badge pending';
      case 'rejected': return 'verification-badge rejected';
      default: return 'verification-badge pending';
    }
  };

  const renderListView = () => (
    <div className="equipment-grid">
      {filteredEquipment.map((eq) => (
        <div key={eq.id} className="equipment-card">
          <div className="equipment-image">
            {eq.image_url ? (
              <img src={eq.image_url} alt={eq.name} />
            ) : (
              <div className="no-image">🚜</div>
            )}
            {eq.verification_status === 'verified' && (
              <div className="verified-badge">✓ Verified</div>
            )}
          </div>

          <div className="equipment-info">
            <div className="equipment-header">
              <h3>{eq.name}</h3>
              <span className={getVerificationBadgeClass(eq.verification_status)}>
                {eq.verification_status}
              </span>
            </div>

            <div className="equipment-category">{eq.category}</div>
            <div className="equipment-location">📍 {eq.location}</div>

            <div className="equipment-metrics">
              <div className="metric">
                <span className="metric-label">Times Rented</span>
                <span className="metric-value">{eq.analytics?.times_rented || 0}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Total Revenue</span>
                <span className="metric-value">₹{eq.analytics?.total_revenue || 0}</span>
              </div>
              <div className="metric">
                <span className="metric-label">SMS Alerts</span>
                <span className="metric-value">{eq.analytics?.sms_alert_count || 0}</span>
              </div>
            </div>

            <div className="equipment-pricing">
              <div>
                <span className="price-label">Per Hour</span>
                <span className="price">₹{eq.price_per_hour}</span>
              </div>
              <div>
                <span className="price-label">Per Day</span>
                <span className="price">₹{eq.price_per_day}</span>
              </div>
            </div>

            <div className={getStatusBadgeClass(eq.availability_status)}>
              {eq.availability_status}
            </div>

            <div className="equipment-actions">
              <button 
                className="btn btn-toggle"
                onClick={() => toggleAvailability(eq.id, eq.availability_status)}
              >
                {eq.availability_status === 'available' ? '⏸ Deactivate' : '▶ Activate'}
              </button>
              <button className="btn btn-edit" onClick={() => openEditModal(eq)}>
                ✏️ Edit
              </button>
              <button className="btn btn-delete" onClick={() => handleDelete(eq.id)}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalendarView = () => (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>📅 Availability Calendar</h2>
        <p>Manage booking schedules and blackout dates for your equipment</p>
      </div>
      <div className="calendar-placeholder">
        <div className="placeholder-icon">📆</div>
        <h3>Calendar Feature Coming Soon</h3>
        <p>Interactive calendar to manage equipment availability, confirmed bookings, and blackout dates</p>
        <ul className="feature-list">
          <li>✓ View confirmed bookings</li>
          <li>✓ Set blackout dates for personal use</li>
          <li>✓ Prevent double-bookings</li>
          <li>✓ Seasonal demand highlights</li>
        </ul>
      </div>
    </div>
  );

  const renderMaintenanceView = () => (
    <div className="maintenance-view">
      <div className="maintenance-header">
        <h2>🔧 Maintenance Tracker</h2>
        <p>Keep your equipment in top condition with service logs and reminders</p>
      </div>
      <div className="maintenance-grid">
        {filteredEquipment.map((eq) => (
          <div key={eq.id} className="maintenance-card">
            <div className="maintenance-card-header">
              <h4>{eq.name}</h4>
              <span className="category-tag">{eq.category}</span>
            </div>
            {eq.last_maintenance ? (
              <div className="maintenance-info">
                <div className="service-log">
                  <strong>Last Service:</strong> {eq.last_maintenance.service_type}
                  <div className="service-date">
                    {new Date(eq.last_maintenance.service_date).toLocaleDateString()}
                  </div>
                </div>
                {eq.last_maintenance.next_service_due && (
                  <div className="next-service">
                    <strong>Next Service Due:</strong>
                    <div className="due-date">
                      {new Date(eq.last_maintenance.next_service_due).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-maintenance">
                <p>No maintenance records yet</p>
              </div>
            )}
            <button className="btn btn-add-log">+ Add Service Log</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      
      <div className="main-content">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
          <h1>My Equipment</h1>
          <button className="btn btn-ai" onClick={() => navigate('/ai-assistant')}>
            🤖 AI Listing Assistant
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Equipment
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)}>
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* View Tabs */}
        <div className="view-tabs">
          <button 
            className={`tab-btn ${currentTab === 'list' ? 'active' : ''}`}
            onClick={() => setCurrentTab('list')}
          >
            📋 List View
          </button>
          <button 
            className={`tab-btn ${currentTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentTab('calendar')}
          >
            📅 Calendar
          </button>
          <button 
            className={`tab-btn ${currentTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setCurrentTab('maintenance')}
          >
            🔧 Maintenance
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading">Loading equipment...</div>
        ) : filteredEquipment.length === 0 && currentTab === 'list' ? (
          <div className="empty-state">
            <div className="empty-icon">🚜</div>
            <h3>No equipment found</h3>
            <p>Start by adding your first piece of farm equipment</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add Your First Equipment
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'list' && renderListView()}
            {currentTab === 'calendar' && renderCalendarView()}
            {currentTab === 'maintenance' && renderMaintenanceView()}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            {/* Modal Tabs */}
            <div className="modal-tabs">
              <button 
                className={`modal-tab ${activeModalTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('basic')}
              >
                Basic Info
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('specs')}
              >
                Technical Specs
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('pricing')}
              >
                Pricing
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('media')}
              >
                Media
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info Tab */}
              {activeModalTab === 'basic' && (
                <div className="modal-tab-content">
                  <div className="form-group">
                    <label>Equipment Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., John Deere 5050D Tractor"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your equipment, its condition, and any special features..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Mandya, Karnataka"
                    />
                  </div>

                  <div className="form-group">
                    <label>GPS Location (Optional)</label>
                    <input
                      type="text"
                      value={formData.gps_location}
                      onChange={(e) => setFormData({ ...formData, gps_location: e.target.value })}
                      placeholder="e.g., 12.5266,76.8951"
                    />
                    <small className="form-hint">Latitude, Longitude format for map integration</small>
                  </div>
                </div>
              )}

              {/* Technical Specs Tab */}
              {activeModalTab === 'specs' && (
                <div className="modal-tab-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Horsepower (HP)</label>
                      <input
                        type="number"
                        value={formData.horsepower}
                        onChange={(e) => setFormData({ ...formData, horsepower: e.target.value })}
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div className="form-group">
                      <label>Fuel Type</label>
                      <select
                        value={formData.fuel_type}
                        onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                      >
                        <option value="">Select Fuel Type</option>
                        {fuelTypes.map(fuel => (
                          <option key={fuel} value={fuel}>{fuel}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Year of Manufacture</label>
                      <input
                        type="number"
                        value={formData.year_of_manufacture}
                        onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
                        placeholder="e.g., 2020"
                        min="1950"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div className="form-group">
                      <label>Model Number</label>
                      <input
                        type="text"
                        value={formData.model_number}
                        onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                        placeholder="e.g., 5050D"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeModalTab === 'pricing' && (
                <div className="modal-tab-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price per Hour (₹) *</label>
                      <input
                        type="number"
                        required
                        value={formData.price_per_hour}
                        onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                        placeholder="e.g., 500"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Price per Day (₹) *</label>
                      <input
                        type="number"
                        required
                        value={formData.price_per_day}
                        onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                        placeholder="e.g., 3000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="pricing-note">
                    <strong>💡 Dynamic Pricing:</strong> Enable smart pricing during peak seasons to maximize earnings.
                    Set up dynamic pricing rules after creating the equipment listing.
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeModalTab === 'media' && (
                <div className="modal-tab-content">
                  <div className="form-group">
                    <label>Primary Image URL</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="image-preview">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" />
                    ) : (
                      <div className="no-preview">No image to preview</div>
                    )}
                  </div>

                  <div className="media-note">
                    <strong>📸 Media Gallery:</strong> File upload functionality will be added soon.
                    For now, use image URLs from hosting services.
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyEquipment;
