import React, { useState, useMemo } from 'react';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';
import { TIMETABLE } from '../data/timetable';
import { getDayName } from '../utils/storage';
import { formatTimeRange } from '../utils/format';

const Progress = ({ data, updateWeakAreas, getDayStats, todayKey, onNavigateToToday }) => {
    const [newArea, setNewArea] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const subjectHours = {};
        let totalLeetCode = 0;
        let totalStudyHours = 0;

        Object.entries(data.dailyProgress).forEach(([dateStr, dayData]) => {
            if (dayData.leetcode) totalLeetCode++;

            const dayName = getDayName(dateStr);
            const schedule = TIMETABLE[dayName] || [];

            dayData.completedBlocks.forEach(blockIndex => {
                const block = schedule[blockIndex];
                if (block) {
                    const s = block.start.split(':').map(Number);
                    const e = block.end.split(':').map(Number);
                    const duration = (e[0] + e[1] / 60) - (s[0] + s[1] / 60);

                    let subject = dayData.overriddenSubjects?.[blockIndex] || block.subject;
                    if (subject.includes('(')) subject = subject.split('(')[0].trim();
                    if (subject.includes(':')) subject = subject.split(':')[0].trim();

                    subjectHours[subject] = (subjectHours[subject] || 0) + duration;
                    totalStudyHours += duration;
                }
            });
        });

        return { subjectHours, totalLeetCode, totalStudyHours };
    }, [data.dailyProgress]);

    const maxHours = Math.max(...Object.values(stats.subjectHours), 1);

    // --- Weak Area Handlers ---
    const handleAddWeakArea = (e) => {
        e.preventDefault();
        if (!newArea.trim()) return;
        const current = data.weakAreas || [];
        updateWeakAreas([...current, newArea.trim()].join('\n'));
        setNewArea('');
    };

    const handleRemoveWeakArea = (index) => {
        const current = data.weakAreas || [];
        const updated = current.filter((_, i) => i !== index);
        updateWeakAreas(updated.join('\n'));
    };

    // --- Calendar Handlers ---
    const handleDateClick = (dateKey) => {
        if (dateKey === todayKey) {
            onNavigateToToday();
        } else {
            setSelectedDate(dateKey);
        }
    };

    // --- Modal Data Helper ---
    const renderModalContent = () => {
        if (!selectedDate) return null;
        const dayStats = getDayStats(selectedDate);
        /* dayStats: { dateKey, dayName, schedule, dayData, totalHours, completedHours, percent, isToday } */

        const { dateKey, dayName, schedule, dayData, totalHours, completedHours, percent } = dayStats;

        let percentColor = 'var(--secondary)';
        if (totalHours > 0) {
            if (percent >= 80) percentColor = 'var(--success)';
            else if (percent >= 30) percentColor = 'var(--warning)';
            else percentColor = 'var(--danger)';
        }

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{dateKey}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dayName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: percentColor }}>
                            {Math.round(percent)}%
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Complete</div>
                    </div>
                </div>

                <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="stat-card" style={{ padding: '1rem' }}>
                        <div className="stat-value" style={{ fontSize: '1.5rem' }}>{completedHours.toFixed(1)} / {totalHours.toFixed(1)}</div>
                        <div className="stat-label">Hours</div>
                    </div>
                    <div className="stat-card" style={{ padding: '1rem' }}>
                        <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                            {dayData.leetcode ? <span style={{ color: 'var(--success)' }}>Done</span> : <span style={{ color: 'var(--danger)' }}>Missed</span>}
                        </div>
                        <div className="stat-label">LeetCode</div>
                    </div>
                </div>

                <h3>Study Blocks</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                    {schedule.length === 0 ? <p>Rest Day</p> : (
                        schedule.map((block, idx) => {
                            const isDone = dayData.completedBlocks.includes(idx);
                            const skipReason = dayData.skippedReasons?.[idx];
                            const displaySubject = dayData.overriddenSubjects?.[idx] || block.subject;

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '0.8rem',
                                        borderBottom: '1px solid var(--border)',
                                        opacity: isDone ? 0.6 : 1,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '20px', color: isDone ? 'var(--success)' : 'var(--danger)' }}>
                                            {isDone ? '✓' : '•'}
                                        </span>
                                        <span style={{ width: '130px', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                            {formatTimeRange(block.start, block.end)}
                                        </span>
                                        <span style={{ fontWeight: isDone ? 'normal' : '500', textDecoration: isDone ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {displaySubject}
                                            {dayData.overriddenSubjects?.[idx] && (
                                                <span style={{ fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.8 }}> (Edited)</span>
                                            )}
                                        </span>
                                    </div>
                                    {skipReason && (
                                        <div style={{ paddingLeft: '20px', marginTop: '0.3rem', fontSize: '0.85rem', color: '#EF4444', fontStyle: 'italic' }}>
                                            ⚠ {skipReason}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <h3>Notes</h3>
                <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', minHeight: '60px', fontStyle: dayData.notes ? 'normal' : 'italic', color: dayData.notes ? 'var(--text)' : 'var(--secondary)' }}>
                    {dayData.notes || 'No notes for this day.'}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* 1. Subject Wise Progress */}
            <div className="card">
                <h2>Subject Proficiency</h2>
                {Object.keys(stats.subjectHours).length === 0 ? (
                    <p style={{ color: 'var(--secondary)' }}>Start studying to see stats!</p>
                ) : (
                    Object.entries(stats.subjectHours)
                        .sort(([, a], [, b]) => b - a)
                        .map(([subject, hours]) => (
                            <div key={subject} className="subject-item">
                                <div className="subject-item-header">
                                    <span className="subject-name">{subject}</span>
                                    <span className="subject-hours">{hours.toFixed(1)} hrs</span>
                                </div>
                                <div className="progress-container" style={{ margin: 0, height: '8px' }}>
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(hours / maxHours) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                )}
            </div>

            {/* 2. LeetCode + Calendar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h2>LeetCode Tracker</h2>
                    <div className="leetcode-tracker-main">
                        <div className="leetcode-tracker-stats">
                            <div className="stat-value">{stats.totalLeetCode}</div>
                            <div className="stat-label">Total Solved</div>
                        </div>
                        <div className="leetcode-tracker-status">
                            <div className="leetcode-motivation">
                                Keep it up!
                            </div>
                            <div className="stat-label">Daily Goal: 1 Problem</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2>History & Calendar</h2>
                    <Calendar
                        dailyDataMap={data.dailyProgress}
                        getDayStats={getDayStats}
                        onDateClick={handleDateClick}
                    />
                </div>
            </div>

            {/* Weak Areas */}
            <div className="card">
                <h3>Weak Areas to Focus</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(data.weakAreas || []).map((area, index) => (
                        <span
                            key={index}
                            style={{
                                background: '#FFEDD5',
                                color: '#9A3412',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {area}
                            <button
                                onClick={() => handleRemoveWeakArea(index)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A3412', fontWeight: 'bold' }}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <form onSubmit={handleAddWeakArea} className="weak-areas-form">
                    <input
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="Add topic..."
                        style={{ marginBottom: 0 }}
                    />
                    <button type="submit" className="btn">Add</button>
                </form>
            </div>

            <Modal
                isOpen={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                title="Daily Summary"
            >
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default Progress;
