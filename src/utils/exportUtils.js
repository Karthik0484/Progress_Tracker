import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
                const time = stats.dayData.overriddenTimes?.[idx] || { start: block.start, end: block.end };

                const blockEntry = {
                    time: formatTimeRange(time.start, time.end),
                    subject: subject,
                    status: isCompleted ? 'Completed' : (skipReason ? 'Skipped' : 'Pending'),
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
            minThreshold: "Day counts if >= 70% completed"
        },
        dailyBreakdown: days,
        dateRange: {
            start: days[0].date,
            end: days[6].date
        }
    };
};

export const exportToPDF = (exportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper for beautiful formatting
    const primaryColor = [31, 41, 55]; // Dark blue-grey

    // Title
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Placement Preparation – Weekly Report", pageWidth / 2, 20, { align: "center" });

    // Header info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Week: ${exportData.weekIdentifier}`, 14, 30);
    doc.text(`Date Range: ${exportData.dateRange.start} to ${exportData.dateRange.end}`, 14, 35);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    // Summary Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Summary Metrics", 14, 52);

    const summaryData = [
        ["Total Planned Hours", `${exportData.summary.totalPlannedHours}h`],
        ["Total Completed Hours", `${exportData.summary.totalCompletedHours}h`],
        ["Completion Rate", `${exportData.summary.completionPercentage}%`],
        ["Current Streak", `${exportData.streaks.currentStreak} days`],
        ["Best Streak", `${exportData.streaks.bestStreak} days`],
        ["Min Completion Rule", exportData.streaks.minThreshold]
    ];

    autoTable(doc, {
        startY: 55,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' }
        },
        margin: { left: 14 }
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // Daily Breakdown
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Progress Breakdown", 14, currentY);
    currentY += 8;

    exportData.dailyBreakdown.forEach((day, index) => {
        // Check for page break
        if (currentY > 230) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${day.dayName} (${day.date})`, 14, currentY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(`Completion: ${day.completionPercentage}% | ${day.completedHours}h completed of ${day.plannedHours}h planned`, 14, currentY + 5);

        const tableBody = day.blocks.length > 0
            ? day.blocks.map(block => [
                block.time,
                block.subject,
                block.status,
                block.skipReason || "-"
            ])
            : [["-", "Rest Day / No Scheduled Blocks", "-", "-"]];

        autoTable(doc, {
            startY: currentY + 8,
            head: [['Time', 'Subject', 'Status', 'Skip Reason']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 8,
                lineWidth: 0.1
            },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { cellWidth: 40 }
            },
            margin: { left: 14, right: 14 },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 2) {
                    if (data.cell.raw === 'Completed') {
                        data.cell.styles.textColor = [0, 128, 0]; // Success green
                    } else if (data.cell.raw === 'Skipped') {
                        data.cell.styles.textColor = [220, 0, 0]; // Danger red
                    }
                }
            }
        });

        currentY = doc.lastAutoTable.finalY + 12;
    });

    // Add Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`placement-prep-week-${exportData.weekIdentifier}.pdf`);
};


