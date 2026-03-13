import React from 'react';
import { formatCurrency, getAvailabilityStatus } from '../utils/helpers';
import { FiMapPin, FiClock } from 'react-icons/fi';
import './EquipmentCard.css';

const EquipmentCard = ({ equipment, onSelect }) => {
  const availabilityInfo = getAvailabilityStatus(equipment.availability_status);

  return (
    <div className="equipment-card">
      <div className="equipment-card-image">
        <img
          src={equipment.image_url || '/placeholder-equipment.jpg'}
          alt={equipment.name}
          onError={(e) => {
            e.target.src = '/placeholder-equipment.jpg';
          }}
        />
        <span
          className="availability-badge"
          style={{ backgroundColor: availabilityInfo.color }}
        >
          {availabilityInfo.label}
        </span>
      </div>

      <div className="equipment-card-content">
        <h3>{equipment.name}</h3>
        <p className="category">{equipment.category}</p>

        <p className="description">{equipment.description.substring(0, 100)}...</p>

        <div className="info-row">
          <FiMapPin size={16} />
          <span>{equipment.location}</span>
        </div>

        <div className="pricing-row">
          <div className="price">
            <span className="label">Per Day</span>
            <span className="amount">{formatCurrency(equipment.price_per_day)}</span>
          </div>
          <div className="price">
            <span className="label">Per Hour</span>
            <span className="amount">{formatCurrency(equipment.price_per_hour)}</span>
          </div>
        </div>

        <button
          className="select-btn"
          onClick={() => onSelect(equipment)}
          disabled={equipment.availability_status !== 'available'}
        >
          {equipment.availability_status === 'available' ? 'Select' : 'Not Available'}
        </button>
      </div>
    </div>
  );
};

export default EquipmentCard;
