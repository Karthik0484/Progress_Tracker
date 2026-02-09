import React, { useMemo, useState } from 'react';
import { TIMETABLE } from '../data/timetable';
import TimeBlock from '../components/TimeBlock';
import { getDayName, getTodayKey } from '../utils/storage';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetable = () => {
    const todayName = getDayName(getTodayKey());
    const [expandedDays, setExpandedDays] = useState({ [todayName]: true });

    const toggleDay = (day) => {
        setExpandedDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    };

    // Reorder days so today is first
    const orderedDays = useMemo(() => {
        const todayIndex = days.indexOf(todayName);
        if (todayIndex === -1) return days;

        return [
            ...days.slice(todayIndex),
            ...days.slice(0, todayIndex)
        ];
    }, [todayName]);

    return (
        <div className="timetable-container">
            {orderedDays.map((day) => {
                const isToday = day === todayName;
                const isExpanded = expandedDays[day];

                return (
                    <div
                        key={day}
                        className={`card timetable-card ${isExpanded ? 'expanded' : 'collapsed'}`}
                        style={isToday ? { border: '2px solid var(--primary)', position: 'relative' } : {}}
                    >
                        <div
                            className="timetable-header"
                            onClick={() => toggleDay(day)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ marginBottom: 0, fontSize: '1.25rem' }}>{day}</h2>
                                {isToday && (
                                    <span style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold'
                                    }}>
                                        TODAY
                                    </span>
                                )}
                            </div>
                            <span style={{
                                fontSize: '1.2rem',
                                color: 'var(--secondary)',
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'
                            }}>
                                ▾
                            </span>
                        </div>

                        {isExpanded && (
                            <div className="timetable-content" style={{ marginTop: '1.5rem' }}>
                                {TIMETABLE[day] ? (
                                    TIMETABLE[day].map((block, i) => (
                                        <TimeBlock
                                            key={i}
                                            start={block.start}
                                            end={block.end}
                                            subject={block.subject}
                                            completed={false}
                                            readOnly={true}
                                        />
                                    ))
                                ) : (
                                    <p style={{ color: '#64748B', fontStyle: 'italic' }}>Rest Day</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            <style>{`
                @media (max-width: 768px) {
                    .timetable-header h2 {
                        font-size: 1.1rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Timetable;
