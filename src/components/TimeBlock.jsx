import React, { useState } from 'react';
import { formatTimeRange } from '../utils/format';

const TimeBlock = ({ start, end, subject, completed, onToggle, readOnly, skipReason, onUpdateReason }) => {
    const [isEditingReason, setIsEditingReason] = useState(false);
    const [reasonText, setReasonText] = useState(skipReason || '');

    const handleReasonClick = (e) => {
        e.stopPropagation();
        setIsEditingReason(true);
    };

    const handleReasonChange = (e) => {
        setReasonText(e.target.value);
    };

    const handleReasonBlur = () => {
        setIsEditingReason(false);
        if (reasonText !== skipReason) {
            onUpdateReason(reasonText);
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className={`time-block ${completed ? 'completed' : 'todo'}`}>
            <div className="time-block-main">
                <div className="block-time">
                    {formatTimeRange(start, end)}
                </div>
                <div className="block-subject">
                    {subject}
                </div>
                {!readOnly && (
                    <div
                        className="checkbox-custom"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {completed && <span>✓</span>}
                    </div>
                )}
            </div>

            {/* Skip Reason Section */}
            {!completed && (
                <div className="time-block-skip-reason-section" style={{ marginTop: '0.2rem', paddingLeft: '0.5rem', fontSize: '0.9rem' }}>
                    {!readOnly && (
                        <>
                            {isEditingReason ? (
                                <input
                                    type="text"
                                    value={reasonText}
                                    onChange={handleReasonChange}
                                    onBlur={handleReasonBlur}
                                    onClick={handleInputClick}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Reason for skipping..."
                                    autoFocus
                                    className="time-block-reason-input"
                                    style={{
                                        width: '100%',
                                        padding: '0.4rem',
                                        fontSize: '0.9rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        marginBottom: 0,
                                        background: 'var(--card-bg)',
                                        color: 'var(--text)'
                                    }}
                                />
                            ) : (
                                <div
                                    onClick={handleReasonClick}
                                    className={`time-block-reason-display ${skipReason ? 'has-reason' : 'no-reason'}`}
                                    style={{
                                        color: skipReason ? '#EF4444' : '#94A3B8',
                                        cursor: 'text',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {skipReason ? (
                                        <span>⚠ {skipReason}</span>
                                    ) : (
                                        <span className="time-block-reason-placeholder" style={{ fontSize: '0.85rem', textDecoration: 'underline', opacity: 0.7 }}>
                                            Select "Why skipped?"
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {readOnly && skipReason && (
                        <div style={{ color: '#EF4444', fontStyle: 'italic' }}>
                            ⚠ {skipReason}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimeBlock;
