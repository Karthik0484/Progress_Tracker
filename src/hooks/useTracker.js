import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { loadData, saveData, getTodayKey, getDayName } from '../utils/storage';
import { TIMETABLE } from '../data/timetable';
import { validateData, createDailySnapshot, getAvailableSnapshots, restoreFromSnapshot } from '../utils/dataIntegrity';

export const useTracker = () => {
    const isFirstRender = useRef(true);
    const [data, setData] = useState(() => loadData());
    const [todayKey, setTodayKey] = useState(getTodayKey());
    const [corruptionErrors, setCorruptionErrors] = useState([]);

    // 1. Initial hydration and Day-Change management
    useEffect(() => {
        const currentToday = getTodayKey();

        // Always ensure today's key exists in the structure immediately on load
        setData(prev => {
            if (prev.dailyProgress[currentToday]) return prev;
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [currentToday]: {
                        completedBlocks: [],
                        notes: '',
                        leetcode: false,
                        overriddenSubjects: {},
                        overriddenTimes: {},
                        skippedReasons: {}
                    }
                }
            };
        });

        // Set up interval to track day changes
        const interval = setInterval(() => {
            const current = getTodayKey();
            if (current !== todayKey) {
                setTodayKey(current);
            }
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, [todayKey]);

    // 2. Data Validation & Snapshots
    useEffect(() => {
        const errors = validateData(data);
        setCorruptionErrors(errors);

        if (errors.length === 0 && !isFirstRender.current) {
            // Only create snapshot if data is valid and it's not the initial mount
            // (Snapshot utility already checks per-day existence)
            createDailySnapshot(data);
        }
    }, [data]);

    // 3. Persistent Sync to localStorage
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // Skip the very first sync to avoid overwriting with defaults
        }

        // Only save if no corruption was detected to prevent data loss
        if (corruptionErrors.length === 0) {
            saveData(data);
        }
    }, [data, corruptionErrors]);

    // --- Actions (Immutable Updates) ---

    const toggleBlock = useCallback((dateKey, blockIndex) => {
        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || {
                completedBlocks: [], notes: '', leetcode: false,
                overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
            };
            const isCompleted = dayData.completedBlocks.includes(blockIndex);

            let newCompleted;
            let newReasons = { ...(dayData.skippedReasons || {}) };

            if (isCompleted) {
                newCompleted = dayData.completedBlocks.filter(i => i !== blockIndex);
            } else {
                newCompleted = [...dayData.completedBlocks, blockIndex].sort((a, b) => a - b);
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
    }, []);

    const updateNotes = useCallback((dateKey, text) => {
        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || {
                completedBlocks: [], notes: '', leetcode: false,
                overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
            };
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, notes: text }
                }
            };
        });
    }, []);

    const toggleLeetCode = useCallback((dateKey) => {
        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || {
                completedBlocks: [], notes: '', leetcode: false,
                overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
            };
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: { ...dayData, leetcode: !dayData.leetcode }
                }
            };
        });
    }, []);

    const updateSkipReason = useCallback((dateKey, blockIndex, reason) => {
        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || {
                completedBlocks: [], notes: '', leetcode: false,
                overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
            };
            const newReasons = { ...(dayData.skippedReasons || {}) };
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
    }, []);

    const updateOverriddenSubject = useCallback((dateKey, blockIndex, newSubject) => {
        if (!newSubject.trim()) return;

        setData(prev => {
            const dayData = prev.dailyProgress[dateKey] || {
                completedBlocks: [], notes: '', leetcode: false,
                overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
            };
            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: {
                        ...dayData,
                        overriddenSubjects: {
                            ...(dayData.overriddenSubjects || {}),
                            [blockIndex]: newSubject
                        }
                    }
                }
            };
        });
    }, []);

    const updateOverriddenTime = useCallback((dateKey, blockIndex, newStart, newEnd) => {
        if (!newStart || !newEnd) return { error: 'Invalid time' };

        const [sH, sM] = newStart.split(':').map(Number);
        const [eH, eM] = newEnd.split(':').map(Number);
        const startVal = sH * 60 + sM;
        const endVal = eH * 60 + eM;

        if (startVal >= endVal) return { error: 'Start time must be before end time' };

        setData(prev => {
            const dayName = getDayName(dateKey);
            const schedule = TIMETABLE[dayName] || [];
            const dayData = prev.dailyProgress[dateKey] || {};
            const currentOverriddenTimes = dayData.overriddenTimes || {};

            // Internal overlap check within the setter to use freshest data
            const hasOverlap = schedule.some((block, idx) => {
                if (idx === blockIndex) return false;
                const time = currentOverriddenTimes[idx] || { start: block.start, end: block.end };
                const [exSH, exSM] = time.start.split(':').map(Number);
                const [exEH, exEM] = time.end.split(':').map(Number);
                const exStartVal = exSH * 60 + exSM;
                const exEndVal = exEH * 60 + exEM;
                return (startVal < exEndVal && endVal > exStartVal);
            });

            if (hasOverlap) {
                // We can't easily return an error from within a functional update, 
                // but we can prevent the update.
                return prev;
            }

            return {
                ...prev,
                dailyProgress: {
                    ...prev.dailyProgress,
                    [dateKey]: {
                        ...dayData,
                        overriddenTimes: {
                            ...currentOverriddenTimes,
                            [blockIndex]: { start: newStart, end: newEnd }
                        }
                    }
                }
            };
        });
        return { success: true };
    }, []);

    const updateWeakAreas = useCallback((text) => {
        const areas = text.split('\n').filter(s => s.trim() !== '');
        setData(prev => ({ ...prev, weakAreas: areas }));
    }, []);

    const saveReview = useCallback((weekId, reviewData) => {
        setData(prev => ({
            ...prev,
            reviews: {
                ...prev.reviews,
                [weekId]: reviewData
            }
        }));
    }, []);

    // --- Stats Helpers ---

    const getDayStats = useCallback((dateKey) => {
        const dayName = getDayName(dateKey);
        const schedule = TIMETABLE[dayName] || [];
        const dayData = data.dailyProgress[dateKey] || {
            completedBlocks: [], notes: '', leetcode: false,
            overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {}
        };

        let totalHours = 0;
        let completedHours = 0;

        schedule.forEach((block, index) => {
            const time = dayData.overriddenTimes?.[index] || { start: block.start, end: block.end };
            const startParts = time.start.split(':').map(Number);
            const endParts = time.end.split(':').map(Number);

            const startH = startParts[0] + startParts[1] / 60;
            const endH = endParts[0] + endParts[1] / 60;
            const duration = Math.max(0, endH - startH);

            totalHours += duration;
            if (dayData.completedBlocks.includes(index)) {
                completedHours += duration;
            }
        });

        return {
            dateKey,
            dayName,
            schedule,
            dayData,
            totalHours: totalHours.toFixed(1),
            completedHours: completedHours.toFixed(1),
            percent: totalHours > 0 ? (completedHours / totalHours) * 100 : 0,
            isToday: dateKey === todayKey
        };
    }, [data, todayKey]);

    const restoreLastSnapshot = useCallback(() => {
        const snapshots = getAvailableSnapshots();
        if (snapshots.length > 0) {
            const success = restoreFromSnapshot(snapshots[0].key);
            if (success) {
                window.location.reload();
            }
            return success;
        }
        return false;
    }, []);

    const availableSnapshots = useMemo(() => getAvailableSnapshots(), []);

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
        updateOverriddenTime,
        corruptionErrors,
        restoreLastSnapshot,
        availableSnapshots
    };
};

