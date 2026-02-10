import React, { useState } from 'react';
import { formatTimeRange } from '../utils/format';

const TimeBlock = ({ start, end, subject, overriddenSubject, onUpdateSubject, completed, onToggle, readOnly, skipReason, onUpdateReason, isToday }) => {
    const [isEditingReason, setIsEditingReason] = useState(false);
    const [reasonText, setReasonText] = useState(skipReason || '');
    const [isEditingSubject, setIsEditingSubject] = useState(false);
    const [subjectText, setSubjectText] = useState(overriddenSubject || subject);

    // Sync with props when they change
    React.useEffect(() => {
        setSubjectText(overriddenSubject || subject);
    }, [overriddenSubject, subject]);

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

    const handleSubjectClick = (e) => {
        if (!isToday || readOnly) return;
        e.stopPropagation();
        setIsEditingSubject(true);
    };

    const handleSubjectChange = (e) => {
        setSubjectText(e.target.value);
    };

    const handleSubjectBlur = () => {
        setIsEditingSubject(false);
        if (subjectText.trim() && subjectText !== (overriddenSubject || subject)) {
            onUpdateSubject(subjectText);
        } else if (!subjectText.trim()) {
            setSubjectText(overriddenSubject || subject); // Revert if empty
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

    const displaySubject = overriddenSubject || subject;

    return (
        <div className={`time-block ${completed ? 'completed' : 'todo'}`}>
            <div className="time-block-main">
                <div className="block-time">
                    {formatTimeRange(start, end)}
                </div>
                <div className="block-subject" onClick={handleSubjectClick} style={{ cursor: (isToday && !readOnly) ? 'text' : 'default' }}>
                    {isEditingSubject ? (
                        <input
                            type="text"
                            value={subjectText}
                            onChange={handleSubjectChange}
                            onBlur={handleSubjectBlur}
                            onClick={handleInputClick}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="time-block-subject-input"
                            style={{
                                width: '100%',
                                padding: '0.2rem 0.4rem',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                border: '1px solid var(--primary)',
                                borderRadius: '4px',
                                background: 'var(--card-bg)',
                                color: 'var(--text)'
                            }}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {displaySubject}
                            {overriddenSubject && (
                                <span style={{
                                    fontSize: '0.65rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    Edited
                                </span>
                            )}
                        </div>
                    )}
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
