import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './BookingCalendar.css';

const BookingCalendar = ({ onSelectDates, minDate = new Date(), blockedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const isDateBlocked = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return blockedDates.some(
      (blockedDate) => new Date(blockedDate).toDateString() === date.toDateString()
    );
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (clickedDate < minDate) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (clickedDate < startDate) {
      setStartDate(clickedDate);
    } else {
      setEndDate(clickedDate);
      if (onSelectDates) {
        onSelectDates(startDate, clickedDate);
      }
    }
  };

  const isDateInRange = (day) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > startDate && date < endDate;
  };

  const isDateSelected = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      (startDate && startDate.toDateString() === date.toDateString()) ||
      (endDate && endDate.toDateString() === date.toDateString())
    );
  };

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="nav-btn">
          <FiChevronLeft />
        </button>
        <h3>{monthName}</h3>
        <button onClick={handleNextMonth} className="nav-btn">
          <FiChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, index) => {
          const isValidDate = day && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) >= minDate;
          const inRange = day && isDateInRange(day);
          const selected = day && isDateSelected(day);

          return (
            <button
              key={index}
              className={`calendar-day ${inRange ? 'in-range' : ''} ${selected ? 'selected' : ''}`}
              onClick={() => day && isValidDate && handleDateClick(day)}
              disabled={!day || !isValidDate || isDateBlocked(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {startDate && endDate && (
        <div className="date-range-display">
          <p>
            <strong>Selected Period:</strong>
          </p>
          <p>
            {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
