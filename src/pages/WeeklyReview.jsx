import React, { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { formatTimeRange } from '../utils/format';

const WeeklyReview = ({ data, getDayStats, todayKey }) => {
    const [selectedDate, setSelectedDate] = useState(null);

    // Filter available years from data
    const availableYears = useMemo(() => {
        const years = new Set();
        // Always include current year
        years.add(new Date().getFullYear());
        // Add years from daily progress
        Object.keys(data.dailyProgress).forEach(dateStr => {
            const y = new Date(dateStr).getFullYear();
            if (!isNaN(y)) years.add(y);
        });
        // Sort descending
        return Array.from(years).sort((a, b) => b - a);
    }, [data.dailyProgress]);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Streak Logic (Preserved) ---
    const streaks = useMemo(() => {
        const dates = Object.keys(data.dailyProgress).sort();
        if (dates.length === 0) return { current: 0, best: 0 };

        const lastDate = new Date(todayKey);
        let best = 0;
        let current = 0;
        let temp = 0;

        const iter = new Date(dates[0]);
        while (iter <= lastDate) {
            const dKey = iter.toISOString().split('T')[0];
            const stats = getDayStats(dKey);

            if (stats.totalHours > 0) {
                if (stats.percent >= 70) {
                    temp++;
                    if (temp > best) best = temp;
                } else {
                    temp = 0;
                }
            }
            iter.setDate(iter.getDate() + 1);
        }
        current = temp;
        return { current, best };
    }, [data.dailyProgress, getDayStats, todayKey]);

    // --- Heatmap Logic: One Year Scope (Standard GitHub View) ---
    const heatmap = useMemo(() => {
        // Find boundaries for selectedYear (Monday-aligned weeks)
        const startDate = new Date(selectedYear, 0, 1);
        const startDayOffset = (startDate.getDay() === 0) ? 6 : startDate.getDay() - 1;
        startDate.setDate(startDate.getDate() - startDayOffset);

        const endDate = new Date(selectedYear, 11, 31);
        const endDayOffset = (endDate.getDay() === 0) ? 0 : 7 - endDate.getDay();
        endDate.setDate(endDate.getDate() + endDayOffset);

        const dayList = [];
        const iter = new Date(startDate);
        while (iter <= endDate) {
            const key = iter.toISOString().split('T')[0];
            const dateObj = new Date(iter);
            dayList.push({
                date: dateObj,
                dateKey: key,
                stats: getDayStats(key),
                inYear: dateObj.getFullYear() === selectedYear
            });
            iter.setDate(iter.getDate() + 1);
        }

        const weeks = [];
        for (let i = 0; i < dayList.length / 7; i++) {
            weeks.push(dayList.slice(i * 7, (i + 1) * 7));
        }

        const monthLabels = [];
        let prevMonth = -1;
        weeks.forEach((week, i) => {
            // Label month changes based on valid year days
            const validDay = week.find(d => d.inYear);
            if (validDay) {
                const m = validDay.date.getMonth();
                if (m !== prevMonth) {
                    monthLabels.push({
                        name: validDay.date.toLocaleString('default', { month: 'short' }),
                        col: i
                    });
                    prevMonth = m;
                }
            }
        });

        return { weeks, monthLabels };
    }, [selectedYear, getDayStats]);

    const getColorClass = (percent, totalHours, dateKey, inYear) => {
        if (!inYear) return 'gh-hidden';

        const date = new Date(dateKey);
        const today = new Date(todayKey);
        if (date > today) return 'gh-future';
        if (totalHours === 0 || percent === 0) return 'gh-empty';
        if (percent < 30) return 'gh-level-1';
        if (percent < 70) return 'gh-level-2';
        return 'gh-level-3';
    };

    const renderModalContent = () => {
        if (!selectedDate) return null;
        const stats = getDayStats(selectedDate);
        const { dateKey, dayName, schedule, dayData, percent } = stats;

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{dateKey}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dayName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: percent >= 70 ? 'var(--success)' : (percent >= 30 ? 'var(--warning)' : 'var(--danger)') }}>
                            {Math.round(percent)}%
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Completed</div>
                    </div>
                </div>

                <h3>Schedule Summary</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                    {schedule.length === 0 ? <p>Rest Day</p> : (
                        schedule.map((block, idx) => {
                            const isDone = dayData.completedBlocks.includes(idx);
                            const skipReason = dayData.skippedReasons?.[idx];
                            const displaySubject = dayData.overriddenSubjects?.[idx] || block.subject;
                            return (
                                <div key={idx} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', opacity: isDone ? 0.6 : 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '20px', color: isDone ? 'var(--success)' : 'var(--danger)' }}>{isDone ? '✓' : '•'}</span>
                                        <span style={{ width: '130px', fontSize: '0.85rem' }}>{formatTimeRange(block.start, block.end)}</span>
                                        <span style={{ fontWeight: 500 }}>
                                            {displaySubject}
                                            {dayData.overriddenSubjects?.[idx] && (
                                                <span style={{ fontSize: '0.65rem', color: 'var(--primary)', marginLeft: '0.5rem', fontWeight: 'normal' }}>(Edited)</span>
                                            )}
                                        </span>
                                    </div>
                                    {skipReason && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontStyle: 'italic', marginLeft: '20px' }}>⚠ {skipReason}</div>}
                                </div>
                            );
                        })
                    )}
                </div>
                <h3>Notes</h3>
                <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px' }}>
                    {dayData.notes || 'No notes for this day.'}
                </div>
            </div>
        );
    };

    return (
        <div className="review-container">
            {/* Streak Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">🔥 {streaks.current}</div>
                    <div className="stat-label">Current Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">🏆 {streaks.best}</div>
                    <div className="stat-label">Best Streak</div>
                </div>
            </div>

            <div className="streak-disclaimer">
                Valid Study Day = <strong>≥ 70%</strong> Completed.
            </div>

            {/* GitHub Professional Heatmap Implementation */}
            <div className="card github-performance-card">
                <h3>Consistency Tracker</h3>

                <div className="heatmap-layout-outer">
                    <div className="heatmap-main-scrollable">
                        <div className="heatmap-labels-months">
                            {heatmap.monthLabels.map((m, idx) => (
                                <div key={m.name + m.col + idx} className="month-label" style={{ left: `calc(${m.col} * (var(--square-size) + var(--square-gap)) + 35px)` }}>
                                    {m.name}
                                </div>
                            ))}
                        </div>

                        <div className="heatmap-grid-core">
                            <div className="row-labels">
                                <span>Mon</span>
                                <span>Wed</span>
                                <span>Fri</span>
                            </div>

                            <div className="columns-container">
                                {heatmap.weeks.map((week, wIdx) => (
                                    <div key={wIdx} className="week-column">
                                        {week.map((day) => (
                                            <div
                                                key={day.dateKey}
                                                className={`sq ${getColorClass(day.stats.percent, day.stats.totalHours, day.dateKey, day.inYear)} ${day.dateKey === todayKey ? 'sq-today' : ''}`}
                                                onClick={() => day.inYear && new Date(day.dateKey) <= new Date(todayKey) && setSelectedDate(day.dateKey)}
                                                title={day.inYear ? `${day.dateKey}: ${Math.round(day.stats.percent)}%` : ''}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="heatmap-footer">
                            <div className="footnote">
                                Learn how we count contributions
                            </div>
                            <div className="legend-strip">
                                <span>Less</span>
                                <div className="sq gh-empty"></div>
                                <div className="sq gh-level-1"></div>
                                <div className="sq gh-level-2"></div>
                                <div className="sq gh-level-3"></div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>

                    <div className="heatmap-sidebar-selector">
                        {availableYears.map(y => (
                            <div
                                key={y}
                                className={`year-selector-item ${selectedYear === y ? 'active' : ''}`}
                                onClick={() => setSelectedYear(y)}
                            >
                                {y}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title="Performance Details">
                {renderModalContent()}
            </Modal>

            <style>{`
                :root {
                    --square-size: 11px;
                    --square-gap: 3.5px;
                    --c-grey: #ebedf0;
                    --c-lvl1: #9be9a8;
                    --c-lvl2: #40c463;
                    --c-lvl3: #216e39;
                }
                .dark {
                    --c-grey: #161b22;
                    --c-lvl1: #0e4429;
                    --c-lvl2: #26a641;
                    --c-lvl3: #39d353;
                }

                .review-container {
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .streak-disclaimer {
                    text-align: center;
                    margin-bottom: 2rem;
                    color: var(--secondary);
                    font-size: 0.8rem;
                }

                .github-performance-card {
                    padding: 1.5rem !important;
                    overflow: hidden;
                }

                .heatmap-layout-outer {
                    display: flex;
                    gap: 20px;
                    margin-top: 20px;
                }

                .heatmap-main-scrollable {
                    flex-grow: 1;
                    position: relative;
                    padding-top: 30px; /* for months */
                    overflow-x: auto;
                    padding-bottom: 5px;
                }

                .heatmap-labels-months {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 25px;
                    width: 100%;
                }

                .month-label {
                    position: absolute;
                    font-size: 0.75rem;
                    color: var(--secondary);
                    white-space: nowrap;
                }

                .heatmap-grid-core {
                    display: flex;
                    gap: 10px;
                }

                .row-labels {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    font-size: 0.65rem;
                    color: var(--secondary);
                    width: 25px;
                    padding: 14px 0 28px 0;
                    text-align: right;
                    pointer-events: none;
                }
                .row-labels span { height: var(--square-size); }

                .columns-container {
                    display: flex;
                    gap: var(--square-gap);
                    padding-bottom: 5px;
                }

                .week-column {
                    display: flex;
                    flex-direction: column;
                    gap: var(--square-gap);
                }

                .sq {
                    width: var(--square-size);
                    height: var(--square-size);
                    border-radius: 2px;
                    background: var(--c-grey);
                    cursor: pointer;
                    transition: all 0.1s;
                }
                .sq:hover:not(.gh-future):not(.gh-hidden) {
                    transform: scale(1.3);
                    outline: 1.5px solid var(--primary);
                    outline-offset: 1px;
                    z-index: 10;
                }

                .gh-level-1 { background: var(--c-lvl1); }
                .gh-level-2 { background: var(--c-lvl2); }
                .gh-level-3 { background: var(--c-lvl3); }
                .gh-empty { background: var(--c-grey); }
                .gh-future { opacity: 0.2; cursor: default; }
                .gh-hidden { visibility: hidden; pointer-events: none; }

                .sq-today {
                    outline: 1.5px solid var(--primary);
                    outline-offset: 1px;
                }

                .heatmap-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    padding-left: 35px;
                    padding-right: 5px;
                }

                .footnote {
                    font-size: 0.75rem;
                    color: var(--secondary);
                    opacity: 0.7;
                }

                .legend-strip {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: var(--secondary);
                }
                .legend-strip .sq {
                    width: 10px;
                    height: 10px;
                    cursor: default;
                }
                .legend-strip .sq:hover { transform: none; outline: none; }

                .heatmap-sidebar-selector {
                    width: 60px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding-top: 30px;
                    border-left: 1px solid var(--border);
                    padding-left: 15px;
                }

                .year-selector-item {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 2px 0;
                }

                .year-selector-item:hover {
                    color: var(--primary);
                }

                .year-selector-item.active {
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 0.95rem;
                }

                @media (max-width: 768px) {
                    .heatmap-sidebar-selector {
                        display: flex;
                        flex-direction: row;
                        width: 100%;
                        border-left: none;
                        border-top: 1px solid var(--border);
                        padding-left: 0;
                        padding-top: 15px;
                        justify-content: center;
                        gap: 20px;
                        order: -1;
                        margin-bottom: 10px;
                    }
                    .heatmap-layout-outer {
                        flex-direction: column;
                    }
                    .heatmap-footer {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }
                }
            `}</style>
        </div>
    );
};

export default WeeklyReview;
