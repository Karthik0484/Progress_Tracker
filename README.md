# Placement Preparation Tracker

A clean, minimalist React application to track your weekly study schedule, monitor progress, solve daily LeetCode problems, and perform weekly reviews.

## Features

- **Today's Schedule**: Interactive checklist for daily study blocks.
- **Timetable**: Read-only view of the full weekly plan.
- **Progress Tracking**: Visual progress bars for subjects and problem solving stats.
- **Weekly Review**: Reflection form to track consistency and improve.
- **Local Storage**: All data persists in your browser automatically.

## How to Run Locally

1. Open a terminal in the project folder:
   ```bash
   cd c:/Users/KARTHIK/OneDrive/Desktop/ProgressTracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the local URL provided (usually `http://localhost:5173`) in your browser.

## Tech Stack & Data Persistence

- React (Vite)
- CSS (Vanilla, responsive)

### Local Storage Usage
The application uses the browser's `localStorage` API to persist data as JSON under the key `placement_tracker_data`.
- **Daily Progress**: Stores completion status of blocks, notes, and LeetCode problems for each date.
- **Weak Areas**: Stores list of topics needing review.
- **Weekly Reviews**: Stores weekly reflections and plans.

Since there is no backend, data is stored only on this browser/device. Clearing browser data will reset progress.
