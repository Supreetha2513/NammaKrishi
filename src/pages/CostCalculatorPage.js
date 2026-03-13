import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CostComparisonCalculator from '../components/CostComparisonCalculator';
import { useAuth } from '../hooks/useAuth';
import { FiArrowLeft } from 'react-icons/fi';
import './CostCalculatorPage.css';

const CostCalculatorPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="auth-prompt">
        <h1>Cost Calculator</h1>
        <p>Please sign in to use the cost calculator</p>
        <button onClick={() => navigate('/login')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="cost-calculator-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft size={24} />
        Back
      </button>

      <div className="page-header">
        <h1>Labor vs Equipment Cost Calculator</h1>
        <p>Calculate and compare the cost of labor versus equipment rental</p>
      </div>

      <CostComparisonCalculator />
    </div>
  );
};

export default CostCalculatorPage;
