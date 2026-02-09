const STORAGE_KEY = 'placement_tracker_data';

const INITIAL_STATE = {
    // Map of date string (YYYY-MM-DD) to day data
    // Day Data: { completedBlocks: [], notes: '', leetcode: false }
    dailyProgress: {},
    weakAreas: [],
    reviews: {}, // Map of weekKey to review data
};

export const loadData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : INITIAL_STATE;
    } catch (error) {
        console.error("Failed to load data", error);
        return INITIAL_STATE;
    }
};

export const saveData = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save data", error);
    }
};

export const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export const getDayName = (dateStr) => {
    // dateStr is YYYY-MM-DD
    // If not provided, uses today
    const date = dateStr ? new Date(dateStr) : new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};
