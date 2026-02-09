import React from 'react';

const pages = [
    { id: 'today', label: 'Today' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'progress', label: 'Progress' },
    { id: 'review', label: 'Review' }
];

const Navigation = ({ activePage, onNavigate }) => {
    return (
        <nav>
            {pages.map((page) => (
                <button
                    key={page.id}
                    className={activePage === page.id ? 'active' : ''}
                    onClick={() => onNavigate(page.id)}
                >
                    {page.label}
                </button>
            ))}
        </nav>
    );
};

export default Navigation;
