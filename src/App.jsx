import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Today from './pages/Today';
import Timetable from './pages/Timetable';
import Progress from './pages/Progress';
import WeeklyReview from './pages/WeeklyReview';
import { useTracker } from './hooks/useTracker';
import './App.css';

function App() {
  const {
    data,
    todayKey,
    toggleBlock,
    updateNotes,
    toggleLeetCode,
    updateWeakAreas,
    saveReview,
    getDayStats,
    updateSkipReason,
    updateOverriddenSubject
  } = useTracker();

  const [currentPage, setCurrentPage] = useState('today');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return (
          <Today
            todayKey={todayKey}
            dailyData={data.dailyProgress[todayKey] || { completedBlocks: [], notes: '', leetcode: false, overriddenSubjects: {} }}
            toggleBlock={toggleBlock}
            updateNotes={updateNotes}
            toggleLeetCode={toggleLeetCode}
            updateSkipReason={updateSkipReason}
            updateOverriddenSubject={updateOverriddenSubject}
          />
        );
      case 'timetable':
        return <Timetable />;
      case 'progress':
        return (
          <Progress
            data={data}
            updateWeakAreas={updateWeakAreas}
            getDayStats={getDayStats}
            todayKey={todayKey}
            onNavigateToToday={() => setCurrentPage('today')}
          />
        );
      case 'review':
        return <WeeklyReview data={data} saveReview={saveReview} getDayStats={getDayStats} todayKey={todayKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Navigation activePage={currentPage} onNavigate={setCurrentPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
