import React, { useMemo } from 'react';
import TimeBlock from '../components/TimeBlock';
import { getDayName } from '../utils/storage';
import { TIMETABLE } from '../data/timetable';

const Today = ({ todayKey, dailyData, toggleBlock, updateNotes, toggleLeetCode, updateSkipReason, updateOverriddenSubject, updateOverriddenTime }) => {
    const dayName = getDayName(todayKey);
    const schedule = TIMETABLE[dayName] || [];

    // Calculate specific stats for today
    const stats = useMemo(() => {
        let total = 0;
        let completed = 0;

        schedule.forEach((block, index) => {
            const time = dailyData.overriddenTimes?.[index] || { start: block.start, end: block.end };
            const startParts = time.start.split(':').map(Number);
            const endParts = time.end.split(':').map(Number);
            const startH = startParts[0] + startParts[1] / 60;
            const endH = endParts[0] + endParts[1] / 60;
            const duration = endH - startH;

            total += duration;
            if (dailyData.completedBlocks.includes(index)) {
                completed += duration;
            }
        });

        return {
            total: total.toFixed(1),
            completed: completed.toFixed(1),
            percent: total > 0 ? (completed / total) * 100 : 0
        };
    }, [schedule, dailyData.completedBlocks, dailyData.overriddenTimes]);

    if (schedule.length === 0) {
        return (
            <div className="card">
                <h3>Rest Day / No Schedule</h3>
                <p>Enjoy your free time!</p>
            </div>
        );
    }

    return (
        <div>
            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.completed} / {stats.total}</div>
                    <div className="stat-label">Hours Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {dailyData.leetcode ? <span style={{ color: 'var(--success)' }}>Done</span> : <span style={{ color: 'var(--text)' }}>Pending</span>}
                    </div>
                    <div className="stat-label">LeetCode Goal</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container" style={{ marginBottom: '2rem' }}>
                <div
                    className="progress-fill"
                    style={{ width: `${stats.percent}%` }}
                />
            </div>

            <h2>Today's Schedule ({dayName})</h2>
            {schedule.map((block, index) => (
                <TimeBlock
                    key={index}
                    {...block}
                    overriddenSubject={dailyData.overriddenSubjects?.[index]}
                    onUpdateSubject={(newSub) => updateOverriddenSubject(todayKey, index, newSub)}
                    overriddenTime={dailyData.overriddenTimes?.[index]}
                    onUpdateTime={(newStart, newEnd) => updateOverriddenTime(todayKey, index, newStart, newEnd)}
                    completed={dailyData.completedBlocks.includes(index)}
                    onToggle={() => toggleBlock(todayKey, index)}
                    skipReason={dailyData.skippedReasons?.[index]}
                    onUpdateReason={(reason) => updateSkipReason(todayKey, index, reason)}
                    isToday={true}
                />
            ))}

            <div className="card">
                <h3>Daily Goals</h3>
                <div
                    className={`time-block ${dailyData.leetcode ? 'completed' : 'todo'}`}
                    onClick={() => toggleLeetCode(todayKey)}
                    style={{ marginBottom: 0, border: 'none' }}
                >
                    <div className="block-time" style={{ width: 'auto', minWidth: '100px' }}>LeetCode</div>
                    <div className="block-subject">Solve 1 Problem</div>
                    <div className="checkbox-custom">
                        {dailyData.leetcode && <span>✓</span>}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Notes for Today</h3>
                <textarea
                    value={dailyData.notes || ''}
                    onChange={(e) => updateNotes(todayKey, e.target.value)}
                    placeholder="Track your blockers or key learnings..."
                    rows="4"
                />
            </div>
        </div>
    );
};

export default Today;
