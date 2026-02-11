import { formatTimeRange } from './format';

/**
 * Gets the Monday of the week for a given date.
 */
export const getMonday = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

/**
 * Gets the ISO week number.
 */
export const getWeekIdentifier = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const prepareWeeklyData = (data, getDayStats, referenceDate, streaks) => {
    const monday = getMonday(referenceDate);
    const weekId = getWeekIdentifier(monday);

    const days = [];
    let totalPlannedHours = 0;
    let totalCompletedHours = 0;

    for (let i = 0; i < 7; i++) {
        const current = new Date(monday);
        current.setDate(monday.getDate() + i);
        const dateKey = current.toISOString().split('T')[0];
        const stats = getDayStats(dateKey);

        const dayEntry = {
            date: dateKey,
            dayName: stats.dayName,
            plannedHours: parseFloat(stats.totalHours.toFixed(2)),
            completedHours: parseFloat(stats.completedHours.toFixed(2)),
            completionPercentage: parseFloat(stats.percent.toFixed(1)),
            blocks: stats.schedule.map((block, idx) => {
                const isCompleted = stats.dayData.completedBlocks.includes(idx);
                const skipReason = stats.dayData.skippedReasons?.[idx];
                const subject = stats.dayData.overriddenSubjects?.[idx] || block.subject;

                const blockEntry = {
                    time: formatTimeRange(block.start, block.end),
                    subject: subject,
                    status: isCompleted ? 'completed' : (skipReason ? 'skipped' : 'pending'),
                };

                if (skipReason) {
                    blockEntry.skipReason = skipReason;
                }

                return blockEntry;
            })
        };

        days.push(dayEntry);
        totalPlannedHours += stats.totalHours;
        totalCompletedHours += stats.completedHours;
    }

    const completionPercentage = totalPlannedHours > 0
        ? (totalCompletedHours / totalPlannedHours) * 100
        : 0;

    return {
        weekIdentifier: weekId,
        summary: {
            totalPlannedHours: parseFloat(totalPlannedHours.toFixed(2)),
            totalCompletedHours: parseFloat(totalCompletedHours.toFixed(2)),
            completionPercentage: parseFloat(completionPercentage.toFixed(1))
        },
        streaks: {
            currentStreak: streaks.current,
            bestStreak: streaks.best,
            minThreshold: "70%"
        },
        dailyBreakdown: days
    };
};

export const exportToJSON = (exportData) => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `placement-prep-week-${exportData.weekIdentifier}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportToText = (exportData) => {
    let text = `PLACEMENT PREP TRACKER - WEEKLY REPORT\n`;
    text += `Week: ${exportData.weekIdentifier}\n`;
    text += `==========================================\n\n`;

    text += `SUMMARY\n`;
    text += `------------------------------------------\n`;
    text += `Total Planned Hours:   ${exportData.summary.totalPlannedHours}h\n`;
    text += `Total Completed Hours: ${exportData.summary.totalCompletedHours}h\n`;
    text += `Completion Rate:       ${exportData.summary.completionPercentage}%\n\n`;

    text += `STREAK INFO\n`;
    text += `------------------------------------------\n`;
    text += `Current Streak: ${exportData.streaks.currentStreak} days\n`;
    text += `Best Streak:    ${exportData.streaks.bestStreak} days\n`;
    text += `Min Threshold:  ${exportData.streaks.minThreshold}\n\n`;

    text += `DAILY BREAKDOWN\n`;
    text += `------------------------------------------\n`;

    exportData.dailyBreakdown.forEach(day => {
        text += `\n[ ${day.date} - ${day.dayName} ]\n`;
        text += `Progress: ${day.completionPercentage}% (${day.completedHours}h / ${day.plannedHours}h)\n`;

        if (day.blocks.length === 0) {
            text += `  - Rest Day\n`;
        } else {
            day.blocks.forEach(block => {
                const statusIcon = block.status === 'completed' ? '[✓]' : (block.status === 'skipped' ? '[⚠]' : '[ ]');
                text += `  ${statusIcon} ${block.time}: ${block.subject}`;
                if (block.skipReason) {
                    text += ` (Skip Reason: ${block.skipReason})`;
                }
                text += `\n`;
            });
        }
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `placement-prep-week-${exportData.weekIdentifier}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
