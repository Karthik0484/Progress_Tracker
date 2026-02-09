import React from 'react';

const Header = ({ theme, toggleTheme }) => {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString(undefined, options);

    return (
        <header style={{ position: 'relative' }}>
            <h1>Placement Prep Tracker</h1>
            <div className="header-date">{dateStr}</div>
            <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle Dark Mode"
            >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
        </header>
    );
};

export default Header;
