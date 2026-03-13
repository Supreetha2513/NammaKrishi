import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EquipmentCard from '../components/EquipmentCard';
import VoiceSearchInput from '../components/VoiceSearchInput';
import equipmentService from '../services/equipmentService';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const data = await equipmentService.getAllEquipment();
      setEquipment(data);

      // Extract unique categories and locations
      const uniqueCategories = [...new Set(data.map((item) => item.category))];
      const uniqueLocations = [...new Set(data.map((item) => item.location))];

      setCategories(uniqueCategories);
      setLocations(uniqueLocations);

      applyFilters(data, searchText, selectedCategory, selectedLocation, priceRange);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data = equipment, search, category, location, price) => {
    let filtered = data;

    // Filter by search text
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Filter by location
    if (location !== 'all') {
      filtered = filtered.filter((item) => item.location === location);
    }

    // Filter by price range
    filtered = filtered.filter(
      (item) => item.price_per_day >= price[0] && item.price_per_day <= price[1]
    );

    setFilteredEquipment(filtered);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(equipment, text, selectedCategory, selectedLocation, priceRange);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    applyFilters(equipment, searchText, category, selectedLocation, priceRange);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    applyFilters(equipment, searchText, selectedCategory, location, priceRange);
  };

  const handlePriceRangeChange = (e) => {
    const newPrice = parseInt(e.target.value);
    const newRange = [priceRange[0], newPrice];
    setPriceRange(newRange);
    applyFilters(equipment, searchText, selectedCategory, selectedLocation, newRange);
  };

  const handleEquipmentSelect = (equipmentItem) => {
    navigate(`/equipment/${equipmentItem.id}`, { state: { equipment: equipmentItem } });
  };

  const handleNavigateToCalculator = () => {
    navigate('/calculator');
  };

  const handleNavigateToMyBookings = () => {
    navigate('/my-bookings');
  };

  if (!user) {
    return (
      <div className="auth-prompt">
        <h1>Farm Equipment Rental</h1>
        <p>Please sign in to search and rent equipment</p>
        <button onClick={() => navigate('/login')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-content">
          <h1>Farm Equipment Rental Marketplace</h1>
          <p>Search and rent agricultural machinery easily</p>

          <div className="quick-actions">
            <button className="action-btn" onClick={handleNavigateToCalculator}>
              💰 Cost Calculator
            </button>
            <button className="action-btn" onClick={handleNavigateToMyBookings}>
              📋 My Bookings
            </button>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <VoiceSearchInput
            onSearch={handleSearch}
            language={selectedLanguage}
          />

          <div className="language-selector">
            <label htmlFor="language">Language:</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="ml">മലയാളം</option>
            </select>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="location">Location:</label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="price">Max Price: ₹{priceRange[1]}</label>
            <input
              type="range"
              id="price"
              min="0"
              max="50000"
              step="500"
              value={priceRange[1]}
              onChange={handlePriceRangeChange}
            />
          </div>
        </div>
      </div>

      <div className="results-section">
        {loading ? (
          <div className="loading">Loading equipment...</div>
        ) : filteredEquipment.length === 0 ? (
          <div className="no-results">
            <p>No equipment found matching your filters.</p>
            <p>Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="equipment-grid">
            {filteredEquipment.map((item) => (
              <EquipmentCard
                key={item.id}
                equipment={item}
                onSelect={handleEquipmentSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
