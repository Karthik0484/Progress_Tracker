import React, { useState } from 'react';
import Modal from './Modal';
import { getDayName } from '../utils/storage';

const Calendar = ({ dailyDataMap, getDayStats, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // 0 = Sunday, 1 = Monday. JS getDay(): 0=Sun. 
    // We want Mon-Sun or Sun-Sat? "fixed weekly timetable (Monday–Sunday)" usually implies Mon start.
    // Let's standard JS Sun(0) - Sat(6) for now, standard calendar.
    const startDayOffset = firstDayOfMonth.getDay();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const days = [];
    // Empty slots for start
    for (let i = 0; i < startDayOffset; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        // Construct YYYY-MM-DD
        // Ensure padded 0
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateKey = `${year}-${mStr}-${dStr}`;

        // Check if future
        const cellDate = new Date(year, month, d);
        const isFuture = cellDate > today;
        const isToday = isCurrentMonth && d === todayDate;

        // Get Stats
        // We use getDayStats which accesses the TIMETABLE and the dailyData
        // Only if not future.
        let colorClass = 'cell-grey';
        let stats = null;

        if (!isFuture) {
            stats = getDayStats(dateKey);
            // Default grey if no data tracked (0%) BUT also check if it was a rest day? 
            // If totalHours > 0, we can color. If totalHours == 0 (Rest day), maybe grey or specific?
            // "Grey/empty: no data or future dates". 
            // If user didn't open app, dailyData might be missing.

            if (dailyDataMap[dateKey] && stats.totalHours > 0) {
                if (stats.percent >= 80) colorClass = 'cell-green';
                else if (stats.percent >= 30) colorClass = 'cell-yellow';
                else colorClass = 'cell-red';
            } else if (stats.totalHours === 0) {
                colorClass = 'cell-grey'; // Rest day
            } else {
                colorClass = 'cell-grey'; // No data
            }
        } else {
            colorClass = 'future';
        }

        days.push(
            <div
                key={dateKey}
                className={`calendar-cell ${colorClass} ${isToday ? 'cell-today' : ''}`}
                onClick={() => !isFuture && onDateClick(dateKey)}
            >
                {d}
            </div>
        );
    }

    return (
        <div className="calendar-wrapper">
            <div className="calendar-nav">
                <button className="nav-btn prev" onClick={() => changeMonth(-1)}>← Prev</button>
                <h3>{monthName} {year}</h3>
                <button className="nav-btn next" onClick={() => changeMonth(1)} disabled={isCurrentMonth && month === today.getMonth()}>Next →</button>
            </div>

            <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="calendar-cell header">{d}</div>
                ))}
                {days}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748B' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: '#16A34A' }}></div> ≥80%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: '#EAB308' }}></div> 30-79%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: '#EF4444' }}></div> &lt;30%</span>
            </div>
        </div>
    );
};

export default Calendar;
