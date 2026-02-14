import React, { useState, useEffect } from 'react';
import { formatTimeRange } from '../utils/format';

const TimeBlock = ({ start, end, subject, overriddenSubject, onUpdateSubject, overriddenTime, onUpdateTime, completed, onToggle, readOnly, skipReason, onUpdateReason, isToday }) => {
    const [isEditingReason, setIsEditingReason] = useState(false);
    const [reasonText, setReasonText] = useState(skipReason || '');
    const [isEditingSubject, setIsEditingSubject] = useState(false);
    const [subjectText, setSubjectText] = useState(overriddenSubject || subject);

    const [isEditingTime, setIsEditingTime] = useState(false);
    const [startTime, setStartTime] = useState(overriddenTime?.start || start);
    const [endTime, setEndTime] = useState(overriddenTime?.end || end);
    const [timeError, setTimeError] = useState('');

    const displayStart = overriddenTime?.start || start;
    const displayEnd = overriddenTime?.end || end;

    // Sync with props when they change
    useEffect(() => {
        setSubjectText(overriddenSubject || subject);
        setReasonText(skipReason || '');
        setStartTime(overriddenTime?.start || start);
        setEndTime(overriddenTime?.end || end);
        setTimeError('');
    }, [overriddenSubject, subject, skipReason, overriddenTime, start, end]);

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

    const handleTimeClick = (e) => {
        if (!isToday || readOnly) return;
        e.stopPropagation();
        setIsEditingTime(true);
    };

    const submitTimeUpdate = (e) => {
        e.stopPropagation();
        if (startTime === displayStart && endTime === displayEnd) {
            setIsEditingTime(false);
            return;
        }

        const result = onUpdateTime(startTime, endTime);
        if (result && result.error) {
            setTimeError(result.error);
        } else {
            setTimeError('');
            setIsEditingTime(false);
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            if (type === 'time') {
                submitTimeUpdate(e);
            } else {
                e.target.blur();
            }
        }
        if (e.key === 'Escape') {
            if (type === 'time') {
                setIsEditingTime(false);
                setStartTime(displayStart);
                setEndTime(displayEnd);
                setTimeError('');
            } else if (type === 'subject') {
                setIsEditingSubject(false);
                setSubjectText(overriddenSubject || subject);
            }
        }
    };

    const displaySubject = overriddenSubject || subject;

    return (
        <div className={`time-block ${completed ? 'completed' : 'todo'}`}>
            <div className="time-block-zones">
                {/* ZONE 1: TIME */}
                <div className="zone-time">
                    {isEditingTime ? (
                        <div className="time-edit-wrapper" onClick={handleInputClick}>
                            <div className="time-inputs-row">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="time-input-field"
                                    onKeyDown={(e) => handleKeyDown(e, 'time')}
                                    autoFocus
                                />
                                <span className="time-sep">–</span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="time-input-field"
                                    onKeyDown={(e) => handleKeyDown(e, 'time')}
                                />
                                <div className="time-edit-buttons">
                                    <button className="time-btn save" onClick={submitTimeUpdate} title="Save">✓</button>
                                    <button className="time-btn cancel" onClick={(e) => { e.stopPropagation(); setIsEditingTime(false); setTimeError(''); }} title="Cancel">×</button>
                                </div>
                            </div>
                            {timeError && <div className="time-error-hint">{timeError}</div>}
                        </div>
                    ) : (
                        <div className="time-display" onClick={handleTimeClick} style={{ cursor: (isToday && !readOnly) ? 'pointer' : 'default' }}>
                            <span className="time-range-text">{formatTimeRange(displayStart, displayEnd)}</span>
                            {overriddenTime && <span className="badge-edited">Edited</span>}
                        </div>
                    )}
                </div>

                {/* ZONE 2: SUBJECT */}
                <div className="zone-subject" onClick={handleSubjectClick} style={{ cursor: (isToday && !readOnly) ? 'text' : 'default' }}>
                    {isEditingSubject ? (
                        <input
                            type="text"
                            value={subjectText}
                            onChange={handleSubjectChange}
                            onBlur={handleSubjectBlur}
                            onClick={handleInputClick}
                            onKeyDown={(e) => handleKeyDown(e, 'subject')}
                            autoFocus
                            className="subject-edit-input"
                        />
                    ) : (
                        <div className="subject-display">
                            <span className="subject-name-text">{displaySubject}</span>
                            {overriddenSubject && <span className="badge-edited">Edited</span>}
                        </div>
                    )}
                </div>

                {/* ZONE 3: STATUS */}
                <div className="zone-status">
                    <div className="status-container">
                        {!completed && !readOnly && (
                            <div className="skip-reason-wrapper">
                                {isEditingReason ? (
                                    <input
                                        type="text"
                                        value={reasonText}
                                        onChange={handleReasonChange}
                                        onBlur={handleReasonBlur}
                                        onClick={handleInputClick}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Add skip reason..."
                                        autoFocus
                                        className="skip-reason-input"
                                    />
                                ) : (
                                    <div
                                        onClick={handleReasonClick}
                                        className={`skip-reason-display ${skipReason ? 'has-value' : 'placeholder'}`}
                                    >
                                        {skipReason ? (
                                            <span className="reason-text">⚠ {skipReason}</span>
                                        ) : (
                                            <span className="reason-placeholder">Why skipped?</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {readOnly && skipReason && !completed && (
                            <div className="skip-reason-readonly">
                                ⚠ {skipReason}
                            </div>
                        )}

                        {!readOnly && (
                            <div
                                className={`status-checkbox ${skipReason ? 'is-disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!skipReason) onToggle();
                                }}
                                title={skipReason ? "Remove skip reason to complete" : "Toggle completion"}
                            >
                                {completed && <span className="check-icon">✓</span>}
                            </div>
                        )}

                        {readOnly && completed && (
                            <div className="status-checkmark">✓</div>
                        )}
                    </div>
                </div>
            </div>
            {skipReason && !readOnly && !completed && (
                <div className="skip-hint">
                    Remove reason to enable completion check
                </div>
            )}
        </div>
    );
};

export default TimeBlock;
