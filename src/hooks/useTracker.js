import { useState, useEffect } from 'react';
import { loadData, saveData, getTodayKey, getDayName } from '../utils/storage';
import { TIMETABLE } from '../data/timetable';

export const useTracker = () => {
    const [data, setData] = useState(loadData());
    const [todayKey, setTodayKey] = useState(getTodayKey());

    // Sync to storage
    useEffect(() => {
        saveData(data);
    }, [data]);

    // Keep todayKey updated
    useEffect(() => {
        const interval = setInterval(() => {
            const current = getTodayKey();
            if (current !== todayKey) {
                setTodayKey(current);
            }
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [todayKey]);

    // Ensure day entry exists
    const ensureDay = (dateKey) => {
        if (!data.dailyProgress[dateKey]) {
            setData(prev => ({
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { completedBlocks: [], notes: '', leetcode: false }
                }
            }));
        }
    };

    // --- Actions ---

    const toggleBlock = (dateKey, blockIndex) => {
        if (dateKey !== getTodayKey()) return; // Strict guard

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false };
            const isCompleted = dayData.completedBlocks.includes(blockIndex);

            let newCompleted;
            if (isCompleted) {
                newCompleted = dayData.completedBlocks.filter(i => i !== blockIndex);
            } else {
                newCompleted = [...dayData.completedBlocks, blockIndex].sort((a, b) => a - b); // keep sorted
            }

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, completedBlocks: newCompleted }
                }
            };
        });
    };

    const updateNotes = (dateKey, text) => {
        if (dateKey !== getTodayKey()) return;

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false };
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, notes: text }
                }
            };
        });
    };

    const toggleLeetCode = (dateKey) => {
        if (dateKey !== getTodayKey()) return;

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false };
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, leetcode: !dayData.leetcode }
                }
            };
        });
    };

    const updateSkipReason = (dateKey, blockIndex, reason) => {
        if (dateKey !== getTodayKey()) return;

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false };
            const currentReasons = dayData.skippedReasons || {}; // ensure map exists

            // If reason is empty, remove it to keep clean, or just store ''
            const newReasons = { ...currentReasons };
            if (reason.trim() === '') {
                delete newReasons[blockIndex];
            } else {
                newReasons[blockIndex] = reason;
            }

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, skippedReasons: newReasons }
                }
            };
        });
    };

    const updateWeakAreas = (text) => {
        const areas = text.split('\n').filter(s => s.trim() !== '');
        setData(prev => ({ ...prev, weakAreas: areas }));
    };

    const saveReview = (weekId, reviewData) => {
        setData(prev => ({
            ...prev,
            reviews: {
                ...prev.reviews,
                [weekId]: reviewData
            }
        }));
    };

    // --- Stats Helpers ---

    const getDayStats = (dateKey) => {
        const dayName = getDayName(dateKey); // e.g., "Monday"
        const schedule = TIMETABLE[dayName] || [];
        const dayData = data.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false };

        let totalHours = 0;
        let completedHours = 0;

        schedule.forEach((block, index) => {
            const start = block.start.split(':').map(Number);
            const end = block.end.split(':').map(Number);

            const startH = start[0] + start[1] / 60;
            const endH = end[0] + end[1] / 60;
            const duration = endH - startH;

            totalHours += duration;
            if (dayData.completedBlocks.includes(index)) {
                completedHours += duration;
            }
        });

        const percent = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

        return {
            dateKey,
            dayName,
            schedule,
            dayData,
            totalHours,
            completedHours,
            percent,
            isToday: dateKey === todayKey
        };
    };

    return {
        data,
        todayKey,
        toggleBlock,
        updateNotes,
        toggleLeetCode,
        updateWeakAreas,
        saveReview,
        getDayStats,
        updateSkipReason
    };
};
