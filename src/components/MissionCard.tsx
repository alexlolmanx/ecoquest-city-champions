import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, MapPin } from "lucide-react";

interface MissionCardProps {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  timeEstimate: string;
  participants: number;
  location?: string;
  isCompleted?: boolean;
  onStartMission: (id: string) => void;
}

const difficultyColors = {
  easy: "bg-success",
  medium: "bg-warning", 
  hard: "bg-destructive"
};

const categoryIcons = {
  "Recycling": "♻️",
  "Tree Planting": "🌱", 
  "Clean-up": "🧹",
  "Water Conservation": "💧",
  "Pollution Reporting": "📍",
  "Energy Saving": "⚡"
};

export const MissionCard = ({
  id,
  title,
  description,
  points,
  difficulty,
  category,
  timeEstimate,
  participants,
  location,
  isCompleted = false,
  onStartMission
}: MissionCardProps) => {
  return (
    <Card className="mission-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons] || "🌍"}</span>
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-warning">
          <Trophy className="h-4 w-4" />
          {points}
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeEstimate}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants} players
          </div>
        </div>
        
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location}
          </div>
        )}

        <Badge 
          className={`${difficultyColors[difficulty]} text-white text-xs w-fit`}
        >
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      </div>

      <Button 
        onClick={() => onStartMission(id)}
        disabled={isCompleted}
        className={isCompleted ? "bg-muted text-muted-foreground" : "btn-eco-hero"}
        size="sm"
        variant={isCompleted ? "outline" : "default"}
      >
        {isCompleted ? "Completed ✓" : "Start Mission"}
      </Button>
    </Card>
  );
};