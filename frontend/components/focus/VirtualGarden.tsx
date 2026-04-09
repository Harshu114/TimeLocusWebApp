'use client';

import { useState, useEffect } from 'react';
import {
  Tree,
  TreeType,
  TREE_TYPES,
  loadTrees,
  loadProgress,
  waterTree,
  getTreeStage,
  isTreeDead,
} from '../../lib/gamification';

interface VirtualGardenProps {
  onTreeSelect?: (tree: Tree) => void;
}

const STAGE_EMOJIS: Record<TreeType, Record<string, string>> = {
  sapling: { seed: '🌰', sprout: '🌱', growing: '🌿', mature: '🌳', flowering: '🌳' },
  oak: { seed: '🌰', sprout: '🌱', growing: '🌳', mature: '🌳', flowering: '🍂' },
  pine: { seed: '🌲', sprout: '🌱', growing: '🌲', mature: '🌲', flowering: '🎄' },
  cherry: { seed: '🌸', sprout: '🌱', growing: '🌸', mature: '🌸', flowering: '🌺' },
  bonsai: { seed: '🪴', sprout: '🌱', growing: '🪴', mature: '🪴', flowering: '🌿' },
  willow: { seed: '🎋', sprout: '🌱', growing: '🎋', mature: '🎋', flowering: '🍃' },
  palm: { seed: '🌴', sprout: '🌱', growing: '🌴', mature: '🌴', flowering: '🥥' },
  bamboo: { seed: '🎍', sprout: '🌱', growing: '🎍', mature: '🎋', flowering: '🎍' },
};

export function VirtualGarden({ onTreeSelect }: VirtualGardenProps) {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [progress, setProgress] = useState(() => loadProgress());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'alive' | 'dead'>('all');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [showWaterModal, setShowWaterModal] = useState(false);

  useEffect(() => {
    const t = loadTrees();
    const p = loadProgress();
    setTrees(t);
    setProgress(p);
  }, []);

  const refreshTrees = () => {
    const t = loadTrees();
    const p = loadProgress();
    setTrees(t);
    setProgress(p);
  };

  const handleWater = (treeId: string) => {
    waterTree(treeId);
    refreshTrees();
    setShowWaterModal(false);
  };

  const filteredTrees = trees.filter(tree => {
    if (filter === 'alive') return !tree.isDead;
    if (filter === 'dead') return tree.isDead;
    return true;
  });

  const aliveCount = trees.filter(t => !t.isDead).length;
  const deadCount = trees.filter(t => t.isDead).length;

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
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.2)',
  };

  const statStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.82rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 12,
    padding: 16,
    maxHeight: 400,
    overflowY: 'auto',
  };

  const treeCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: '0.2s',
    opacity: selectedTree?.isDead ? 0.5 : 1,
  };

  if (trees.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.1rem' }}>🌳</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
              Virtual Garden
            </span>
          </div>
        </div>
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem',
          }}
        >
          🌱 Complete focus sessions to plant trees in your garden!
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>🌳</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            Virtual Garden
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: viewMode === 'grid' ? 'rgba(0,220,255,0.2)' : 'transparent',
              border: '1px solid rgba(0,220,255,0.3)',
              color: viewMode === 'grid' ? '#00dcff' : 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: viewMode === 'list' ? 'rgba(0,220,255,0.2)' : 'transparent',
              border: '1px solid rgba(0,220,255,0.3)',
              color: viewMode === 'list' ? '#00dcff' : 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={statsStyle}>
        <div style={statStyle}>
          <span>🌳</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
            Total: <strong style={{ color: '#fff' }}>{trees.length}</strong>
          </span>
        </div>
        <div style={statStyle}>
          <span>🌿</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
            Alive: <strong style={{ color: '#4caf50' }}>{aliveCount}</strong>
          </span>
        </div>
        <div style={statStyle}>
          <span>🥀</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wilted: <strong style={{ color: '#ff6464' }}>{deadCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {(['all', 'alive', 'dead'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              background: filter === f ? 'rgba(0,220,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f ? 'rgba(0,220,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? '#00dcff' : 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tree Grid */}
      {viewMode === 'grid' ? (
        <div style={gridStyle}>
          {filteredTrees.map(tree => {
            const treeConfig = TREE_TYPES[tree.type];
            const emoji = STAGE_EMOJIS[tree.type][tree.stage] || '🌱';
            const isDead = tree.isDead;

            return (
              <div
                key={tree.id}
                onClick={() => {
                  setSelectedTree(tree);
                  onTreeSelect?.(tree);
                }}
                style={{
                  ...treeCardStyle,
                  borderColor: isDead
                    ? 'rgba(255,100,100,0.2)'
                    : `${treeConfig.color}44`,
                  background: isDead
                    ? 'rgba(255,100,100,0.05)'
                    : `${treeConfig.color}11`,
                }}
              >
                <div
                  style={{
                    fontSize: '2.5rem',
                    filter: isDead ? 'grayscale(100%)' : 'none',
                    marginBottom: 8,
                  }}
                >
                  {emoji}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: isDead ? 'rgba(255,255,255,0.4)' : treeConfig.color,
                    fontWeight: 600,
                  }}
                >
                  {treeConfig.name}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 4,
                  }}
                >
                  {tree.stage}
                </div>
                {isDead && (
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: '#ff6464',
                      marginTop: 4,
                    }}
                  >
                    Wilted 💀
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {filteredTrees.map(tree => {
            const treeConfig = TREE_TYPES[tree.type];
            const emoji = STAGE_EMOJIS[tree.type][tree.stage] || '🌱';
            const isDead = tree.isDead;

            return (
              <div
                key={tree.id}
                onClick={() => {
                  setSelectedTree(tree);
                  onTreeSelect?.(tree);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: isDead
                    ? 'rgba(255,100,100,0.03)'
                    : `${treeConfig.color}08`,
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    filter: isDead ? 'grayscale(100%)' : 'none',
                  }}
                >
                  {emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isDead ? 'rgba(255,255,255,0.5)' : '#fff',
                    }}
                  >
                    {treeConfig.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tree.stage} • {new Date(tree.plantedAt).toLocaleDateString()}
                  </div>
                </div>
                {isDead ? (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#ff6464',
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,100,100,0.1)',
                    }}
                  >
                    Wilted
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      handleWater(tree.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: 'rgba(0,220,255,0.1)',
                      border: '1px solid rgba(0,220,255,0.3)',
                      color: '#00dcff',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    💧 Water
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tree Detail Modal */}
      {selectedTree && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedTree(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(30,30,40,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: '90%',
            }}
          >
            <div
              style={{
                fontSize: '4rem',
                textAlign: 'center',
                marginBottom: 16,
                filter: selectedTree.isDead ? 'grayscale(100%)' : 'none',
              }}
            >
              {STAGE_EMOJIS[selectedTree.type][selectedTree.stage]}
            </div>
            <h3
              style={{
                textAlign: 'center',
                color: selectedTree.isDead
                  ? 'rgba(255,255,255,0.5)'
                  : TREE_TYPES[selectedTree.type].color,
                marginBottom: 16,
              }}
            >
              {TREE_TYPES[selectedTree.type].name}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Stage</div>
                <div style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedTree.stage}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Duration</div>
                <div style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedTree.durationMinutes}m</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Planted</div>
                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {new Date(selectedTree.plantedAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Status</div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: selectedTree.isDead ? '#ff6464' : '#4caf50',
                  }}
                >
                  {selectedTree.isDead ? 'Wilted' : 'Healthy'}
                </div>
              </div>
            </div>
            {!selectedTree.isDead && (
              <button
                onClick={() => handleWater(selectedTree.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 6,
                  background: 'linear-gradient(105deg, #00dcff, #00dcffcc)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                💧 Water Tree
              </button>
            )}
            {selectedTree.isDead && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.82rem',
                }}
              >
                This tree has wilted. Complete more sessions to grow new trees! 🌱
              </div>
            )}
            <button
              onClick={() => setSelectedTree(null)}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px',
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
