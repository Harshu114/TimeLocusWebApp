'use client';

import { useState, useEffect } from 'react';
import {
  loadProgress,
  Achievement,
  ACHIEVEMENTS,
  getLevelInfo,
  getLevelTitle,
  TREE_TYPES,
} from '../../lib/gamification';

interface RewardsPanelProps {
  onOpen?: () => void;
}

const RARITY_COLORS = {
  common: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.6)' },
  uncommon: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', text: '#00ff88' },
  rare: { bg: 'rgba(0,220,255,0.08)', border: 'rgba(0,220,255,0.25)', text: '#00dcff' },
  epic: { bg: 'rgba(140,60,255,0.08)', border: 'rgba(140,60,255,0.25)', text: '#8c3cff' },
  legendary: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.25)', text: '#ffd700' },
};

export function RewardsPanel({ onOpen }: RewardsPanelProps) {
  const [progress, setProgress] = useState(() => loadProgress());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'stats' | 'levels'>('achievements');

  useEffect(() => {
    const updateProgress = () => setProgress(loadProgress());
    updateProgress();

    // Listen for storage changes (sync across tabs)
    const handler = () => updateProgress();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const levelInfo = getLevelInfo(progress.level);
  const unlockedCount = progress.achievements.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

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
    cursor: 'pointer',
  };

  const sectionStyle: React.CSSProperties = {
    padding: 16,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 12,
    background: 'rgba(255,215,0,0.1)',
    border: '1px solid rgba(255,215,0,0.25)',
    fontSize: '0.72rem',
    color: '#ffd700',
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>🏆</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            Rewards & Achievements
          </span>
        </div>
        <div style={badgeStyle}>
          <span>📊</span>
          <span>Lvl {progress.level}</span>
          <span>•</span>
          <span>{unlockedCount}/{totalCount}</span>
        </div>
      </div>

      {isOpen && (
        <div>
          {/* Level Progress */}
          <div style={sectionStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  {getLevelTitle(progress.level)}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Level {progress.level}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                  {Math.round((progress.experience / progress.experienceToNextLevel) * 100)}% to Level {progress.level + 1}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ffd700' }}>
                  {progress.experience} / {progress.experienceToNextLevel} XP
                </div>
              </div>
            </div>
            <div
              style={{
                height: 8,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(progress.experience / progress.experienceToNextLevel) * 100}%`,
                  background: 'linear-gradient(90deg, #00dcff, #8c3cff)',
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              padding: '0 16px 16px',
            }}
          >
            <div
              style={{
                padding: 12,
                background: 'rgba(0,220,255,0.05)',
                border: '1px solid rgba(0,220,255,0.15)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#00dcff' }}>
                {progress.totalSessions}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Sessions
              </div>
            </div>
            <div
              style={{
                padding: 12,
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.15)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#00ff88' }}>
                {progress.totalFocusMinutes}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Minutes
              </div>
            </div>
            <div
              style={{
                padding: 12,
                background: 'rgba(255,215,0,0.05)',
                border: '1px solid rgba(255,215,0,0.15)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffd700' }}>
                {progress.coins}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Coins
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '0 16px',
              marginBottom: 12,
            }}
          >
            {(['achievements', 'stats', 'levels'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  background: activeTab === tab ? 'rgba(0,220,255,0.1)' : 'transparent',
                  border: `1px solid ${activeTab === tab ? 'rgba(0,220,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === tab ? '#00dcff' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          {activeTab === 'achievements' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
                padding: '0 16px 16px',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              {progress.achievements.map(achievement => {
                const rarity = RARITY_COLORS[achievement.rarity];
                const progress_pct = (achievement.progress / achievement.requirement) * 100;

                return (
                  <div
                    key={achievement.id}
                    style={{
                      padding: 10,
                      background: achievement.unlocked ? rarity.bg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${achievement.unlocked ? rarity.border : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 8,
                      opacity: achievement.unlocked ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>
                      {achievement.unlocked ? achievement.emoji : '🔒'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: achievement.unlocked ? rarity.text : 'rgba(255,255,255,0.4)',
                        marginBottom: 4,
                      }}
                    >
                      {achievement.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.4)',
                        marginBottom: 6,
                      }}
                    >
                      {achievement.description}
                    </div>
                    {!achievement.unlocked && (
                      <div
                        style={{
                          height: 3,
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(progress_pct, 100)}%`,
                            background: rarity.text,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div style={sectionStyle}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>Total Sessions</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{progress.totalSessions}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>Focus Minutes</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{progress.totalFocusMinutes}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>Longest Streak</span>
                  <span style={{ color: '#ff9500', fontWeight: 600 }}>{progress.longestStreak} days</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>Trees Planted</span>
                  <span style={{ color: '#4caf50', fontWeight: 600 }}>{progress.treesPlanted}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>Trees Alive</span>
                  <span style={{ color: '#00ff88', fontWeight: 600 }}>{progress.treesAlive}</span>
                </div>
              </div>
            </div>
          )}

          {/* Levels Tab */}
          {activeTab === 'levels' && (
            <div style={sectionStyle}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {(Object.entries(TREE_TYPES) as [any, any][]).map(([type, config]) => {
                  const unlocked = progress.unlockedTrees.includes(type);
                  return (
                    <div
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: unlocked ? `${config.color}11` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${unlocked ? `${config.color}33` : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 6,
                        opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      <div style={{ fontSize: '1.5rem' }}>{config.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: unlocked ? config.color : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                          {config.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                          Unlocks at Level {config.unlockLevel}
                        </div>
                      </div>
                      {unlocked ? (
                        <span style={{ color: config.color, fontSize: '0.7rem' }}>✓ Unlocked</span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>🔒 Locked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
