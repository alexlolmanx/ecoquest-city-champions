import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgressCardProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalMissions: number;
  completedMissions: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: "bronze" | "silver" | "gold";
  }>;
}

export const ProgressCard = ({
  level,
  currentXP,
  nextLevelXP,
  totalMissions,
  completedMissions,
  badges
}: ProgressCardProps) => {
  const progressPercentage = (currentXP / nextLevelXP) * 100;
  const missionProgressPercentage = (completedMissions / totalMissions) * 100;

  const rarityClasses = {
    bronze: "badge-bronze",
    silver: "badge-silver", 
    gold: "badge-gold"
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Level {level}</h2>
          <p className="text-sm text-muted-foreground">Eco Champion</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-primary">{currentXP} XP</p>
          <p className="text-xs text-muted-foreground">/ {nextLevelXP} XP</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress to Level {level + 1}</span>
          <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar h-3">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Mission Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Missions Completed</span>
          <span className="text-success font-medium">{completedMissions}/{totalMissions}</span>
        </div>
        <div className="progress-bar h-2">
          <div 
            className="progress-fill bg-success" 
            style={{ width: `${missionProgressPercentage}%` }}
          />
        </div>
      </div>

      {/* Recent Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-foreground">Recent Badges</h3>
        <div className="flex gap-2 flex-wrap">
          {badges.slice(0, 4).map((badge) => (
            <Badge 
              key={badge.id} 
              className={`${rarityClasses[badge.rarity]} text-xs flex items-center gap-1`}
            >
              <span>{badge.icon}</span>
              {badge.name}
            </Badge>
          ))}
          {badges.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{badges.length - 4} more
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};