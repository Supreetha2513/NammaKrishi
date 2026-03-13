import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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

  // Calendar states
  const [selectedEquipmentForCalendar, setSelectedEquipmentForCalendar] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [showDateBlockModal, setShowDateBlockModal] = useState(false);
  const [dateRangeToBlock, setDateRangeToBlock] = useState(null);

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
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

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
    setUploadedImages([]);
    setImagePreviewUrls([]);
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
    setUploadedImages([]);
    // Show existing images if any
    if (eq.image_url) {
      setImagePreviewUrls([eq.image_url]);
    } else if (eq.image_urls && eq.image_urls.length > 0) {
      setImagePreviewUrls(eq.image_urls);
    } else {
      setImagePreviewUrls([]);
    }
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Limit to 5 images
    if (files.length + uploadedImages.length > 5) {
      alert('You can upload a maximum of 5 images');
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setUploadedImages([...uploadedImages, ...files]);
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    setUploadedImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // For now, store placeholder URLs since we don't have image upload backend yet
      // In production, you would upload images to cloud storage first
      const equipmentData = {
        ...formData,
        image_url: imagePreviewUrls[0] || '',
        image_urls: imagePreviewUrls
      };

      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, equipmentData);
      } else {
        await api.post('/equipment', equipmentData);
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

  // Calendar functions
  const fetchCalendarData = async (equipmentId) => {
    try {
      setLoadingCalendar(true);
      const response = await api.get(`/equipment/${equipmentId}/calendar`);
      setCalendarData(response.data.calendar_data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      alert('Failed to load calendar data');
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleEquipmentSelectForCalendar = (eq) => {
    setSelectedEquipmentForCalendar(eq);
    fetchCalendarData(eq.id);
  };

  const handleDateClick = (date) => {
    if (!selectedDateRange) {
      // First click - start of range
      setSelectedDateRange({ start: date, end: null });
    } else if (!selectedDateRange.end) {
      // Second click - end of range
      const start = selectedDateRange.start;
      const end = date;
      
      // Normalize the range
      const normalizedStart = end < start ? end : start;
      const normalizedEnd = end < start ? start : end;
      
      // Set the date range and show modal
      setDateRangeToBlock({ start: normalizedStart, end: normalizedEnd });
      setShowDateBlockModal(true);
      setSelectedDateRange(null);
    }
  };

  const handleBlockDates = async (shouldBlock) => {
    if (!selectedEquipmentForCalendar || !dateRangeToBlock) return;

    try {
      const requestData = {
        equipment_id: selectedEquipmentForCalendar.id,
        start_date: dateRangeToBlock.start.toISOString().split('T')[0],
        end_date: dateRangeToBlock.end.toISOString().split('T')[0]
      };

      if (shouldBlock) {
        await api.post('/equipment/blackout-dates', requestData);
      } else {
        // For DELETE, we need to send data as params or in config
        await api.delete('/equipment/blackout-dates', { data: requestData });
      }

      // Refresh calendar data
      fetchCalendarData(selectedEquipmentForCalendar.id);
      setShowDateBlockModal(false);
      setDateRangeToBlock(null);
    } catch (error) {
      console.error('Error updating dates:', error);
      alert(`Failed to ${shouldBlock ? 'block' : 'unblock'} dates: ${error.response?.data?.error || error.message}`);
    }
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== 'month' || !calendarData) return '';

    const dateStr = date.toISOString().split('T')[0];
    const classes = [];

    // Check for confirmed bookings (Layer 1 - highest priority)
    const booking = calendarData.bookings?.find(b => {
      if (!b.start_date || !b.end_date) return false;
      const start = new Date(b.start_date).toISOString().split('T')[0];
      const end = new Date(b.end_date).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });

    if (booking) {
      classes.push(booking.status === 'accepted' ? 'calendar-booked' : 'calendar-pending');
      return classes.join(' ');
    }

    // Check for blackout dates (Layer 2)
    const isBlackout = calendarData.blackout_dates?.some(bd => {
      if (!bd.date) return false;
      const blackoutDate = new Date(bd.date).toISOString().split('T')[0];
      return dateStr === blackoutDate;
    });

    if (isBlackout) {
      classes.push('calendar-blackout');
      return classes.join(' ');
    }

    // Check for dynamic pricing (Layer 3)
    const pricing = calendarData.pricing_periods?.find(p => {
      if (!p.start_date || !p.end_date) return false;
      const start = new Date(p.start_date).toISOString().split('T')[0];
      const end = new Date(p.end_date).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });

    if (pricing) {
      classes.push(pricing.price_multiplier > 1 ? 'calendar-peak-pricing' : 'calendar-off-peak');
    } else {
      classes.push('calendar-available');
    }

    return classes.join(' ');
  };

  const getTileContent = ({ date, view }) => {
    if (view !== 'month' || !calendarData) return null;

    const dateStr = date.toISOString().split('T')[0];

    // Check for bookings
    const booking = calendarData.bookings?.find(b => {
      if (!b.start_date || !b.end_date) return false;
      const start = new Date(b.start_date).toISOString().split('T')[0];
      const end = new Date(b.end_date).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });

    if (booking) {
      return (
        <div className="calendar-tile-content">
          <span className="calendar-icon">📦</span>
        </div>
      );
    }

    // Check for blackout
    const isBlackout = calendarData.blackout_dates?.some(bd => {
      if (!bd.date) return false;
      const blackoutDate = new Date(bd.date).toISOString().split('T')[0];
      return dateStr === blackoutDate;
    });

    if (isBlackout) {
      return (
        <div className="calendar-tile-content">
          <span className="calendar-icon">🚫</span>
        </div>
      );
    }

    return null;
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

      {!selectedEquipmentForCalendar ? (
        <div className="calendar-equipment-selector">
          <h3>Select Equipment to View Calendar</h3>
          <div className="equipment-grid">
            {filteredEquipment.map((eq) => (
              <div 
                key={eq.id} 
                className="equipment-card clickable"
                onClick={() => handleEquipmentSelectForCalendar(eq)}
              >
                <div className="equipment-image">
                  {eq.image_url || eq.image_urls?.[0] ? (
                    <img src={eq.image_url || eq.image_urls[0]} alt={eq.name} />
                  ) : (
                    <div className="placeholder-image">📷</div>
                  )}
                </div>
                <div className="equipment-info">
                  <h4>{eq.name}</h4>
                  <p className="equipment-category">{eq.category}</p>
                  <div className={getStatusBadgeClass(eq.availability_status)}>
                    {eq.availability_status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-selected-equipment">
            <button 
              className="back-button"
              onClick={() => {
                setSelectedEquipmentForCalendar(null);
                setCalendarData(null);
              }}
            >
              ← Back to Equipment List
            </button>
            <div className="selected-equipment-info">
              <h3>{selectedEquipmentForCalendar.name}</h3>
              <p>{selectedEquipmentForCalendar.category} • {selectedEquipmentForCalendar.location}</p>
            </div>
          </div>

          <div className="calendar-legend">
            <h4>Legend:</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color calendar-available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-color calendar-booked"></span>
                <span>Confirmed Booking</span>
              </div>
              <div className="legend-item">
                <span className="legend-color calendar-pending"></span>
                <span>Pending Booking</span>
              </div>
              <div className="legend-item">
                <span className="legend-color calendar-blackout"></span>
                <span>Blackout Date</span>
              </div>
              <div className="legend-item">
                <span className="legend-color calendar-peak-pricing"></span>
                <span>Peak Pricing</span>
              </div>
            </div>
          </div>

          <div className="calendar-instructions">
            <p>📌 <strong>How to use:</strong> Click a start date, then click an end date to block or unblock a date range</p>
          </div>

          {loadingCalendar ? (
            <div className="loading-calendar">Loading calendar...</div>
          ) : (
            <div className="react-calendar-wrapper">
              <Calendar
                onChange={handleDateClick}
                tileClassName={getTileClassName}
                tileContent={getTileContent}
                minDate={new Date()}
                showNeighboringMonth={false}
              />
            </div>
          )}

          {calendarData && (
            <div className="calendar-summary">
              <div className="summary-card">
                <h4>📦 Confirmed Bookings</h4>
                <p className="summary-count">{calendarData.bookings?.length || 0}</p>
              </div>
              <div className="summary-card">
                <h4>🚫 Blackout Dates</h4>
                <p className="summary-count">{calendarData.blackout_dates?.length || 0}</p>
              </div>
              <div className="summary-card">
                <h4>💰 Pricing Periods</h4>
                <p className="summary-count">{calendarData.pricing_periods?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
      )}
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
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      
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
                <span className="tab-number">1</span> Basic Info
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('specs')}
              >
                <span className="tab-number">2</span> Technical Specs
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('pricing')}
              >
                <span className="tab-number">3</span> Pricing
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('media')}
              >
                <span className="tab-number">4</span> Media
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
                    <label>📸 Equipment Photos (Max 5)</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="file-input"
                      />
                      <label htmlFor="image-upload" className="file-upload-label">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">Click to upload images</span>
                        <span className="upload-hint">Drag and drop or click to browse</span>
                      </label>
                    </div>
                  </div>

                  {imagePreviewUrls.length > 0 && (
                    <div className="image-gallery">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={url} alt={`Preview ${index + 1}`} />
                          <button 
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </button>
                          {index === 0 && <span className="primary-badge">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="media-note">
                    <strong>📸 Media Gallery:</strong> Upload up to 5 high-quality images of your equipment.
                    The first image will be used as the primary display image.
                  </div>
                </div>
              )}

              {/* Modal Actions - Different buttons based on active tab */}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                
                {activeModalTab === 'basic' && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setActiveModalTab('specs')}
                  >
                    Next →
                  </button>
                )}

                {activeModalTab === 'specs' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => setActiveModalTab('basic')}
                    >
                      ← Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => setActiveModalTab('pricing')}
                    >
                      Next →
                    </button>
                  </>
                )}

                {activeModalTab === 'pricing' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => setActiveModalTab('specs')}
                    >
                      ← Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => setActiveModalTab('media')}
                    >
                      Next →
                    </button>
                  </>
                )}

                {activeModalTab === 'media' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => setActiveModalTab('pricing')}
                    >
                      ← Previous
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingEquipment ? '✓ Update Equipment' : '✓ Add Equipment'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Block/Unblock Modal */}
      {showDateBlockModal && dateRangeToBlock && (
        <div className="modal-overlay" onClick={() => setShowDateBlockModal(false)}>
          <div className="modal-content date-block-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Manage Date Availability</h2>
            </div>

            <div className="date-block-modal-body">
              <div className="date-range-display">
                <div className="date-box">
                  <span className="date-label">From</span>
                  <span className="date-value">{dateRangeToBlock.start.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <div className="date-arrow">→</div>
                <div className="date-box">
                  <span className="date-label">To</span>
                  <span className="date-value">{dateRangeToBlock.end.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>

              <div className="date-block-options">
                <div className="option-card block-option">
                  <div className="option-icon">🚫</div>
                  <div className="option-content">
                    <h3>Block Dates</h3>
                    <p>Mark these dates as unavailable for bookings. Good for personal use or maintenance.</p>
                  </div>
                </div>

                <div className="option-card unblock-option">
                  <div className="option-icon">✅</div>
                  <div className="option-content">
                    <h3>Unblock Dates</h3>
                    <p>Remove any existing blackout periods and make these dates available for rent.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowDateBlockModal(false);
                  setDateRangeToBlock(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => handleBlockDates(true)}
              >
                🚫 Block Dates
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={() => handleBlockDates(false)}
              >
                ✅ Unblock Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyEquipment;
