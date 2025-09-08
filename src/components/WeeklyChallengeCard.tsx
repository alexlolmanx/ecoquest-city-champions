import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Target } from "lucide-react";

interface WeeklyChallengeCardProps {
  title: string;
  description: string;
  goal: number;
  currentProgress: number;
  participants: number;
  timeLeft: string;
  reward: string;
  isParticipating: boolean;
  onJoinChallenge: () => void;
}

export const WeeklyChallengeCard = ({
  title,
  description,
  goal,
  currentProgress,
  participants,
  timeLeft,
  reward,
  isParticipating,
  onJoinChallenge
}: WeeklyChallengeCardProps) => {
  const progressPercentage = Math.min((currentProgress / goal) * 100, 100);

  return (
    <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/30">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Badge className="bg-accent text-accent-foreground mb-2">
            Weekly Challenge
          </Badge>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timeLeft}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mb-4">{description}</p>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Community Progress</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {currentProgress.toLocaleString()} / {goal.toLocaleString()}
          </span>
        </div>
        
        <div className="progress-bar h-4 mb-2">
          <div 
            className="progress-fill flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage > 10 && `${Math.round(progressPercentage)}%`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.toLocaleString()} participants
          </div>
          <span>Reward: {reward}</span>
        </div>
      </div>

      <Button 
        onClick={onJoinChallenge}
        disabled={isParticipating}
        className={isParticipating ? "bg-success text-success-foreground" : "btn-eco-secondary"}
        size="sm"
      >
        {isParticipating ? "Participating ✓" : "Join Challenge"}
      </Button>
    </Card>
  );
};