// Gamification utilities for focus timer
// Virtual garden, achievements, levels, and rewards

export type TreeType = 'sapling' | 'oak' | 'pine' | 'cherry' | 'bonsai' | 'willow' | 'palm' | 'bamboo';
export type TreeStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'flowering';
export type AchievementType = 'session' | 'streak' | 'time' | 'milestone' | 'special';

export interface Tree {
  id: string;
  type: TreeType;
  stage: TreeStage;
  plantedAt: string;
  sessionId: string;
  durationMinutes: number;
  wateredAt?: string;
  isDead: boolean;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  emoji: string;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface UserProgress {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalFocusMinutes: number;
  totalSessions: number;
  longestStreak: number;
  treesPlanted: number;
  treesAlive: number;
  achievements: Achievement[];
  coins: number;
  unlockedTrees: TreeType[];
}

export const TREE_TYPES: Record<TreeType, { name: string; emoji: string; unlockLevel: number; color: string }> = {
  sapling: { name: 'Sapling', emoji: '🌱', unlockLevel: 1, color: '#8bc34a' },
  oak: { name: 'Oak', emoji: '🌳', unlockLevel: 2, color: '#4caf50' },
  pine: { name: 'Pine', emoji: '🌲', unlockLevel: 3, color: '#2e7d32' },
  cherry: { name: 'Cherry', emoji: '🌸', unlockLevel: 5, color: '#ff69b4' },
  bonsai: { name: 'Bonsai', emoji: '🪴', unlockLevel: 7, color: '#66bb6a' },
  willow: { name: 'Willow', emoji: '🎋', unlockLevel: 10, color: '#81c784' },
  palm: { name: 'Palm', emoji: '🌴', unlockLevel: 12, color: '#64dd17' },
  bamboo: { name: 'Bamboo', emoji: '🎍', unlockLevel: 15, color: '#00e676' },
};

export const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Session achievements
  { id: 'first_session', type: 'session', name: 'First Steps', description: 'Complete your first focus session', emoji: '🎯', requirement: 1, rarity: 'common' },
  { id: 'session_10', type: 'session', name: 'Getting Serious', description: 'Complete 10 focus sessions', emoji: '📈', requirement: 10, rarity: 'common' },
  { id: 'session_50', type: 'session', name: 'Focus Master', description: 'Complete 50 focus sessions', emoji: '🏆', requirement: 50, rarity: 'uncommon' },
  { id: 'session_100', type: 'session', name: 'Legendary Focus', description: 'Complete 100 focus sessions', emoji: '👑', requirement: 100, rarity: 'rare' },

  // Streak achievements
  { id: 'streak_3', type: 'streak', name: 'On Fire', description: 'Maintain a 3-day streak', emoji: '🔥', requirement: 3, rarity: 'common' },
  { id: 'streak_7', type: 'streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', emoji: '⚡', requirement: 7, rarity: 'uncommon' },
  { id: 'streak_14', type: 'streak', name: 'Fortnight Focus', description: 'Maintain a 14-day streak', emoji: '💪', requirement: 14, rarity: 'rare' },
  { id: 'streak_30', type: 'streak', name: 'Monthly Master', description: 'Maintain a 30-day streak', emoji: '🌟', requirement: 30, rarity: 'epic' },

  // Time achievements
  { id: 'time_100', type: 'time', name: 'Century Minutes', description: 'Accumulate 100 focus minutes', emoji: '⏱️', requirement: 100, rarity: 'common' },
  { id: 'time_500', type: 'time', name: 'Half Thousand', description: 'Accumulate 500 focus minutes', emoji: '🕐', requirement: 500, rarity: 'uncommon' },
  { id: 'time_1000', type: 'time', name: 'Thousand Club', description: 'Accumulate 1000 focus minutes', emoji: '⌛', requirement: 1000, rarity: 'rare' },
  { id: 'time_5000', type: 'time', name: 'Time Lord', description: 'Accumulate 5000 focus minutes', emoji: '👽', requirement: 5000, rarity: 'epic' },

  // Milestone achievements
  { id: 'level_5', type: 'milestone', name: 'Rising Star', description: 'Reach level 5', emoji: '⭐', requirement: 5, rarity: 'common' },
  { id: 'level_10', type: 'milestone', name: 'Double Digits', description: 'Reach level 10', emoji: '🔟', requirement: 10, rarity: 'uncommon' },
  { id: 'level_20', type: 'milestone', name: 'Level Cap', description: 'Reach level 20', emoji: '💎', requirement: 20, rarity: 'rare' },

  // Special achievements
  { id: 'perfect_day', type: 'special', name: 'Perfect Day', description: 'Complete 8+ sessions in one day', emoji: '✨', requirement: 8, rarity: 'epic' },
  { id: 'early_bird', type: 'special', name: 'Early Bird', description: 'Complete a session before 6 AM', emoji: '🌅', requirement: 1, rarity: 'uncommon' },
  { id: 'night_owl', type: 'special', name: 'Night Owl', description: 'Complete a session after 11 PM', emoji: '🦉', requirement: 1, rarity: 'uncommon' },
  { id: 'marathon', type: 'special', name: 'Marathon', description: 'Complete a 90+ minute session', emoji: '🏃', requirement: 90, rarity: 'rare' },
];

const LEVEL_BASE_XP = 100;
const LEVEL_MULTIPLIER = 1.5;

// Calculate XP needed for a level
export function getXpForLevel(level: number): number {
  return Math.floor(LEVEL_BASE_XP * Math.pow(level, LEVEL_MULTIPLIER));
}

// Calculate total XP needed to reach a level
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

// Calculate level from total XP
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= getXpForLevel(level)) {
    remaining -= getXpForLevel(level);
    level++;
  }
  return level;
}

// Calculate XP progress
export function getXpProgress(totalXp: number): { level: number; currentXp: number; xpToNext: number } {
  const level = getLevelFromXp(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getTotalXpForLevel(level + 1);
  const currentXp = totalXp - xpForCurrentLevel;
  const xpToNext = xpForNextLevel - xpForCurrentLevel;
  return { level, currentXp, xpToNext };
}

// Get XP for a session
export function getXpForSession(minutes: number, completed: boolean = true): number {
  if (!completed) return 0;
  const baseXp = minutes;
  const bonus = minutes >= 45 ? 10 : minutes >= 25 ? 5 : 0;
  return baseXp + bonus;
}

// Get coins for a session
export function getCoinsForSession(minutes: number, completed: boolean = true): number {
  if (!completed) return 0;
  return Math.floor(minutes / 5);
}

// Determine tree type based on session duration
export function getTreeForSession(minutes: number, userLevel: number): TreeType {
  if (minutes >= 90) return userLevel >= 7 ? 'bonsai' : 'sapling';
  if (minutes >= 45) return userLevel >= 5 ? 'cherry' : 'oak';
  if (minutes >= 25) return userLevel >= 3 ? 'pine' : 'oak';
  return 'sapling';
}

// Get tree stage based on time since planting
export function getTreeStage(plantedAt: string, durationMinutes: number): TreeStage {
  const now = new Date();
  const planted = new Date(plantedAt);
  const hoursSince = (now.getTime() - planted.getTime()) / (1000 * 60 * 60);
  const maturityHours = durationMinutes / 5; // Trees mature faster for demo

  if (hoursSince < 0.5) return 'seed';
  if (hoursSince < maturityHours * 0.25) return 'sprout';
  if (hoursSince < maturityHours * 0.5) return 'growing';
  if (hoursSince < maturityHours) return 'mature';
  return 'flowering';
}

// Check if tree should be dead (neglected)
export function isTreeDead(plantedAt: string, wateredAt?: string): boolean {
  const now = new Date();
  const planted = new Date(plantedAt);
  const hoursSincePlanting = (now.getTime() - planted.getTime()) / (1000 * 60 * 60);

  // Trees die after 48 hours if not watered
  if (!wateredAt) {
    return hoursSincePlanting > 48;
  }

  const watered = new Date(wateredAt);
  const hoursSinceWatering = (now.getTime() - watered.getTime()) / (1000 * 60 * 60);
  return hoursSinceWatering > 24;
}

// Check and update achievements
export function checkAchievements(progress: UserProgress): Achievement[] {
  const now = new Date().toISOString();
  
  // FIX: Ensure currentAchievements is never undefined
  const currentAchievements = progress.achievements || [];

  return ACHIEVEMENTS.map(achievement => {
    // FIX: Use the safe array we just created
    const existing = currentAchievements.find(a => a.id === achievement.id);
    let val = 0;
    
    switch (achievement.type) {
      case 'session': val = progress.totalSessions || 0; break;
      case 'streak': val = progress.longestStreak || 0; break;
      case 'time': val = progress.totalFocusMinutes || 0; break;
      case 'milestone': val = progress.level || 1; break;
      default: val = existing?.progress || 0;
    }
    
    const unlocked = val >= achievement.requirement;
    
    return {
      ...achievement,
      progress: Math.min(val, achievement.requirement),
      unlocked,
      unlockedAt: unlocked && !existing?.unlocked ? now : existing?.unlockedAt,
    };
  });
}

// Get newly unlocked achievements
export function getNewAchievements(before: Achievement[], after: Achievement[]): Achievement[] {
  return after.filter(a => a.unlocked && !before.find(b => b.id === a.id && b.unlocked));
}

// Storage keys
const STORAGE_TREES = 'tl_garden_trees';
const STORAGE_PROGRESS = 'tl_garden_progress';

// Load user progress
export function loadProgress(): UserProgress {
  try {
    const saved = localStorage.getItem(STORAGE_PROGRESS);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        ...data,
        achievements: checkAchievements(data),
      };
    }
  } catch {}

  // Default progress
  return {
    level: 1,
    experience: 0,
    experienceToNextLevel: getXpForLevel(1),
    totalFocusMinutes: 0,
    totalSessions: 0,
    longestStreak: 0,
    treesPlanted: 0,
    treesAlive: 0,
    achievements: checkAchievements({
      level: 1,
      experience: 0,
      totalFocusMinutes: 0,
      totalSessions: 0,
      longestStreak: 0,
    } as any),
    coins: 0,
    unlockedTrees: ['sapling'],
  };
}

// Save user progress
export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
}

// Load trees
export function loadTrees(): Tree[] {
  try {
    const saved = localStorage.getItem(STORAGE_TREES);
    if (saved) {
      const trees: Tree[] = JSON.parse(saved);
      return trees.map(tree => ({
        ...tree,
        stage: getTreeStage(tree.plantedAt, tree.durationMinutes),
        isDead: isTreeDead(tree.plantedAt, tree.wateredAt),
      }));
    }
  } catch {}
  return [];
}

// Save trees
export function saveTrees(trees: Tree[]): void {
  localStorage.setItem(STORAGE_TREES, JSON.stringify(trees));
}

// Plant a new tree
export function plantTree(sessionId: string, durationMinutes: number, userLevel: number): Tree {
  const treeType = getTreeForSession(durationMinutes, userLevel);
  const tree: Tree = {
    id: crypto.randomUUID(),
    type: treeType,
    stage: 'seed',
    plantedAt: new Date().toISOString(),
    sessionId,
    durationMinutes,
    isDead: false,
  };

  const trees = loadTrees();
  trees.push(tree);
  saveTrees(trees);

  // Update progress
  const progress = loadProgress();
  progress.treesPlanted++;
  progress.treesAlive = trees.filter(t => !t.isDead).length;
  saveProgress(progress);

  return tree;
}

// Water a tree
export function waterTree(treeId: string): void {
  const trees = loadTrees();
  const tree = trees.find(t => t.id === treeId);
  if (tree) {
    tree.wateredAt = new Date().toISOString();
    tree.isDead = false;
    saveTrees(trees);
  }
}

// Add session to progress
export function addSessionToProgress(minutes: number, completed: boolean = true): {
  progress: UserProgress;
  newXp: number;
  newCoins: number;
  leveledUp: boolean;
  newAchievements: Achievement[];
} {
  const progress = loadProgress();
  const oldAchievements = [...progress.achievements];

  const xpGained = getXpForSession(minutes, completed);
  const coinsGained = getCoinsForSession(minutes, completed);

  const oldLevel = progress.level;
  progress.experience += xpGained;
  progress.level = getLevelFromXp(progress.experience);
  progress.experienceToNextLevel = getXpForLevel(progress.level);

  if (completed) {
    progress.totalFocusMinutes += minutes;
    progress.totalSessions++;
  }

  progress.coins += coinsGained;

  // Unlock trees based on level
  if (progress.level > oldLevel) {
    for (const [type, config] of Object.entries(TREE_TYPES)) {
      if (config.unlockLevel <= progress.level && !progress.unlockedTrees.includes(type as TreeType)) {
        progress.unlockedTrees.push(type as TreeType);
      }
    }
  }

  // Check achievements
  progress.achievements = checkAchievements(progress);
  const newAchievements = getNewAchievements(oldAchievements, progress.achievements);

  saveProgress(progress);

  return {
    progress,
    newXp: xpGained,
    newCoins: coinsGained,
    leveledUp: progress.level > oldLevel,
    newAchievements,
  };
}

// Get level title
export function getLevelTitle(level: number): string {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 15) return 'Focused';
  if (level < 20) return 'Master';
  return 'Grand Master';
}

// Get all level titles
export function getLevelInfo(level: number): { title: string; progress: number; nextTitle: string } {
  const titles = ['Novice', 'Apprentice', 'Focused', 'Master', 'Grand Master'];
  const ranges = [[1, 4], [5, 9], [10, 14], [15, 19], [20, Infinity]];

  for (let i = 0; i < ranges.length; i++) {
    if (level >= ranges[i][0] && level <= ranges[i][1]) {
      return {
        title: titles[i],
        progress: ((level - ranges[i][0]) / (ranges[i][1] - ranges[i][0])) * 100,
        nextTitle: i < titles.length - 1 ? titles[i + 1] : 'Maximum',
      };
    }
  }

  return { title: 'Grand Master', progress: 100, nextTitle: 'Maximum' };
}
