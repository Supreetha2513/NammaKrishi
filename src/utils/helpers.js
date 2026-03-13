export const calculateTotalPrice = (pricePerDay, pricePerHour, startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Less than a day, calculate by hours
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours * pricePerHour;
  }

  return diffDays * pricePerDay;
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateLaborCost = (landSize, laborWagePerWorker, numberOfWorkers) => {
  return landSize * laborWagePerWorker * numberOfWorkers;
};

export const calculateEquipmentCost = (equipmentPrice, rentalDays) => {
  return equipmentPrice * rentalDays;
};

export const compareLabourVsEquipment = (
  landSize,
  laborWagePerWorker,
  numberOfWorkers,
  equipmentPrice,
  rentalDays
) => {
  const laborCost = calculateLaborCost(landSize, laborWagePerWorker, numberOfWorkers);
  const equipmentCost = calculateEquipmentCost(equipmentPrice, rentalDays);

  const savings = Math.abs(laborCost - equipmentCost);
  const cheaper = laborCost > equipmentCost ? 'equipment' : 'labor';
  const estimatedTimeSaved = equipmentPrice > 0 ? numberOfWorkers * rentalDays : 0;

  return {
    laborCost,
    equipmentCost,
    savings,
    cheaper,
    estimatedTimeSaved,
    percentage: ((savings / Math.max(laborCost, equipmentCost)) * 100).toFixed(2),
  };
};

export const getAvailabilityStatus = (availability_status) => {
  const statusMap = {
    available: { label: 'Available', color: '#10b981' },
    booked: { label: 'Booked', color: '#f59e0b' },
    maintenance: { label: 'Under Maintenance', color: '#ef4444' },
    unavailable: { label: 'Unavailable', color: '#6b7280' },
  };
  return statusMap[availability_status] || { label: 'Unknown', color: '#9ca3af' };
};

export const getBookingStatus = (booking_status) => {
  const statusMap = {
    pending: { label: 'Pending', color: '#f59e0b' },
    confirmed: { label: 'Confirmed', color: '#3b82f6' },
    cancelled: { label: 'Cancelled', color: '#ef4444' },
    completed: { label: 'Completed', color: '#10b981' },
  };
  return statusMap[booking_status] || { label: 'Unknown', color: '#9ca3af' };
};

export const getPaymentStatus = (payment_status) => {
  const statusMap = {
    pending: { label: 'Pending', color: '#f59e0b' },
    success: { label: 'Success', color: '#10b981' },
    failed: { label: 'Failed', color: '#ef4444' },
    refunded: { label: 'Refunded', color: '#9ca3af' },
  };
  return statusMap[payment_status] || { label: 'Unknown', color: '#9ca3af' };
};
