# 🎯 Placement Prep Tracker

A high-performance, minimalist React application designed to help students maintain consistency during rigorous placement preparation.

---

## 🚀 The Problem It Solves
Placement preparation often fails not due to lack of resources, but lack of **consistent execution**. Tracking diverse subjects (CS fundamentals, DSA, LeetCode) across multiple days becomes mentally taxing.

This tracker centralizes your preparation by:
- **Organizing Chaos**: Converting a complex 7-day timetable into manageable "Today" tasks.
- **Visualizing Effort**: Using a GitHub-style consistency heatmap to reveal gaps in your routine.
- **Maintaining Momentum**: Enforcing a "Streak" system that rewards high completion rates (≥70%).

---

## 📱 Visual Experience (Desktop & Mobile)

*Premium aesthetics meet functional design.*

| Desktop View | Mobile Experience |
| :--- | :--- |
| ![Desktop Mockup](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png) | 📱 Specialized **Floating Bottom Nav** for one-handed use. |
| Full-width consistency heatmap with active year-selection. | **Collapsible Sections** in the timetable to focus on today. |
| Glassmorphism sidebars and sticky headers. | Tappable 44px targets for flawless interaction. |

---

## 🛠 Key Design Decisions

### 1. Zero Backend (Data Privacy & Speed)
- **Why?** To ensure zero latency and 100% privacy. Your data never leaves your device.
- **How?** Leverages the browser's `localStorage` API for instant persistence.
- **Benefit?** Works offline, loads instantly, and requires no login/signup friction.

### 2. High-Density Heatmap (Consistency Focus)
- Modeled after the GitHub contribution graph.
- Scoped to a **single-year view** to prevent month-label overlap.
- Dynamic color intensity based on completion percentage.

### 3. Glassmorphism & Segments
- Uses modern `backdrop-filter` effects for a premium "Apple-like" aesthetic.
- Employs **Segmented Controls** for navigation, providing clear visual feedback of the active page.

---

## 🔥 How Streaks Work
The tracker doesn't just log data; it gamifies consistency through a strict **Validation Logic**:

1. **The Threshold**: A day is only counted as a "Valid Study Day" if you complete **≥ 70%** of your total scheduled hours.
2. **Current Streak**: The number of consecutive days you've hit the 70% mark leading up to today.
3. **Best Streak**: Your all-time record, stored permanently to motivate you to beat your previous self.
4. **Visual Cues**: 
   - 🟩 **Green (Level 3)**: ≥ 70% (Maintains streak)
   - 🟨 **Yellow (Level 2)**: 30-69% (Participation)
   - 🟥 **Red (Level 1)**: < 30% (Breaking point)

---

## 🚀 Getting Started

1. **Install Dependencies**: `npm install`
2. **Launch App**: `npm run dev`
3. **Persist Progress**: Ensure your browser doesn't clear `localStorage` routinely.

---

## 🏗 Tech Stack
- **Library**: React 18
- **Build Tool**: Vite (Lightning fast HMR)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox Grid, Media Queries)
- **State Management**: React Memoization & Hooks
