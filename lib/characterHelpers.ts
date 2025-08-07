/**
 * Helper functions for character data and interactions
 */

// Trigger character data refresh across components
export const triggerCharacterRefresh = () => {
  // Use localStorage to signal other components to refresh
  localStorage.setItem('health_data_updated', Date.now().toString());
  
  // Trigger storage event for same-tab communication
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'health_data_updated',
    newValue: Date.now().toString()
  }));
};

// Character interaction helpers
export const triggerCharacterInteraction = (duration: number = 2000) => {
  // You can extend this to integrate with character components
  console.log('Character interaction triggered');
  
  // Trigger refresh to update stats
  triggerCharacterRefresh();
};

// Health data event handlers
export const onHealthDataCreated = (healthLog: any) => {
  console.log('New health data created:', healthLog);
  triggerCharacterInteraction();
};

export const onHealthDataUpdated = (healthLog: any) => {
  console.log('Health data updated:', healthLog);
  triggerCharacterRefresh();
};

export const onHealthDataDeleted = (healthLogId: string) => {
  console.log('Health data deleted:', healthLogId);
  triggerCharacterRefresh();
};

// Calculate health score for immediate feedback
export const calculateQuickHealthScore = (healthLogs: any[]) => {
  if (!healthLogs || healthLogs.length === 0) return 25;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentLogs = healthLogs.filter(log => 
    new Date(log.date) >= oneWeekAgo
  );
  
  let score = 50; // Base score
  
  // Recent activity bonus
  score += Math.min(recentLogs.length * 3, 25);
  
  // Exercise bonus
  const exerciseLogs = recentLogs.filter(log => log.type === 'exercise');
  score += Math.min(exerciseLogs.length * 5, 15);
  
  // Mood bonus
  const moodLogs = recentLogs.filter(log => log.type === 'mood');
  if (moodLogs.length > 0) {
    const recentMood = moodLogs[0].data?.mood;
    if (recentMood === 'happy' || recentMood === 'excited') score += 10;
    else if (recentMood === 'neutral') score += 5;
  }
  
  return Math.min(Math.max(score, 0), 100);
};

// Mood helpers
export const getMoodEmoji = (mood: string) => {
  switch (mood) {
    case 'happy': return '😊';
    case 'excited': return '🤗';
    case 'neutral': return '😐';
    case 'sad': return '😢';
    case 'anxious': return '😟';
    case 'sleeping': return '😴';
    default: return '🙂';
  }
};

export const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'happy': return 'text-green-500';
    case 'excited': return 'text-yellow-500';
    case 'neutral': return 'text-gray-500';
    case 'sad': return 'text-blue-500';
    case 'anxious': return 'text-orange-500';
    case 'sleeping': return 'text-purple-500';
    default: return 'text-gray-500';
  }
};