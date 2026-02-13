
const APP_DATA_KEY = 'placement_tracker_data';
const SNAPSHOT_PREFIX = 'snapshot_';
const MAX_SNAPSHOTS = 3;

/**
 * Validates the core application data for corruption or invalid states.
 * @param {Object} data The data to validate
 * @returns {Array} List of validation errors, empty if valid
 */
export const validateData = (data) => {
    const errors = [];

    if (!data) {
        errors.push("Data is missing or null.");
        return errors;
    }

    // Check required top-level fields
    const requiredFields = ['dailyProgress', 'weakAreas', 'reviews'];
    requiredFields.forEach(field => {
        if (data[field] === undefined) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    if (data.dailyProgress) {
        Object.entries(data.dailyProgress).forEach(([date, dayData]) => {
            if (!dayData) return;

            const completed = dayData.completedBlocks || [];
            const skipped = dayData.skippedReasons || {};

            // Rule: No block has both completed = true AND skipReason
            completed.forEach(blockIdx => {
                if (skipped[blockIdx] !== undefined) {
                    errors.push(`Data Conflict at ${date}: Block ${blockIdx} is marked as both completed and skipped.`);
                }
            });

            // Rule: No NaN or negative values in indices
            completed.forEach(idx => {
                if (typeof idx !== 'number' || isNaN(idx) || idx < 0) {
                    errors.push(`Invalid index in completedBlocks at ${date}: ${idx}`);
                }
            });

            Object.keys(skipped).forEach(idxStr => {
                const idx = parseInt(idxStr);
                if (isNaN(idx) || idx < 0) {
                    errors.push(`Invalid index in skippedReasons at ${date}: ${idxStr}`);
                }
            });
        });
    }

    return errors;
};

/**
 * Creates a daily snapshot if one doesn't exist for today.
 * @param {Object} data The current application data
 */
export const createDailySnapshot = (data) => {
    const today = new Date().toISOString().split('T')[0];
    const snapshotKey = `${SNAPSHOT_PREFIX}${today}`;

    // Only create if it doesn't exist for today
    if (!localStorage.getItem(snapshotKey)) {
        // Only snapshot if data is valid
        const errors = validateData(data);
        if (errors.length === 0) {
            localStorage.setItem(snapshotKey, JSON.stringify({
                timestamp: new Date().toISOString(),
                data: data
            }));
            cleanupOldSnapshots();
        } else {
            console.warn("Skipping snapshot creation due to data validation errors:", errors);
        }
    }
};

/**
 * Lists all available snapshots sorted by date (newest first).
 */
export const getAvailableSnapshots = () => {
    const snapshots = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(SNAPSHOT_PREFIX)) {
            try {
                const content = JSON.parse(localStorage.getItem(key));
                snapshots.push({
                    key: key,
                    date: key.replace(SNAPSHOT_PREFIX, ''),
                    timestamp: content.timestamp
                });
            } catch (e) {
                console.error("Failed to parse snapshot:", key);
            }
        }
    }
    return snapshots.sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Cleans up old snapshots, keeping only the most recent MAX_SNAPSHOTS.
 */
const cleanupOldSnapshots = () => {
    const snapshots = getAvailableSnapshots();
    if (snapshots.length > MAX_SNAPSHOTS) {
        snapshots.slice(MAX_SNAPSHOTS).forEach(s => {
            localStorage.removeItem(s.key);
        });
    }
};

/**
 * Restores data from a specific snapshot.
 * @param {string} snapshotKey 
 */
export const restoreFromSnapshot = (snapshotKey) => {
    try {
        const snapshot = JSON.parse(localStorage.getItem(snapshotKey));
        if (snapshot && snapshot.data) {
            localStorage.setItem(APP_DATA_KEY, JSON.stringify(snapshot.data));
            return true;
        }
    } catch (e) {
        console.error("Failed to restore from snapshot:", e);
    }
    return false;
};
