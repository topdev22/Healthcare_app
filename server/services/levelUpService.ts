import DashboardStats from '../models/DashboardStats';
import Achievement from '../models/Achievement';

interface LevelUpInfo {
  newLevel: number;
  previousLevel: number;
  totalExp: number;
  achievements?: any[];
}

export class LevelUpService {
  /**
   * Check if user has leveled up and handle level-up rewards
   */
  static async checkLevelUp(userId: string, newCharacterLevel: number, totalExp: number): Promise<LevelUpInfo | null> {
    try {
      // Get previous dashboard stats
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const previousStats = await DashboardStats.findOne({
        userId,
        date: { $lte: yesterday }
      }).sort({ date: -1 });

      const previousLevel = previousStats?.characterLevel || 1;

      // Check if level increased
      if (newCharacterLevel > previousLevel) {
        console.log(`🎉 User ${userId} leveled up from ${previousLevel} to ${newCharacterLevel}!`);

        // Award level-up achievements
        const levelUpAchievements = await this.awardLevelUpAchievements(userId, newCharacterLevel);

        return {
          newLevel: newCharacterLevel,
          previousLevel,
          totalExp,
          achievements: levelUpAchievements
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking level up:', error);
      return null;
    }
  }

  /**
   * Award achievements for reaching certain levels
   */
  private static async awardLevelUpAchievements(userId: string, newLevel: number): Promise<any[]> {
    const levelMilestones = [5, 10, 15, 20, 25, 30, 50, 75, 100];
    const newAchievements = [];

    try {
      for (const milestone of levelMilestones) {
        if (newLevel >= milestone) {
          // Check if achievement already exists
          const existingAchievement = await Achievement.findOne({
            userId,
            type: 'custom',
            'metadata.targetValue': milestone,
            title: { $regex: `レベル${milestone}` }
          });

          if (!existingAchievement) {
            // Create level milestone achievement
            const achievement = new Achievement({
              userId,
              type: 'custom',
              title: `レベル${milestone}達成！`,
              description: `キャラクターがレベル${milestone}に到達しました`,
              icon: this.getLevelIcon(milestone),
              experiencePoints: milestone * 5,
              requirement: {
                target: milestone,
                current: newLevel,
                unit: 'level'
              },
              isCompleted: true,
              completedAt: new Date(),
              category: 'milestone',
              rarity: this.getLevelRarity(milestone),
              metadata: {
                targetValue: milestone
              }
            });

            await achievement.save();
            newAchievements.push(achievement);
          }
        }
      }
    } catch (error) {
      console.error('Error awarding level up achievements:', error);
    }

    return newAchievements;
  }

  /**
   * Get appropriate icon for level milestone
   */
  private static getLevelIcon(level: number): string {
    if (level >= 100) return '👑';
    if (level >= 50) return '🏆';
    if (level >= 25) return '🥇';
    if (level >= 10) return '🌟';
    return '⭐';
  }

  /**
   * Get rarity based on level milestone
   */
  private static getLevelRarity(level: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (level >= 100) return 'legendary';
    if (level >= 50) return 'epic';
    if (level >= 25) return 'rare';
    return 'common';
  }

  /**
   * Generate congratulatory message for level up
   */
  static generateLevelUpMessage(levelUpInfo: LevelUpInfo): string {
    const { newLevel, previousLevel } = levelUpInfo;
    
    const messages = [
      `🎉 おめでとうございます！レベル${newLevel}に到達しました！`,
      `✨ すばらしい！あなたのキャラクターがレベル${newLevel}になりました！`,
      `🌟 レベルアップ！レベル${previousLevel}からレベル${newLevel}に成長しました！`,
      `🎊 やりました！継続的な健康管理でレベル${newLevel}を達成！`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default LevelUpService;