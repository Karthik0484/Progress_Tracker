const STORAGE_KEY = 'placement_tracker_data';

const INITIAL_STATE = {
    // Map of date string (YYYY-MM-DD) to day data
    // Day Data: { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {}, overriddenTimes: {}, skippedReasons: {} }
    dailyProgress: {},
    weakAreas: [],
    reviews: {}, // Map of weekKey to review data
};

export const loadData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return { ...INITIAL_STATE };

        const parsed = JSON.parse(data);
        // Deep merge / ensure all top-level keys exist to prevent validation errors on new features
        return {
            ...INITIAL_STATE,
            ...parsed,
            dailyProgress: parsed.dailyProgress || {},
            weakAreas: parsed.weakAreas || [],
            reviews: parsed.reviews || {}
        };
    } catch (error) {
        console.error("Failed to load data", error);
        return { ...INITIAL_STATE };
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDayName = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

