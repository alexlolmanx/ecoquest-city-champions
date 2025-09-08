import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
  level: number;
  badgeCount: number;
}

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export const LeaderboardCard = ({ title, entries, currentUserId }: LeaderboardCardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-gold" />;
      case 2:
        return <Medal className="h-5 w-5 text-silver" />;
      case 3:
        return <Award className="h-5 w-5 text-bronze" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-orange-600";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        {title}
      </h3>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              entry.id === currentUserId 
                ? "bg-primary/10 border border-primary/20 ring-1 ring-primary/20" 
                : "hover:bg-muted/50"
            }`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar} alt={entry.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {entry.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{entry.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Level {entry.level}</span>
                <span>•</span>
                <span>{entry.badgeCount} badges</span>
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="font-bold text-primary">{entry.points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>

            {/* Top 3 Indicator */}
            {entry.rank <= 3 && (
              <div className={`w-1 h-12 rounded-full ${getRankColor(entry.rank)}`} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};