import { useState, useEffect, useCallback } from 'react';
import { loadData, saveData, getTodayKey, getDayName } from '../utils/storage';
import { TIMETABLE } from '../data/timetable';
import { validateData, createDailySnapshot, getAvailableSnapshots, restoreFromSnapshot } from '../utils/dataIntegrity';

export const useTracker = () => {
    const [data, setData] = useState(loadData());
    const [todayKey, setTodayKey] = useState(getTodayKey());
    const [corruptionErrors, setCorruptionErrors] = useState([]);

    // Data Integrity & Snapshots
    useEffect(() => {
        const errors = validateData(data);
        if (errors.length > 0) {
            setCorruptionErrors(errors);
        } else {
            // Only create snapshot if data is currently valid
            createDailySnapshot(data);
        }
    }, [todayKey]); // Re-check/snapshot if the day changes

    // Sync to storage
    useEffect(() => {
        // Only save if no corruption was detected initially to prevent overwriting with bad data
        // Or should we always save user changes? 
        // User said: "If validation fails: Flag data as corrupted, Do NOT auto-fix silently"
        // If we let them keep usage, we might be saving corrupted data.
        // But if they have corrupted data, we show restore.
        if (corruptionErrors.length === 0) {
            saveData(data);
        }
    }, [data, corruptionErrors]);

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
                    [dateKey]: { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} }
                }
            }));
        }
    };

    // --- Actions ---

    const toggleBlock = (dateKey, blockIndex) => {
        if (dateKey !== getTodayKey()) return; // Strict guard

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };
            const isCompleted = dayData.completedBlocks.includes(blockIndex);

            let newCompleted;
            let newReasons = { ...(dayData.skippedReasons || {}) };

            if (isCompleted) {
                newCompleted = dayData.completedBlocks.filter(i => i !== blockIndex);
            } else {
                newCompleted = [...dayData.completedBlocks, blockIndex].sort((a, b) => a - b); // keep sorted
                // Rule: If marking as completed, remove skip reason
                delete newReasons[blockIndex];
            }

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, completedBlocks: newCompleted, skippedReasons: newReasons }
                }
            };
        });
    };

    const updateNotes = (dateKey, text) => {
        if (dateKey !== getTodayKey()) return;

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };
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
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };
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
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };
            const currentReasons = dayData.skippedReasons || {}; // ensure map exists

            // If reason is empty, remove it to keep clean, or just store ''
            const newReasons = { ...currentReasons };
            let newCompleted = [...(dayData.completedBlocks || [])];

            if (reason.trim() === '') {
                delete newReasons[blockIndex];
            } else {
                newReasons[blockIndex] = reason;
                // Rule: If adding a skip reason, remove completion mark
                newCompleted = newCompleted.filter(i => i !== blockIndex);
            }

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, skippedReasons: newReasons, completedBlocks: newCompleted }
                }
            };
        });
    };

    const updateOverriddenSubject = (dateKey, blockIndex, newSubject) => {
        if (dateKey !== getTodayKey()) return;
        if (!newSubject.trim()) return; // Requirement: Do NOT allow empty subject names

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };
            const currentOverrides = dayData.overriddenSubjects || {};

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: {
                        ...dayData,
                        overriddenSubjects: {
                            ...currentOverrides,
                            [blockIndex]: newSubject
                        }
                    }
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
        const dayData = data.dailyProgress[dateKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} };

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

    const restoreLastSnapshot = useCallback(() => {
        const snapshots = getAvailableSnapshots();
        if (snapshots.length > 0) {
            const success = restoreFromSnapshot(snapshots[0].key);
            if (success) {
                window.location.reload(); // Reload app as requested
            }
            return success;
        }
        return false;
    }, []);

    return {
        data,
        todayKey,
        toggleBlock,
        updateNotes,
        toggleLeetCode,
        updateWeakAreas,
        saveReview,
        getDayStats,
        updateSkipReason,
        updateOverriddenSubject,
        corruptionErrors,
        restoreLastSnapshot,
        availableSnapshots: getAvailableSnapshots()
    };
};
