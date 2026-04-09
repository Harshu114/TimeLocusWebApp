'use client';

import { useState, useEffect, useRef } from 'react';

export type InterruptionType = 'internal' | 'external' | 'notification' | 'person' | 'other';

export interface InterruptionRecord {
  id: string;
  sessionId: string;
  type: InterruptionType;
  description: string;
  timestamp: string;
  resolved?: boolean;
  convertedToTaskId?: string;
}

interface InterruptionLogProps {
  sessionId: string;
  onInterrupt?: (record: InterruptionRecord) => void;
  isSessionActive?: boolean;
}

const INTERRUPTION_TYPES: Record<InterruptionType, { label: string; emoji: string; color: string }> = {
  internal: { label: 'Internal Thought', emoji: '💭', color: '#8c3cff' },
  external: { label: 'External Distraction', emoji: '🔊', color: '#ff9500' },
  notification: { label: 'Notification', emoji: '📱', color: '#ff4466' },
  person: { label: 'Person Interruption', emoji: '👤', color: '#00dcff' },
  other: { label: 'Other', emoji: '📝', color: '#888' },
};

const STORAGE_KEY = 'tl_interruptions';

export function InterruptionLog({ sessionId, onInterrupt, isSessionActive = true }: InterruptionLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quickCapture, setQuickCapture] = useState('');
  const [selectedType, setSelectedType] = useState<InterruptionType>('internal');
  const [records, setRecords] = useState<InterruptionRecord[]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load interruptions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const all: InterruptionRecord[] = JSON.parse(saved);
        setRecords(all.filter(r => r.sessionId === sessionId));
      }
    } catch {}
  }, [sessionId]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addInterruption = () => {
    if (!quickCapture.trim()) return;

    const record: InterruptionRecord = {
      id: crypto.randomUUID(),
      sessionId,
      type: selectedType,
      description: quickCapture.trim(),
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const all: InterruptionRecord[] = saved ? JSON.parse(saved) : [];
      all.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}

    setRecords(prev => [...prev, record]);
    onInterrupt?.(record);

    // Reset
    setQuickCapture('');
    setShowTypeSelector(false);
    setSelectedType('internal');
    setIsOpen(false);
  };

  const deleteRecord = (id: string) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const all: InterruptionRecord[] = JSON.parse(saved);
        const filtered = all.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const markResolved = (id: string) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, resolved: !r.resolved } : r))
    );
  };

  const getCount = () => records.length;
  const getUnresolvedCount = () => records.filter(r => !r.resolved).length;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.02)',
    cursor: isSessionActive ? 'pointer' : 'default',
    userSelect: 'none',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 12,
    background: getCount() > 0 ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.05)',
    border: getCount() > 0 ? '1px solid rgba(255,100,100,0.3)' : '1px solid rgba(255,255,255,0.1)',
    fontSize: '0.72rem',
    color: getCount() > 0 ? '#ff6464' : 'rgba(255,255,255,0.5)',
  };

  const sectionStyle: React.CSSProperties = {
    padding: 16,
  };

  if (!isSessionActive && records.length === 0) {
    return null;
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={() => isSessionActive && setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>📋</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            Interruption Log
          </span>
        </div>
        <div style={badgeStyle}>
          {getUnresolvedCount() > 0 && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ff6464',
                boxShadow: '0 0 6px #ff6464',
              }}
            />
          )}
          <span>{getCount()} logged</span>
        </div>
      </div>

      {isOpen && isSessionActive && (
        <div style={sectionStyle}>
          {/* Quick Capture */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="💭 Quick capture distraction..."
              value={quickCapture}
              onChange={(e) => setQuickCapture(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addInterruption()}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                transition: '0.2s',
              }}
              onFocus={() => setShowTypeSelector(true)}
            />
            <button
              onClick={addInterruption}
              disabled={!quickCapture.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                background: quickCapture.trim()
                  ? 'linear-gradient(105deg, #00dcff, #00dcffcc)'
                  : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: quickCapture.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: quickCapture.trim() ? 'pointer' : 'not-allowed',
                transition: '0.2s',
              }}
            >
              + Log
            </button>
          </div>

          {/* Type Selector */}
          {showTypeSelector && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                marginBottom: 12,
              }}
            >
              {(Object.entries(INTERRUPTION_TYPES) as [InterruptionType, typeof INTERRUPTION_TYPES[InterruptionType]][]).map(
                ([type, { label, emoji, color }]) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowTypeSelector(false);
                    }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 6,
                      background:
                        selectedType === type
                          ? `${color}22`
                          : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedType === type ? color : 'rgba(255,255,255,0.08)'}`,
                      color: selectedType === type ? color : 'rgba(255,255,255,0.5)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: '0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                    <span style={{ fontSize: '0.65rem' }}>{label}</span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Selected Type Display */}
          {selectedType && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                background: `${INTERRUPTION_TYPES[selectedType].color}11`,
                border: `1px solid ${INTERRUPTION_TYPES[selectedType].color}33`,
                marginBottom: 12,
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <span>{INTERRUPTION_TYPES[selectedType].emoji}</span>
              <span>Logging as: </span>
              <span style={{ color: INTERRUPTION_TYPES[selectedType].color, fontWeight: 600 }}>
                {INTERRUPTION_TYPES[selectedType].label}
              </span>
              <button
                onClick={() => setShowTypeSelector(true)}
                style={{
                  marginLeft: 'auto',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                Change
              </button>
            </div>
          )}

          {/* Logged Interruptions */}
          {records.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 8,
                }}
              >
                Logged Distractions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {records.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: record.resolved
                        ? 'rgba(0,255,136,0.05)'
                        : 'rgba(255,255,255,0.03)',
                      border: record.resolved
                        ? '1px solid rgba(0,255,136,0.15)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>
                      {INTERRUPTION_TYPES[record.type].emoji}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: record.resolved ? 'rgba(0,255,136,0.8)' : '#fff',
                          textDecoration: record.resolved ? 'line-through' : 'none',
                        }}
                      >
                        {record.description}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(255,255,255,0.4)',
                          marginTop: 2,
                        }}
                      >
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => markResolved(record.id)}
                        title={record.resolved ? 'Mark unresolved' : 'Mark resolved'}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: record.resolved
                            ? 'rgba(0,255,136,0.1)'
                            : 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: record.resolved ? '#00ff88' : 'rgba(255,255,255,0.5)',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        {record.resolved ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        title="Delete"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: 'rgba(255,100,100,0.1)',
                          border: '1px solid rgba(255,100,100,0.2)',
                          color: '#ff6464',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 6,
              background: 'rgba(0,220,255,0.08)',
              border: '1px solid rgba(0,220,255,0.15)',
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            💡 <strong>Tip:</strong> Capture distractions quickly to clear your mind. Review them
            after your session!
          </div>
        </div>
      )}

      {!isSessionActive && records.length > 0 && (
        <div style={sectionStyle}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 8,
            }}
          >
            Session Interruptions ({records.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {records.map((record) => (
              <div
                key={record.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <span>{INTERRUPTION_TYPES[record.type].emoji}</span>
                <span style={{ flex: 1 }}>{record.description}</span>
                <button
                  onClick={() => deleteRecord(record.id)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Get all interruptions for a session
export function getSessionInterruptions(sessionId: string): InterruptionRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const all: InterruptionRecord[] = JSON.parse(saved);
      return all.filter((r) => r.sessionId === sessionId);
    }
  } catch {}
  return [];
}

// Get interruption stats
export function getInterruptionStats(sessionIds?: string[]): {
  total: number;
  byType: Record<InterruptionType, number>;
  unresolved: number;
} {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const all: InterruptionRecord[] = JSON.parse(saved);
      const filtered = sessionIds
        ? all.filter((r) => sessionIds.includes(r.sessionId))
        : all;

      const byType = {
        internal: 0,
        external: 0,
        notification: 0,
        person: 0,
        other: 0,
      } as Record<InterruptionType, number>;

      let unresolved = 0;

      filtered.forEach((r) => {
        byType[r.type]++;
        if (!r.resolved) unresolved++;
      });

      return {
        total: filtered.length,
        byType,
        unresolved,
      };
    }
  } catch {}

  return {
    total: 0,
    byType: { internal: 0, external: 0, notification: 0, person: 0, other: 0 },
    unresolved: 0,
  };
}
