import React, { useState } from 'react';
import { compareLabourVsEquipment, formatCurrency } from '../utils/helpers';
import { FiTrendingDown } from 'react-icons/fi';
import './CostComparisonCalculator.css';

const CostComparisonCalculator = () => {
  const [formData, setFormData] = useState({
    landSize: '',
    laborWagePerWorker: '',
    numberOfWorkers: '',
    equipmentPrice: '',
    rentalDays: '',
  });

  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    const { landSize, laborWagePerWorker, numberOfWorkers, equipmentPrice, rentalDays } = formData;

    if (!landSize || !laborWagePerWorker || !numberOfWorkers || !equipmentPrice || !rentalDays) {
      alert('Please fill all fields');
      return;
    }

    const comparison = compareLabourVsEquipment(
      parseFloat(landSize),
      parseFloat(laborWagePerWorker),
      parseFloat(numberOfWorkers),
      parseFloat(equipmentPrice),
      parseFloat(rentalDays)
    );

    setResult(comparison);
  };

  const handleReset = () => {
    setFormData({
      landSize: '',
      laborWagePerWorker: '',
      numberOfWorkers: '',
      equipmentPrice: '',
      rentalDays: '',
    });
    setResult(null);
  };

  return (
    <div className="cost-comparison-calculator">
      <h2>Labor vs Equipment Cost Calculator</h2>

      <form onSubmit={handleCalculate}>
        <div className="form-group">
          <label htmlFor="landSize">Land Size (acres)</label>
          <input
            type="number"
            id="landSize"
            name="landSize"
            step="0.1"
            value={formData.landSize}
            onChange={handleInputChange}
            placeholder="Enter land size"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="laborWagePerWorker">Labor Wage per Worker (₹)</label>
          <input
            type="number"
            id="laborWagePerWorker"
            name="laborWagePerWorker"
            step="1"
            value={formData.laborWagePerWorker}
            onChange={handleInputChange}
            placeholder="Enter daily wage"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="numberOfWorkers">Number of Workers</label>
          <input
            type="number"
            id="numberOfWorkers"
            name="numberOfWorkers"
            step="1"
            value={formData.numberOfWorkers}
            onChange={handleInputChange}
            placeholder="Enter number of workers"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="equipmentPrice">Equipment Rental Price (₹/day)</label>
          <input
            type="number"
            id="equipmentPrice"
            name="equipmentPrice"
            step="1"
            value={formData.equipmentPrice}
            onChange={handleInputChange}
            placeholder="Enter rental price"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="rentalDays">Rental Days</label>
          <input
            type="number"
            id="rentalDays"
            name="rentalDays"
            step="1"
            value={formData.rentalDays}
            onChange={handleInputChange}
            placeholder="Enter rental days"
            required
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="calculate-btn">
            Calculate
          </button>
          <button type="button" className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="result-section">
          <h3>Comparison Results</h3>

          <div className="results-container">
            <div className="cost-card">
              <h4>Labor Cost</h4>
              <div className="cost-amount">{formatCurrency(result.laborCost)}</div>
              <p>For {formData.numberOfWorkers} workers</p>
            </div>

            <div className="vs-divider">VS</div>

            <div className="cost-card">
              <h4>Equipment Cost</h4>
              <div className="cost-amount">{formatCurrency(result.equipmentCost)}</div>
              <p>For {formData.rentalDays} days rental</p>
            </div>
          </div>

          <div className={`recommendation ${result.cheaper}`}>
            <FiTrendingDown size={24} />
            <div>
              <h4>{result.cheaper === 'equipment' ? 'Equipment is Cheaper! 🎉' : 'Labor is Cheaper! 🎉'}</h4>
              <p>
                Save {formatCurrency(result.savings)} ({result.percentage}%)
              </p>
              {result.estimatedTimeSaved > 0 && (
                <p>Estimated time saved: {result.estimatedTimeSaved} worker-days</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostComparisonCalculator;
